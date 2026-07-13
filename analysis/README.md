# UB5 — Пошаговый гайд реализации

Это **маршрут**, а не справочник. Идёшь строго сверху вниз. Каждая фаза = один запускаемый, проверяемый результат. Ты **не переходишь дальше**, пока не прошёл «Проверку» в конце фазы. В любой момент ответ на вопрос «что я сейчас делаю?» = «добиваюсь, чтобы прошла проверка текущей фазы».

> Полное «что/зачем» (таблица всех Optional Equipment, arc42, ссылки на лекции, MS_TA) — в `UB5_ImplementationPlan.md`. Сюда заглядывай за деталями полей и документацией. Строишь — по этому файлу.

---

## Карта фаз (глянь сюда, если потерялся)

| Фаза | Что появляется | Готово, когда |
|---|---|---|
| 0 | Каркас + общий словарь (`shared`) + Kafka/Postgres | всё собирается, инфраструктура поднята |
| 1 | **Config-Service** — сохранение конфигурации в БД | конфиг сохраняется и читается |
| 2 | **Fluids** — один алгоритм, шлёт статус/результат в Kafka | сообщения видны в Kafka-консоли |
| 3 | **Coordinator + SSE** — запуск и живой статус до клиента | статус Fluids приходит по SSE |
| 4 | Остальные 3 сервиса + хореография + Gesamtergebnis | полный прогон, EMS зависит от других |
| 5 | **Circuit Breaker + Retry** — отказоустойчивость | падение сервиса не вешает систему |
| 6 | **React-дашборд** | весь сценарий работает из браузера |
| 7 | **Docker Compose** (всё вместе) + arc42 | `docker compose up` = вся система |

---

## Ментальная модель (что ты вообще строишь)

Пользователь выбирает опции двигателя на экране → они **сохраняются** (Config-Service) → жмёт «Analyse starten» → **4 алгоритм-сервиса** проверяют разные части конфигурации, каждый работает ~20с (симуляция), каждый **сам сообщает** свой прогресс и результат → **Coordinator** собирает всё это и **стримит живьём** обратно на экран → если сервис упал, **Circuit Breaker** не даёт всей системе зависнуть. Всё крутится в контейнерах через Docker Compose.

Шесть сервисов, одной строкой каждый:
- **Config-Service** — хранит конфигурацию (единственный с БД).
- **Coordinator** — вход для UI, слушает Kafka, стримит статус в браузер, считает общий результат.
- **Fluids / Drivetrain / Mechanical** — 3 независимых алгоритма (запускаются параллельно).
- **EMS** — зависимый алгоритм, стартует **после** трёх и использует их результаты.

Два канала связи (не путай):
- **REST/HTTP** — вызовы «сервис зовёт сервис» (хореография) + запуск. На них вешается Circuit Breaker.
- **Kafka** — проактивные сообщения о статусе/результате (телеметрия), которые Coordinator собирает и гонит в UI.

Что уже готово (по твоему скриншоту): монорепо `analysis` с 6 apps + `libs/shared`, лишний дефолтный app удалён. С этого и стартуем.

---

## Фаза 0 — Каркас + контракты + инфраструктура

**Что строим:** пустой, но работающий скелет. Общий словарь (`shared`) — это «существительные» системы. Плюс поднимаем Kafka и Postgres (без сервисов).

**Порты** (закрепи сразу, будешь ставить их в `main.ts` каждого сервиса):

| Сервис | Порт |
|---|---|
| coordinator | 3000 (наружу, для UI) |
| config-service | 3001 |
| fluids-service | 3002 |
| drivetrain-service | 3003 |
| mechanical-service | 3004 |
| ems-service | 3005 |

### Шаги

**0.1.** Проверь, что каркас жив: `nest start coordinator` → должен подняться пустой HTTP-сервер. `Ctrl+C`.

**0.2.** Наполни `libs/shared/src`. Создай файлы:

`enums/index.ts`
```ts
export enum Cluster {
  FLUIDS = 'fluids',
  DRIVETRAIN = 'drivetrain',
  MECHANICAL = 'mechanical',
  EMS = 'ems',
}
export enum AlgorithmStatus { RUNNING = 'running', READY = 'ready', FAILED = 'failed' }
export enum AnalysisResult { OK = 'ok', FAILED = 'failed' }
```

`messages/index.ts` — формат того, что летит в Kafka:
```ts
import { Cluster, AlgorithmStatus, AnalysisResult } from '../enums';
export interface StatusMessage { runId: string; cluster: Cluster; status: AlgorithmStatus; }
export interface EquipmentResult { equipment: string; result: AnalysisResult; }
export interface ResultMessage { runId: string; cluster: Cluster; results: EquipmentResult[]; }
```

`dto/index.ts` — формат конфигурации и запроса на анализ:
```ts
import { EquipmentResult } from '../messages';
export interface OptionalEquipmentConfig {
  engineModel: string;
  cylinderVariant: '10V' | '12V' | '16V';
  gearboxType: string;
  equipment: Record<string, any>; // весь блок Optional Equipment (пойдёт в JSONB)
}
export interface AnalyzeRequest {
  runId: string;
  source?: Cluster.DRIVETRAIN | Cluster.MECHANICAL;
}
```

`constants/index.ts` — имена топиков в одном месте:
```ts
export const TOPICS = {
  STATUS: 'analysis-status',
  RESULT: 'analysis-result',
  RETRY: 'analysis-retry',
} as const;
```

`index.ts` — реэкспорт всего:
```ts
export * from './enums';
export * from './messages';
export * from './dto';
export * from './constants';
```
Импортировать это во всех сервисах будешь так: `import { StatusMessage, TOPICS, Cluster } from '@app/shared';` (alias `@app/shared` уже прописан в `tsconfig.json` при `nest g library`).

**0.3.** Создай `docker-compose.yml` в корне монорепо — пока **только** инфраструктура:
```yaml
services:
  kafka:
    image: bitnami/kafka:latest      # KRaft-режим, Zookeeper не нужен
    ports: ["9092:9092"]
    environment:
      KAFKA_CFG_NODE_ID: "0"
      KAFKA_CFG_PROCESS_ROLES: "controller,broker"
      KAFKA_CFG_CONTROLLER_QUORUM_VOTERS: "0@kafka:9093"
      KAFKA_CFG_LISTENERS: "PLAINTEXT://:9092,CONTROLLER://:9093"
      KAFKA_CFG_ADVERTISED_LISTENERS: "PLAINTEXT://localhost:9092"
      KAFKA_CFG_CONTROLLER_LISTENER_NAMES: "CONTROLLER"
      ALLOW_PLAINTEXT_LISTENER: "yes"
  configdb:
    image: postgres:16
    ports: ["5432:5432"]
    environment: { POSTGRES_DB: config, POSTGRES_USER: config, POSTGRES_PASSWORD: config }
    volumes: ["configdb-data:/var/lib/postgresql/data"]
volumes:
  configdb-data:
```

**0.4.** Подними: `docker compose up -d`.

---
**Проверка — фаза 0 закрыта, если:**
- `nest build` проходит без ошибок (значит `shared` и alias `@app/shared` в порядке).
- `docker compose ps` → `kafka` и `configdb` в статусе `running`.
- Postgres отвечает: `docker compose exec configdb pg_isready -U config` → `accepting connections`.
- Kafka жива: `docker compose exec kafka kafka-topics.sh --bootstrap-server localhost:9092 --list` (список пустой — это нормально).

---

## Фаза 1 — Config-Service (сохранение конфигурации)

**Что строим:** первый настоящий сервис. Принимает конфигурацию по REST, кладёт в Postgres. Ни Kafka, ни анализа — самый простой сервис, хорошая разминка.

**Что уже есть:** каркас + Kafka/Postgres подняты.

### Шаги

**1.1.** Поставь TypeORM и драйвер: `npm i @nestjs/typeorm typeorm pg`.

**1.2.** `apps/config-service/src/entities/configuration.entity.ts` — модель таблицы:
```ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity()
export class Configuration {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() engineModel: string;
  @Column() cylinderVariant: string;
  @Column() gearboxType: string;
  @Column({ type: 'jsonb' }) equipment: Record<string, any>; // весь блок Optional Equipment одним полем
}
```
(`jsonb` = Postgres хранит вложенный объект как есть, менять схему под каждое поле не нужно.)

**1.3.** `config.module.ts` — подключи БД:
```ts
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: 5432,
      username: 'config', password: 'config', database: 'config',
      entities: [Configuration],
      synchronize: true, // авто-создание таблиц. Удобно для PoC, в проде НЕ используют
    }),
    TypeOrmModule.forFeature([Configuration]),
  ],
  controllers: [ConfigController],
  providers: [ConfigService],
})
export class ConfigModule {}
```

**1.4.** `main.ts` — порт 3001:
```ts
async function bootstrap() {
  const app = await NestFactory.create(ConfigModule);
  app.enableCors(); // понадобится React'у в фазе 6
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
```

**1.5.** `config.service.ts` + `config.controller.ts` — три эндпоинта:
```ts
// service
@Injectable()
export class ConfigService {
  constructor(@InjectRepository(Configuration) private repo: Repository<Configuration>) {}
  create(dto: Partial<Configuration>) { return this.repo.save(dto); }
  get(id: string) { return this.repo.findOneBy({ id }); }
  update(id: string, dto: Partial<Configuration>) { return this.repo.save({ id, ...dto }); }
}
// controller
@Controller('configs')
export class ConfigController {
  constructor(private svc: ConfigService) {}
  @Post() create(@Body() b: any) { return this.svc.create(b); }
  @Get(':id') get(@Param('id') id: string) { return this.svc.get(id); }
  @Put(':id') update(@Param('id') id: string, @Body() b: any) { return this.svc.update(id, b); }
}
```

**1.6.** Запусти локально: `nest start config-service --watch` (коннектится к Postgres на `localhost:5432`).

---
**Проверка — фаза 1 закрыта, если:**
```bash
# сохранить
curl -X POST localhost:3001/configs -H "Content-Type: application/json" -d '{
  "engineModel":"Diesel Engine 2000 M96","cylinderVariant":"12V","gearboxType":"ZF 2060",
  "equipment":{"oilSystem":{"oilReplenishment":true},"fuelSystem":{"leakageMonitoring":true}}
}'
# → вернёт объект с "id"
curl localhost:3001/configs/<id>   # → тот же конфиг обратно
```
- И данные реально в БД: `docker compose exec configdb psql -U config -d config -c 'select id, "engineModel" from configuration;'` → строка на месте.

---

## Фаза 2 — Один алгоритм-сервис (Fluids) с Kafka

**Что строим:** первый алгоритм. Принимает `POST /analyze`, симулирует 20с, считает `ok`/`failed` по своим Optional Equipment и **проактивно шлёт** статус+результат в Kafka. **Никого дальше не зовёт** — цепочку добавим в фазе 4.

**Что уже есть:** Config-Service сохраняет; Kafka поднята.

### Шаги

**2.1.** Поставь Kafka-клиент: `npm i @nestjs/microservices kafkajs`. (`@nestjs/microservices` — слой транспорта NestJS, `kafkajs` — сам драйвер под капотом.)

**2.2.** `apps/fluids-service/src/fluids.module.ts` — зарегистрируй Kafka-клиент (продюсер):
```ts
@Module({
  imports: [
    ClientsModule.register([{
      name: 'KAFKA',
      transport: Transport.KAFKA,
      options: { client: { brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'] } },
    }]),
  ],
  controllers: [FluidsController],
  providers: [FluidsService],
})
export class FluidsModule {}
```

**2.3.** `main.ts` — порт 3002, обычный HTTP-сервер. **Важно:** продюсеру Kafka НЕ нужен `connectMicroservice` — ему хватает клиента для `.emit()`.
```ts
async function bootstrap() {
  const app = await NestFactory.create(FluidsModule);
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
```

**2.4.** `fluids.service.ts` — сам алгоритм:
```ts
@Injectable()
export class FluidsService implements OnModuleInit {
  private readonly cluster = Cluster.FLUIDS;
  private readonly myEquipment = ['oilSystem', 'fuelSystem', 'coolingSystem'];
  constructor(@Inject('KAFKA') private kafka: ClientKafka) {}
  async onModuleInit() { await this.kafka.connect(); } // если emit не долетает — вот эта строка чинит

  // fire-and-forget: контроллер НЕ ждёт эти 20с
  async run(req: AnalyzeRequest) {
    this.kafka.emit(TOPICS.STATUS,
      { runId: req.runId, cluster: this.cluster, status: AlgorithmStatus.RUNNING } as StatusMessage);

    await new Promise((r) => setTimeout(r, 20_000)); // симуляция 20с

    const results: EquipmentResult[] = this.myEquipment.map((eq) => ({
      equipment: eq, result: AnalysisResult.OK, // примитивное правило (можно усложнить)
    }));

    this.kafka.emit(TOPICS.RESULT,
      { runId: req.runId, cluster: this.cluster, results } as ResultMessage);
    this.kafka.emit(TOPICS.STATUS,
      { runId: req.runId, cluster: this.cluster, status: AlgorithmStatus.READY } as StatusMessage);

    // ФАЗА 4: здесь Fluids позовёт Drivetrain и Mechanical
  }
}
```

**2.5.** `fluids.controller.ts` — сразу отвечает, работает в фоне:
```ts
@Controller()
export class FluidsController {
  constructor(private svc: FluidsService) {}
  @Post('analyze')
  @HttpCode(202) // Accepted: работа пойдёт в фоне, результат придёт через Kafka
  analyze(@Body() body: AnalyzeRequest) {
    void this.svc.run(body); // НЕ await — не держим клиента 20с
    return { accepted: true, runId: body.runId };
  }
}
```
Почему 202 и не `await`: клиент (Coordinator) не должен висеть 20с на HTTP. Прогресс придёт через Kafka — в этом весь смысл «проактивно».

---
**Проверка — фаза 2 закрыта, если:**
```bash
# терминал A — смотрим, что реально падает в Kafka:
docker compose exec kafka kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic analysis-status --from-beginning
# (открой второй такой же на --topic analysis-result)

# терминал B — дёрни Fluids:
curl -X POST localhost:3002/analyze -H "Content-Type: application/json" \
  -d '{"runId":"test-1"}'
# → сразу 202
```
- В терминале A **сразу** появляется `{... status:"running"}`, через ~20с — `result` + `{... status:"ready"}`. Значит сервис работает и проактивно шлёт в Kafka.

---

## Фаза 3 — Coordinator + SSE (сквозной поток до клиента)

**Что строим:** сервис-вход. `POST /analysis/start` (с `configId`) → проверяет конфиг в Config-Service → заводит `runId` → запускает якорь (Fluids) → **слушает Kafka** → **стримит события живьём** клиенту через SSE. Здесь всё впервые соединяется в одну цепочку.

**Что уже есть:** Config-Service (ф.1), Fluids шлёт в Kafka (ф.2).

### Шаги

**3.1.** Поставь HTTP-клиент (Coordinator зовёт другие сервисы): `npm i @nestjs/axios axios`.

**3.2.** `apps/coordinator/src/main.ts` — **гибрид**: HTTP-сервер + Kafka-слушатель в одном процессе.
```ts
async function bootstrap() {
  const app = await NestFactory.create(CoordinatorModule);   // HTTP
  app.enableCors();
  app.connectMicroservice<MicroserviceOptions>({             // + Kafka-consumer
    transport: Transport.KAFKA,
    options: {
      client: { brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'] },
      consumer: { groupId: 'coordinator' }, // идентификатор группы потребителя
    },
  });
  await app.startAllMicroservices(); // запустить Kafka-слушатель
  await app.listen(process.env.PORT ?? 3000); // запустить HTTP
}
bootstrap();
```
> **Почему Kafka здесь, а не в модуле (как `ClientsModule` в Fluids)?** Это две разные роли. Fluids **пишет** в Kafka → регистрирует **клиент** (`ClientsModule.register`) в модуле как provider для `.emit()`. Coordinator **слушает** Kafka → запускает **слушателя** через `app.connectMicroservice` + `app.startAllMicroservices`. Запуск слушателя — операция над экземпляром `app`, а он существует только в `main.ts`; модульного аналога (`…forRoot()`, который стартует Kafka-listener) в NestJS нет. При этом сами обработчики (`@EventPattern`) лежат в `EventsController` внутри модуля — как контроллеры в Fluids; в `main.ts` вынесен только факт «запусти слушателя». Мнемоника: **пишешь → клиент → модуль; слушаешь → сервер → bootstrap.**

**3.3.** `events.controller.ts` — обработчики Kafka-событий (`@EventPattern` = «обработчик события из Kafka», аналог `@Post` для HTTP):
```ts
@Controller()
export class EventsController {
  constructor(private state: AnalysisService) {}
  @EventPattern(TOPICS.STATUS) onStatus(@Payload() m: StatusMessage) { this.state.applyStatus(m); }
  @EventPattern(TOPICS.RESULT) onResult(@Payload() m: ResultMessage) { this.state.applyResult(m); }
}
```
(NestJS сам распарсит JSON — в `@Payload()` придёт готовый объект.)

**3.4.** `analysis.service.ts` — состояние прогонов + SSE-каналы:
```ts
@Injectable()
export class AnalysisService {
  private runs = new Map<string, {
    subject: ReplaySubject<any>;
    clusters: Record<string, { status?: string; results?: EquipmentResult[] }>;
  }>();

  createRun(runId: string) {
    // ReplaySubject(50): даже если подключишься чуть позже — увидишь недавние события
    this.runs.set(runId, { subject: new ReplaySubject(50), clusters: {} });
  }
  stream(runId: string) { return this.runs.get(runId)!.subject.asObservable(); }

  applyStatus(m: StatusMessage) {
    const r = this.runs.get(m.runId); if (!r) return;
    r.clusters[m.cluster] = { ...r.clusters[m.cluster], status: m.status };
    r.subject.next({ type: 'status', ...m });
  }
  applyResult(m: ResultMessage) {
    const r = this.runs.get(m.runId); if (!r) return;
    r.clusters[m.cluster] = { ...r.clusters[m.cluster], results: m.results };
    r.subject.next({ type: 'result', ...m });
    // агрегацию Gesamtergebnis добавим в фазе 4
  }
}
```
(`ReplaySubject` — канал, в который пушишь события и на который потом можно подписаться; буфер отдаёт новоподключившемуся последние N событий.)

**3.5.** `analysis.controller.ts` — старт + SSE:
```ts
@Controller('analysis')
export class AnalysisController {
  constructor(private state: AnalysisService, private http: HttpService) {}

  @Post('start')
  async start(@Body() body: { configId: string }) {
    const cfgUrl = process.env.CONFIG_URL ?? 'http://localhost:3001';
    await firstValueFrom(this.http.get(`${cfgUrl}/configs/${body.configId}`));
    const runId = randomUUID();
    this.state.createRun(runId);
    const fluids = process.env.FLUIDS_URL ?? 'http://localhost:3002';
    // запустить якорь (fire-and-forget); Circuit Breaker — в фазе 5
    void firstValueFrom(this.http.post(`${fluids}/analyze`,
      { runId } as AnalyzeRequest));
    return { runId };
  }

  @Sse(':runId/stream')
  stream(@Param('runId') runId: string): Observable<MessageEvent> {
    return this.state.stream(runId).pipe(map((e) => ({ data: e } as MessageEvent)));
  }
}
```
(SSE = сервер держит соединение открытым и шлёт события по мере появления; в браузере это `EventSource`, фаза 6.)

---
**Проверка — фаза 3 закрыта, если:**
```bash
# запусти локально три сервиса (три терминала или npm-скрипт с concurrently):
#   config-service, fluids-service, coordinator
# 1) сохрани конфиг (как в фазе 1), возьми его id
# 2) старт:
curl -X POST localhost:3000/analysis/start -H "Content-Type: application/json" -d '{"configId":"<id>"}'
# → вернёт {"runId":"..."}
# 3) сразу в другом терминале — слушай поток:
curl -N localhost:3000/analysis/<runId>/stream
```
- В потоке видишь живьём: `fluids running` → (20с) → `fluids result` + `ready`, пришедшие **через SSE**. Значит цепочка HTTP-старт → вызов якоря → Kafka-событие → SSE до клиента работает.

---

## Фаза 4 — Остальные сервисы + хореография + Gesamtergebnis

**Что строим:** копируешь Fluids в Drivetrain и Mechanical (независимые, параллельные) и в EMS (зависимый — ждёт двух других и использует их результаты). Добавляешь **цепочку**: Fluids после `ready` сам зовёт Drivetrain и Mechanical; те после `ready` зовут EMS. Coordinator считает **Gesamtergebnis**.

**Что уже есть:** Fluids + Coordinator + SSE работают сквозным потоком.

### Шаги

**4.1.** Создай Drivetrain (3003) и Mechanical (3004) по образцу Fluids — тот же скелет (Kafka-клиент, контроллер с 202, service с 20с+emit). Отличия: своё `cluster`-имя, свой `myEquipment` (см. таблицу в `UB5_ImplementationPlan.md` §11), свой порт. Обоим тоже поставь `@nestjs/axios` (понадобится звать EMS).

**4.2.** Добавь хореографию в **Fluids**. **Что это делает:** до сих пор Drivetrain/Mechanical/EMS никто не запускал — они просто ждут. Здесь Fluids, закончив свою работу, **сам звонит следующим двум сервисам и запускает их**. Без этого отработает только Fluids, остальные не стартуют.

**Куда вставлять:** замени заглушку `// ФАЗА 4: здесь Fluids позовёт Drivetrain и Mechanical`, которую ты оставил в `run()` в фазе 2 (в самом конце, после emit `READY`). Полный `run()` теперь:
```ts
async run(request: AnalyzeRequest) {
  const base = { runId: request.runId, cluster: this.cluster };
  this.kafka.emit(TOPICS.STATUS, { ...base, status: AlgorithmStatus.RUNNING });

  await new Promise((r) => setTimeout(r, 20_000)); // своя работа 20с

  const results: EquipmentResult[] = this.equipments.map((equipment) => ({
    equipment, result: AnalysisResult.OK,
  }));
  this.kafka.emit(TOPICS.RESULT, { ...base, results });
  this.kafka.emit(TOPICS.STATUS, { ...base, status: AlgorithmStatus.READY });

  // ↓ хореография: Fluids запускает следующих (вместо заглушки из фазы 2)
  const drivetrain = process.env.DRIVETRAIN_URL ?? 'http://localhost:3003';
  const mechanical = process.env.MECHANICAL_URL ?? 'http://localhost:3004';
  const next = { runId: request.runId }; // ТОТ ЖЕ runId!
  void firstValueFrom(this.http.post(`${drivetrain}/analyze`, next)); // fire-and-forget
  void firstValueFrom(this.http.post(`${mechanical}/analyze`, next)); // два подряд = параллельно
}
```
Ключевое: передаём **тот же `runId`** — чтобы все события шли под одним прогоном и Coordinator собрал их вместе. `void firstValueFrom(...)` = «отправь POST и не жди 20с». Это и есть хореография: Fluids **сам** решает позвать следующих, без центрального дирижёра.
> Предусловие: в `FluidsModule` импортируй `HttpModule` (`@nestjs/axios`), в конструктор `FluidsService` добавь `private http: HttpService`. До фазы 4 это было не нужно — Fluids никого не звал.

**4.3.** В **Drivetrain и Mechanical** — в конце `run()`, после `READY`, каждый зовёт EMS, передавая сигнал об успешном завершении:
```ts
const ems = process.env.EMS_URL ?? 'http://localhost:3005';
void firstValueFrom(this.http.post(`${ems}/analyze`,
  { runId: req.runId, source: this.cluster } as AnalyzeRequest));
```

**4.4.** Создай **EMS** (3005) — он зависимый, поэтому ждёт **двух** успешных сигналов (от Drivetrain и Mechanical) и только тогда стартует:
```ts
@Injectable()
export class EmsService implements OnModuleInit {
  private readonly cluster = Cluster.EMS;
  private acc = new Map<string, Set<Cluster>>();
  constructor(@Inject('KAFKA') private kafka: ClientKafka) {}
  async onModuleInit() { await this.kafka.connect(); }

  // вызывается и Drivetrain, и Mechanical
  async collect(req: AnalyzeRequest) {
    if (!req.source) throw new Error('EMS requires source');
    const cur = this.acc.get(req.runId) ?? new Set<Cluster>();
    cur.add(req.source);
    this.acc.set(req.runId, cur);
    if (cur.has(Cluster.DRIVETRAIN) && cur.has(Cluster.MECHANICAL)) {
      this.acc.delete(req.runId);
      await this.run(req.runId);
    }
  }
  private async run(runId: string) {
    this.kafka.emit(TOPICS.STATUS, { runId, cluster: this.cluster, status: AlgorithmStatus.RUNNING });
    await new Promise((r) => setTimeout(r, 20_000));
    const results: EquipmentResult[] = [
      { equipment: 'engineManagementSystem', result: AnalysisResult.OK },
      { equipment: 'monitoringControlSystem', result: AnalysisResult.OK },
    ];
    this.kafka.emit(TOPICS.RESULT, { runId, cluster: this.cluster, results });
    this.kafka.emit(TOPICS.STATUS, { runId, cluster: this.cluster, status: AlgorithmStatus.READY });
  }
}
```
Контроллер EMS: `@Post('analyze')` → `void this.svc.collect(body)` → 202.
> Если буферизация в EMS кажется сложной — есть более простой вариант: Coordinator (он и так слушает Kafka) увидев, что Drivetrain и Mechanical дали `ready`, сам зовёт EMS. Но это **слегка оркестрация** и противоречит «Coordinator ≠ оркестратор» из ТЗ. Рекомендую оставить чистую хореографию, как выше.

**4.5.** Gesamtergebnis в Coordinator — дополни `applyResult` в `analysis.service.ts`:
```ts
applyResult(m: ResultMessage) {
  const r = this.runs.get(m.runId); if (!r) return;
  r.clusters[m.cluster] = { ...r.clusters[m.cluster], results: m.results };
  r.subject.next({ type: 'result', ...m });
  const withResults = Object.values(r.clusters).filter((c) => c.results);
  if (withResults.length >= 4) { // все 4 кластера отдали результат
    const all = withResults.flatMap((c) => c.results!);
    const overall = all.some((x) => x.result === AnalysisResult.FAILED)
      ? AnalysisResult.FAILED : AnalysisResult.OK;
    r.subject.next({ type: 'overall', runId: m.runId, overall });
  }
}
```

---
**Проверка — фаза 4 закрыта, если:**
- Старт анализа → в SSE-потоке видишь по порядку: `fluids` running/ready → **параллельно** `drivetrain` и `mechanical` running/ready → `ems` running/ready → в конце `overall`.
- Полный прогон ≈ **60с** (Fluids 20 + параллельные 20 + EMS 20). Это нормально, не баг.
- Залогируй в `EmsService.run` принятый `upstream` — там должны быть результаты Drivetrain+Mechanical (доказательство зависимости, требование задания).

---

## Фаза 5 — Circuit Breaker + Retry (отказоустойчивость)

**Что строим:** оборачиваешь межсервисные HTTP-вызовы в Circuit Breaker (`opossum`). Сервис недоступен → CB «открывается» → возвращает fallback (кластер = `failed`), но остальной анализ и SSE **продолжают работать**. Плюс кнопка Retry (перезапуск одного кластера) и способ симулировать падение.

**Что уже есть:** полный хореографический прогон.

### Шаги

**5.1.** Поставь: `npm i opossum` и `npm i -D @types/opossum`.

**5.2.** Оберни каждый вызов «позвать сервис» в Circuit Breaker. Три состояния: **closed** (норма, вызовы идут), **open** (много ошибок — вызовы сразу идут в fallback, сервис не дёргается), **half-open** (через паузу пробует один вызов — ожил ли).
```ts
import CircuitBreaker from 'opossum';

// call — функция, которая реально делает HTTP-вызов и может упасть/зависнуть
function withBreaker(
  call: (body: AnalyzeRequest) => Promise<any>,
  onFail: (body: AnalyzeRequest) => void, // что сделать, когда сервис недоступен
) {
  const breaker = new CircuitBreaker(call, {
    timeout: 25_000,               // ждём максимум 25с (20с симуляции + запас)
    errorThresholdPercentage: 50,  // при 50% ошибок — открыть
    resetTimeout: 10_000,          // через 10с попробовать снова (half-open)
  });
  breaker.fallback((body) => onFail(body));
  return breaker;
}
```
`onFail` для кластера X должен **сам эмитить в Kafka** `status=failed` и `results` = всё `failed` для X — потому что упавший сервис этого сделать не может, а UI должен узнать о падении:
```ts
const onFail = (body: AnalyzeRequest) => {
  this.kafka.emit(TOPICS.STATUS, { runId: body.runId, cluster: Cluster.MECHANICAL, status: AlgorithmStatus.FAILED });
  this.kafka.emit(TOPICS.RESULT, { runId: body.runId, cluster: Cluster.MECHANICAL,
    results: [{ equipment: 'mountingSystem', result: AnalysisResult.FAILED }] });
};
```
Оберни так все вызовы: Coordinator→Fluids, Coordinator→Config, Fluids→Drivetrain/Mechanical, Drivetrain/Mechanical→EMS.

**5.3.** Добавь в каждый алгоритм-сервис `POST /simulate/down` — чтобы искусственно «ломать» его:
```ts
private down = false;
@Post('simulate/down') down_() { this.down = true; return { down: true }; }
// в начале run(): if (this.down) throw new Error('simulated down');
```
(Либо просто `docker stop <service>` в фазе 7 — тоже валит сервис.)

**5.4.** Coordinator принимает retry от UI и публикует одну команду в Kafka:
```ts
@Post(':runId/retry/:cluster')
retry(@Param('runId') runId: string, @Param('cluster') cluster: string) {
  this.state.resetProjectionForRetry(runId, cluster);
  this.kafka.emit(TOPICS.RETRY, { runId, cluster });
  return { accepted: true, runId, cluster };
}
```

Каждый алгоритмический сервис слушает `analysis-retry`, отбрасывает команды
для других кластеров и самостоятельно выполняет свой retry. Coordinator не знает,
как именно повторно запускаются Fluids, Drivetrain, Mechanical или EMS.

---
**Проверка — фаза 5 закрыта, если:**
- Сломай Mechanical: `curl -X POST localhost:3004/simulate/down` (или `docker stop`).
- Запусти анализ → в SSE: `fluids` ok, `drivetrain` ok, `mechanical` **failed** (через fallback, **без зависания**), `ems` = failed, `overall` = failed. Ключевое: система **не замерла** на упавшем сервисе.
- Оживи Mechanical → `curl -X POST localhost:3000/analysis/<runId>/retry/mechanical` → он перезапускается и даёт результат.

---

## Фаза 6 — React-дашборд

**Что строим:** экран, с которого делаешь всё: форма Optional Equipment → сохранить → «Analyse starten» → живые плитки статусов 4 алгоритмов → результаты по equipment + Gesamtergebnis → кнопки Retry. Статусы — через `EventSource` (браузерный SSE).

**Что уже есть:** весь бэкенд работает и проверен через curl.

### Шаги

**6.1.** Создай React **отдельно** от Nest-монорепо: `npm create vite@latest analysis-ui -- --template react`. Положи рядом: `wirschaffendas/analysis-ui/`.

**6.2.** CORS — убедись, что `app.enableCors()` есть в Coordinator и Config-Service (иначе браузер заблокирует запросы с другого порта). Ты его уже добавил в фазах 1 и 3 — просто проверь.

**6.3.** Экран 1 — форма: чекбоксы/селекты по Optional Equipment, кнопка «Speichern» → `POST /configs` → сохрани `id` из ответа в state.

**6.4.** Экран 2 — запуск + дашборд:
```jsx
// после нажатия "Analyse starten":
const res = await fetch('http://localhost:3000/analysis/start', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ configId }),
});
const { runId } = await res.json();
setRunId(runId);

// живой поток статусов:
useEffect(() => {
  if (!runId) return;
  const es = new EventSource(`http://localhost:3000/analysis/${runId}/stream`);
  es.onmessage = (e) => {
    const ev = JSON.parse(e.data);   // {type, cluster, status | results | overall}
    setEvents((prev) => [...prev, ev]); // обнови плитку нужного кластера / общий результат
  };
  return () => es.close();
}, [runId]);
```

**6.5.** Отобрази: 4 плитки (по кластеру) со статусом-цветом (running/ready/failed), список equipment→ok/failed под каждой, крупно `Gesamtergebnis` (из события `overall`), кнопка **Retry** на упавшей плитке → `POST /analysis/{runId}/retry/{cluster}`.

---
**Проверка — фаза 6 закрыта, если:**
- В браузере: форма → Speichern → Analyse starten → плитки живьём меняются `running`→`ready`, появляются результаты и `Gesamtergebnis`. Ломаешь сервис (`/simulate/down`) → плитка краснеет → Retry её оживляет. Всё **без curl**.

---

## Фаза 7 — Docker Compose (всё вместе) + arc42

**Что строим:** каждый сервис в контейнер, вся система одной командой. Плюс финализируешь arc42 и Baustein-Sicht (это Teilaufgabe b, оценивается).

**Что уже есть:** всё работает локально.

### Шаги

**7.1.** Один `Dockerfile` в корне на все сервисы (имя app через build-arg):
```dockerfile
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG APP
RUN npx nest build ${APP}          # собирает ТОЛЬКО этот app → dist/apps/${APP}

FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
ARG APP
COPY --from=build /app/dist/apps/${APP} ./dist
CMD ["node", "dist/main.js"]
```

**7.2.** Расширь `docker-compose.yml` — добавь 6 сервисов. **Адреса — по именам сервисов, НЕ `localhost`** (внутри compose `localhost` = сам контейнер):
```yaml
  fluids-service:
    build: { context: ., args: { APP: fluids-service } }
    environment: { KAFKA_BROKER: kafka:9092 }
    depends_on: { kafka: { condition: service_healthy } }
  # drivetrain / mechanical / ems — аналогично, свои APP
  config-service:
    build: { context: ., args: { APP: config-service } }
    environment: { DB_HOST: configdb }
    depends_on: { configdb: { condition: service_healthy } }
    ports: ["3001:3001"]          # наружу, если UI пишет конфиг напрямую
  coordinator:
    build: { context: ., args: { APP: coordinator } }
    environment:
      KAFKA_BROKER: kafka:9092
      CONFIG_URL: http://config-service:3001
      FLUIDS_URL: http://fluids-service:3002
      DRIVETRAIN_URL: http://drivetrain-service:3003
      MECHANICAL_URL: http://mechanical-service:3004
      EMS_URL: http://ems-service:3005
    depends_on: { kafka: { condition: service_healthy } }
    ports: ["3000:3000"]          # наружу: REST + SSE для UI
```

**7.3.** Healthcheck против гонки старта (сервис поднимется раньше Kafka/Postgres и упадёт — см. «Грабли»):
```yaml
  kafka:
    # ... как в фазе 0 ...
    healthcheck:
      test: ["CMD-SHELL", "kafka-topics.sh --bootstrap-server localhost:9092 --list || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10
  configdb:
    # ...
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U config"]
      interval: 5s
      retries: 10
```

**7.4.** (опц.) Добавь React-UI как сервис (сборка + nginx) — или оставь запускаемым отдельно.

**7.5.** arc42 + Baustein-Sicht: заполни секции 4, 5, 6, 8, 9 и нарисуй под-систему Analysis с 6 сервисами в нотации UB4. Что писать в каждой секции и ссылки на лекции — `UB5_ImplementationPlan.md` §7 и §9.

---
**Проверка — фаза 7 закрыта (финал), если:**
- `docker compose up` из чистого состояния поднимает **всю** систему (kafka, postgres, 6 сервисов, опц. UI).
- Из браузера проходит весь сценарий (форма → анализ → живые статусы → результат → сломать → retry) — через контейнеры.
- arc42-документ и Baustein-Sicht готовы.
- Пройдись по `Abgabe-Checkliste` (`UB5_ImplementationPlan.md` §14).

---

## Если застрял — топ-грабли

1. **Сервис падает на старте с ошибкой подключения к Kafka/Postgres.** `depends_on` ждёт только *запуска* контейнера, не *готовности*. Решение: healthcheck + `condition: service_healthy` (ф. 7.3), либо `onModuleInit`-connect с ретраями.
2. **В compose сервисы не видят друг друга.** Внутри compose адрес — это **имя сервиса** (`kafka:9092`, `http://config-service:3001`), а не `localhost`. Локально — наоборот `localhost`. Держи адреса в env.
3. **Браузер: `CORS error`.** Добавь `app.enableCors()` в Coordinator и Config-Service.
4. **`emit` в Kafka «не долетает».** Добавь `await this.kafka.connect()` в `onModuleInit` продюсера.
5. **SSE не показывает первые события** (`running` пропал). Ты подключился к потоку позже, чем он стартовал. Решение уже заложено — `ReplaySubject(50)` (ф. 3.4) отдаёт недавние события новоподключившемуся.
6. **`Port 3000 already in use`.** Другой сервис/процесс занял порт. У каждого сервиса свой порт (таблица в ф. 0).
7. **Kafka-событие приходит, но объект «пустой»/строкой.** NestJS обычно парсит JSON сам; если нет — проверь, что эмитишь объект (не строку) и читаешь через `@Payload()`.

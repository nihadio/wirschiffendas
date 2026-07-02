import { Test, TestingModule } from "@nestjs/testing";
import { ConfigController } from "./ConfigController";
import { ConfigService } from "./ConfigService";
import { Config } from "./Config";

describe("ConfigController", () => {
  let controller: ConfigController;

  const config: Partial<Config> = {
    engineModel: "Diesel Engine 2000 M96",
    cylinderVariant: "12V",
    gearboxType: "ZF 2060",
    equipment: { oilSystem: { oilReplenishment: true } },
  };

  const serviceMock = {
    getConfigs: jest.fn().mockResolvedValue([config]),
    getConfig: jest.fn().mockResolvedValue(config),
    createConfig: jest.fn().mockResolvedValue({ id: "uuid-1", ...config }),
    updateConfig: jest.fn().mockResolvedValue({ id: "uuid-1", ...config }),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ConfigController],
      providers: [{ provide: ConfigService, useValue: serviceMock }],
    }).compile();

    controller = app.get(ConfigController);
  });

  it("lists configs", async () => {
    await expect(controller.getConfigs()).resolves.toEqual([config]);
  });

  it("creates a config and returns it with id", async () => {
    const created = await controller.createConfig(config);
    expect(created.id).toBe("uuid-1");
    expect(serviceMock.createConfig).toHaveBeenCalledWith(config);
  });
});

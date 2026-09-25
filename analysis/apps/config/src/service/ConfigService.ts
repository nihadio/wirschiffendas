import { Injectable, NotFoundException } from "@nestjs/common";
import { Config } from "../entity/Config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(Config)
    private repository: Repository<Config>,
  ) {}

  getConfigs() {
    return this.repository.find();
  }

  async getConfig(id: string) {
    const config = await this.repository.findOneBy({ id });

    if (!config) {
      throw new NotFoundException(`Config with id ${id} not found`);
    }

    return config;
  }

  createConfig(config: Partial<Config>) {
    return this.repository.save(config);
  }

  async updateConfig(id: string, updatedConfig: Partial<Config>) {
    await this.getConfig(id);
    return this.repository.save({ id, ...updatedConfig });
  }
}

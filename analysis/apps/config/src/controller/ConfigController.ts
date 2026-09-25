import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from "@nestjs/common";
import type { IConfig } from "@shared";
import { CreateConfigDto } from "../dto/CreateConfigDto";
import { UpdateConfigDto } from "../dto/UpdateConfigDto";
import { Config } from "../entity/Config";
import { ConfigService } from "../service/ConfigService";

@Controller("configs")
export class ConfigController implements IConfig {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getConfigs(): Promise<Config[]> {
    return this.configService.getConfigs();
  }

  @Get(":id")
  getConfig(@Param("id", ParseUUIDPipe) id: string): Promise<Config> {
    return this.configService.getConfig(id);
  }

  @Post()
  createConfig(@Body() config: CreateConfigDto): Promise<Config> {
    return this.configService.createConfig(config);
  }

  @Put(":id")
  updateConfig(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() config: UpdateConfigDto,
  ): Promise<Config> {
    return this.configService.updateConfig(id, config);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from "@nestjs/common";
import { ConfigService } from "./ConfigService";
import { Config } from "./Config";
import { CreateConfigDto } from "apps/config/src/CreateConfigDto";

@Controller("configs")
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getConfigs(): Promise<Config[]> {
    return this.configService.getConfigs();
  }

  @Get(":id")
  getConfig(@Param("id", ParseUUIDPipe) id: string): Promise<Config | null> {
    return this.configService.getConfig(id);
  }

  @Post()
  createConfig(@Body() config: CreateConfigDto): Promise<Config> {
    return this.configService.createConfig(config);
  }

  @Put(":id")
  updateConfig(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() config: Partial<CreateConfigDto>,
  ): Promise<Config> {
    return this.configService.updateConfig(id, config);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { ConfigService } from "./ConfigService";
import { Config } from "./Config";
import { CreateConfigDto } from "./CreateConfigDto";
import { UpdateConfigDto } from "./UpdateConfigDto";

@ApiTags("configs")
@Controller("configs")
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @ApiOperation({ summary: "List saved engine configurations" })
  @ApiOkResponse({
    description: "All persisted engine configurations.",
    type: [Config],
  })
  @Get()
  getConfigs(): Promise<Config[]> {
    return this.configService.getConfigs();
  }

  @ApiOperation({ summary: "Get one engine configuration" })
  @ApiParam({
    name: "id",
    description: "Configuration id.",
    schema: { type: "string", format: "uuid" },
  })
  @ApiOkResponse({
    description: "The requested engine configuration.",
    type: Config,
  })
  @ApiBadRequestResponse({ description: "The id is not a valid UUID." })
  @ApiNotFoundResponse({ description: "No configuration exists for this id." })
  @Get(":id")
  getConfig(@Param("id", ParseUUIDPipe) id: string): Promise<Config | null> {
    return this.configService.getConfig(id);
  }

  @ApiOperation({ summary: "Create an engine configuration" })
  @ApiBody({ type: CreateConfigDto })
  @ApiCreatedResponse({
    description: "The configuration was persisted.",
    type: Config,
  })
  @ApiBadRequestResponse({ description: "The request body failed validation." })
  @Post()
  createConfig(@Body() config: CreateConfigDto): Promise<Config> {
    return this.configService.createConfig(config);
  }

  @ApiOperation({ summary: "Update an engine configuration" })
  @ApiParam({
    name: "id",
    description: "Configuration id.",
    schema: { type: "string", format: "uuid" },
  })
  @ApiBody({ type: UpdateConfigDto })
  @ApiOkResponse({
    description: "The updated engine configuration.",
    type: Config,
  })
  @ApiBadRequestResponse({
    description: "The id or request body failed validation.",
  })
  @ApiNotFoundResponse({ description: "No configuration exists for this id." })
  @Put(":id")
  updateConfig(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() config: UpdateConfigDto,
  ): Promise<Config> {
    return this.configService.updateConfig(id, config);
  }
}

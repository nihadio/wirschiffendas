import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Cluster } from "../enums";
import { EquipmentResult } from "../messages";
import { OptionalEquipmentConfig } from "./OptionalEquipmentConfig";

export class AnalyzeRequest {
  @IsString()
  @IsNotEmpty()
  runId!: string;

  @ValidateNested()
  @Type(() => OptionalEquipmentConfig)
  config!: OptionalEquipmentConfig;

  @IsOptional()
  @IsEnum(Cluster)
  upstreamCluster?: Cluster;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipmentResult)
  upstreamResults?: EquipmentResult[];
}

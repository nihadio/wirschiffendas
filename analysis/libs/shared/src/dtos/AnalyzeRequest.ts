import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
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
  @ApiProperty({
    example: "3f1e2d40-9c2b-4c6a-8f5e-1a2b3c4d5e6f",
    description: "Identifier of the analysis run, created by the Coordinator.",
  })
  @IsString()
  @IsNotEmpty()
  runId!: string;

  @ApiProperty({
    type: OptionalEquipmentConfig,
    description: "Engine configuration to analyze.",
  })
  @ValidateNested()
  @Type(() => OptionalEquipmentConfig)
  config!: OptionalEquipmentConfig;

  @ApiPropertyOptional({
    enum: Cluster,
    description: "Cluster that initiated this downstream analysis request.",
  })
  @IsOptional()
  @IsEnum(Cluster)
  upstreamCluster?: Cluster;

  @ApiPropertyOptional({
    type: [EquipmentResult],
    description: "Results produced by an upstream algorithm when required.",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipmentResult)
  upstreamResults?: EquipmentResult[];
}

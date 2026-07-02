import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsString } from "class-validator";
import { AnalysisResult } from "@shared";

export class EquipmentResult {
  @ApiProperty({
    example: "oilSystem",
    description: "Optional equipment the result belongs to.",
  })
  @IsString()
  equipment!: string;

  @ApiProperty({
    enum: AnalysisResult,
    example: AnalysisResult.OK,
    description: "Analysis outcome for this equipment.",
  })
  @IsEnum(AnalysisResult)
  result!: AnalysisResult;
}

import { IsEnum, IsString } from "class-validator";
import { AnalysisResult } from "@shared";

export class EquipmentResult {
  @IsString()
  equipment!: string;

  @IsEnum(AnalysisResult)
  result!: AnalysisResult;
}

import { IsEnum, IsString } from "class-validator";
import { AnalysisResult } from "../enums";

export class EquipmentResult {
  @IsString()
  equipment!: string;

  @IsEnum(AnalysisResult)
  result!: AnalysisResult;
}

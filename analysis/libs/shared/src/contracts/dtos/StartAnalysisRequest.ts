import { IsNotEmpty, IsUUID } from "class-validator";

export class StartAnalysisRequest {
  @IsUUID()
  @IsNotEmpty()
  configId!: string;
}

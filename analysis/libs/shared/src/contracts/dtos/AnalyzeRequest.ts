import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Cluster } from "../enums";

export class AnalyzeRequest {
  @IsString()
  @IsNotEmpty()
  runId!: string;

  @IsOptional()
  @IsIn([Cluster.DRIVETRAIN, Cluster.MECHANICAL])
  source?: Cluster.DRIVETRAIN | Cluster.MECHANICAL;
}

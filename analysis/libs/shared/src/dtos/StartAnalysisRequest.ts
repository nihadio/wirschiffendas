import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";

export class StartAnalysisRequest {
  @ApiProperty({
    description: "The ID of the configuration to use for this analysis run",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  @IsNotEmpty()
  configId!: string;
}

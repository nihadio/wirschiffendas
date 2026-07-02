import { IsString, IsObject, IsIn } from "class-validator";

export class CreateConfigDto {
  @IsString()
  engineModel!: string;

  @IsIn(["10V", "12V", "16V"])
  cylinderVariant!: string;

  @IsString()
  gearboxType!: string;

  @IsObject()
  equipment!: Record<string, any>;
}

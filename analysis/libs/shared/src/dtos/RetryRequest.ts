import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { OptionalEquipmentConfig } from "./OptionalEquipmentConfig";

export class RetryRequest {
  @ValidateNested()
  @Type(() => OptionalEquipmentConfig)
  config!: OptionalEquipmentConfig;
}

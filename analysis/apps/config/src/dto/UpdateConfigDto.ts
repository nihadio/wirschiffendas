import { PartialType } from "@nestjs/swagger";
import { CreateConfigDto } from "./CreateConfigDto";

export class UpdateConfigDto extends PartialType(CreateConfigDto) {}

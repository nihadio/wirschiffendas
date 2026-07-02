import { Module } from "@nestjs/common";
import { MechanicalController } from "./MechanicalController";
import { MechanicalService } from "./MechanicalService";

@Module({
  imports: [],
  controllers: [MechanicalController],
  providers: [MechanicalService],
})
export class MechanicalModule {}

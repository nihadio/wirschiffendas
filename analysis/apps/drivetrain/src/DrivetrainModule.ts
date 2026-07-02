import { Module } from "@nestjs/common";
import { DrivetrainController } from "./DrivetrainController";
import { DrivetrainService } from "./DrivetrainService";

@Module({
  imports: [],
  controllers: [DrivetrainController],
  providers: [DrivetrainService],
})
export class DrivetrainModule {}

import { Module } from "@nestjs/common";
import { EmsController } from "./EmsController";
import { EmsService } from "./EmsService";

@Module({
  imports: [],
  controllers: [EmsController],
  providers: [EmsService],
})
export class EmsModule {}

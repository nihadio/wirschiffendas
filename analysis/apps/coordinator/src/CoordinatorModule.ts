import { Module } from '@nestjs/common';
import { CoordinatorController } from './CoordinatorController';
import { CoordinatorService } from './CoordinatorService';

@Module({
  imports: [],
  controllers: [CoordinatorController],
  providers: [CoordinatorService],
})
export class CoordinatorModule {}

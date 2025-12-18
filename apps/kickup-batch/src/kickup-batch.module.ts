import { Module } from '@nestjs/common';
import { KickupBatchController } from './kickup-batch.controller';
import { KickupBatchService } from './kickup-batch.service';

@Module({
  imports: [],
  controllers: [KickupBatchController],
  providers: [KickupBatchService],
})
export class KickupBatchModule {}

import { Module } from '@nestjs/common';
import { KickupBatchController } from './kickup-batch.controller';
import { KickupBatchService } from './kickup-batch.service';
import {ConfigModule} from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [KickupBatchController],
  providers: [KickupBatchService],
})
export class KickupBatchModule {}

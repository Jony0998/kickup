import { Controller, Get } from '@nestjs/common';
import { KickupBatchService } from './kickup-batch.service';

@Controller()
export class KickupBatchController {
  constructor(private readonly kickupBatchService: KickupBatchService) {}

  @Get()
  getHello(): string {
    return this.kickupBatchService.getHello();
  }
}

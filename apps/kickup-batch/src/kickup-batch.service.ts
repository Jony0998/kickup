import { Injectable } from '@nestjs/common';

@Injectable()
export class KickupBatchService {
  getHello(): string {
    return 'Hello World!';
  }
}

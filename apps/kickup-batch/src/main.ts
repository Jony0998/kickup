import { NestFactory } from '@nestjs/core';
import { KickupBatchModule } from './kickup-batch.module';

async function bootstrap() {
  const app = await NestFactory.create(KickupBatchModule);
  await app.listen(process.env.PORT_BATCH ?? 4000);
}
bootstrap();

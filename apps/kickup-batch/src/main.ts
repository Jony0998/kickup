import { NestFactory } from '@nestjs/core';
import { KickupBatchModule } from './kickup-batch.module';

async function bootstrap() {
  const app = await NestFactory.create(KickupBatchModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Use Socket.IO adapter so WebSocket gateways (e.g. chat) work with socket.io-client
  app.useWebSocketAdapter(new IoAdapter(app));

  // CORS: in production set CORS_ORIGIN (e.g. https://yoursite.com) to restrict origins
  const corsOrigin = process.env.CORS_ORIGIN;
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : true,
    credentials: true,
  });

  // Set global prefix for API routes (optional)
  // app.setGlobalPrefix('api');

  if (process.env.DEBUG_HTTP === '1') {
    app.use((req, res, next) => {
      console.log(`[REQUEST] ${req.method} ${req.url}`);
      next();
    });
  }

  // whitelist: true strips extra props; skip forbidNonWhitelisted so GraphQL inputs (e.g. chat sendMessage) don't get 400
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const port = process.env.PORT_API ?? 3008;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server is running on: http://localhost:${port}`);
  console.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);

  // Warm up GraphQL/Apollo and frequently used caches to reduce first-page latency.
  const warmupBody = JSON.stringify({
    query:
      'query Warmup { matches(limit: 20, skip: 0) { _id } teams(limit: 20, skip: 0) { _id } properties(limit: 20, skip: 0) { _id } }',
  });
  void fetch(`http://127.0.0.1:${port}/graphql`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: warmupBody,
  }).catch(() => {
    // Ignore warmup errors; server is already up.
  });
}
bootstrap();

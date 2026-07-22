import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Crucial if you plan to attach a frontend UI
  const port = process.env.PORT || 3000;
  
  await app.listen(port);
  Logger.log(`Aegis Sentinel API is running on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
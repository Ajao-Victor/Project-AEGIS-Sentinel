import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: 'https://project-aegis-sentinel.vercel.app/', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });
  
  const port = process.env.PORT || 3000;
  
  await app.listen(port);
  Logger.log(`Aegis Sentinel API is running on port ${port}`, 'Bootstrap');
}
bootstrap();
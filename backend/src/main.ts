import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Forma recomendada pelo Nest:
import cookieParser from 'cookie-parser';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser()); // <- tem que funcionar
  await app.listen(3000);
}
bootstrap();

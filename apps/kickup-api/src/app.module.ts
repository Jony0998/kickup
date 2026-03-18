import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { ComponentsModule } from './components/components.module';
import { DatabaseModule } from './database/database.module';
import { AppResolver } from './app.resolver';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import './libs/enums/graphql-enums.bootstrap';

@Module({
  imports: [
    ConfigModule.forRoot(),
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      playground: true,
      autoSchemaFile: true,
      uploads: false,
      // Required for setting httpOnly cookies (login/register) and reading them in AuthGuard
      context: ({ req, res }) => ({ req, res }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    ComponentsModule,
    DatabaseModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppResolver],
})
export class AppModule { }

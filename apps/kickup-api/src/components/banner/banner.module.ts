import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BannerService } from './banner.service';
import { BannerResolver } from './banner.resolver';
import BannerSchema from '../../schemas/Banner.model';
import { AuthModule } from '../../auth/auth.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'Banner', schema: BannerSchema }]),
        AuthModule,
    ],
    providers: [BannerService, BannerResolver],
    exports: [BannerService],
})
export class BannerModule { }

import { Module } from '@nestjs/common';
import { UploaderController } from './uploader.controller';
import { AuthModule } from '../../auth/auth.module';

@Module({
	imports: [AuthModule],
	controllers: [UploaderController],
})
export class UploaderModule { }

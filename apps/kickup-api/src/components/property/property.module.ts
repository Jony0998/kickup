import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PropertyService } from './property.service';
import { PropertyResolver } from './property.resolver';
import PropertySchema from '../../schemas/Property.model';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Property', schema: PropertySchema },
		]),
	],
	providers: [PropertyService, PropertyResolver],
	exports: [PropertyService],
})
export class PropertyModule {}

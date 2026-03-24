import { Module } from '@nestjs/common';
import { InjectConnection, MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Module({
	imports: [
		MongooseModule.forRootAsync({
			useFactory: () => {
				const uri =
					process.env.NODE_ENV === 'production'
						? process.env.MONGO_PROD
						: process.env.MONGO_DEV;
				if (!uri?.trim()) {
					console.error(
						'[DatabaseModule] MONGO_DEV yoki MONGO_PROD .env da yo\'q — API GraphQL osilib qolishi mumkin.',
					);
				}
				return {
					uri,
					// Uzoq "hang"ni oldini olish (noto'g'ri URI / tarmoq)
					serverSelectionTimeoutMS: 8_000,
					connectTimeoutMS: 8_000,
					socketTimeoutMS: 45_000,
					maxPoolSize: 10,
				};
			},
		}),
	],
	exports: [MongooseModule],
})
export class DatabaseModule {
	constructor(@InjectConnection() private readonly connection: Connection) {
		if (connection.readyState === 1) {
			console.log(
				`MongoDB is connected into ${
					process.env.NODE_ENV === 'production'
						? 'production'
						: 'development'
				} db`,
			);
		} else {
			console.log('DB is not connected');
		}
	}
}
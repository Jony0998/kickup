import { Schema, Document } from 'mongoose';
import { BannerStatus, BannerType } from '../libs/enums/banner.enum';

export interface Banner extends Document {
    bannerType: BannerType;
    bannerStatus: BannerStatus;
    bannerTitle: string;
    bannerDesc?: string;
    bannerUrl: string;
    authorId: string;
    createdAt: Date;
    updatedAt: Date;
}

const BannerSchema = new Schema(
    {
        bannerType: {
            type: String,
            enum: BannerType,
            default: BannerType.IMAGE,
        },
        bannerStatus: {
            type: String,
            enum: BannerStatus,
            default: BannerStatus.ACTIVE,
        },
        bannerTitle: {
            type: String,
            required: true,
        },
        bannerDesc: {
            type: String,
        },
        bannerUrl: {
            type: String,
            required: true,
        },
        authorId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Member',
        },
    },
    { timestamps: true, collection: 'banners' },
);

export default BannerSchema;

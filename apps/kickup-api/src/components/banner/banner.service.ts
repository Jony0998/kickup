import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Banner } from '../../schemas/Banner.model';
import { CreateBannerInput, UpdateBannerInput } from '../../schemas/Banner.graphql';
import { BannerStatus } from '../../libs/enums/banner.enum';

@Injectable()
export class BannerService {
    constructor(
        @InjectModel('Banner') private readonly bannerModel: Model<Banner>,
    ) { }

    async createBanner(authorId: string, input: CreateBannerInput): Promise<Banner> {
        const newBanner = new this.bannerModel({
            ...input,
            authorId,
            bannerStatus: BannerStatus.ACTIVE,
        });
        return newBanner.save();
    }

    async updateBanner(input: UpdateBannerInput): Promise<Banner> {
        if (!isValidObjectId(input._id)) {
            throw new NotFoundException('Banner not found (Invalid ID)');
        }
        const banner = await this.bannerModel.findByIdAndUpdate(
            input._id,
            { $set: input },
            { new: true },
        );

        if (!banner) {
            throw new NotFoundException('Banner not found');
        }

        return banner;
    }

    async getBanners(): Promise<Banner[]> {
        // Only fetch ACTIVE banners for public/general use
        return this.bannerModel
            .find({ bannerStatus: BannerStatus.ACTIVE })
            .sort({ createdAt: -1 })
            .exec();
    }

    async getAllBanners(): Promise<Banner[]> {
        // Fetch ALL banners (for Admin)
        return this.bannerModel.find().sort({ createdAt: -1 }).exec();
    }

    async getBannerById(id: string): Promise<Banner> {
        if (!isValidObjectId(id)) {
            throw new NotFoundException('Banner not found (Invalid ID)');
        }
        const banner = await this.bannerModel.findById(id).exec();
        if (!banner) {
            throw new NotFoundException('Banner not found');
        }
        return banner;
    }

    async deleteBanner(id: string): Promise<boolean> {
        const deleted = await this.bannerModel.findByIdAndDelete(id);
        return !!deleted;
    }
}

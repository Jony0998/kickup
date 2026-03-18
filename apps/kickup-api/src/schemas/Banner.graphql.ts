import { ObjectType, Field, ID, InputType } from '@nestjs/graphql';
import { BannerStatus, BannerType } from '../libs/enums/banner.enum';

@ObjectType()
export class Banner {
    @Field(() => ID)
    _id: string;

    @Field(() => BannerType)
    bannerType: BannerType;

    @Field(() => BannerStatus)
    bannerStatus: BannerStatus;

    @Field()
    bannerTitle: string;

    @Field({ nullable: true })
    bannerDesc?: string;

    @Field()
    bannerUrl: string;

    @Field(() => ID)
    authorId: string;

    @Field()
    createdAt: Date;

    @Field()
    updatedAt: Date;
}

@InputType()
export class CreateBannerInput {
    @Field(() => BannerType)
    bannerType: BannerType;

    @Field()
    bannerTitle: string;

    @Field({ nullable: true })
    bannerDesc?: string;

    @Field()
    bannerUrl: string;
}

@InputType()
export class UpdateBannerInput {
    @Field(() => ID)
    _id: string;

    @Field(() => BannerType, { nullable: true })
    bannerType?: BannerType;

    @Field(() => BannerStatus, { nullable: true })
    bannerStatus?: BannerStatus;

    @Field({ nullable: true })
    bannerTitle?: string;

    @Field({ nullable: true })
    bannerDesc?: string;

    @Field({ nullable: true })
    bannerUrl?: string;
}

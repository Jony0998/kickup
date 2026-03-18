import { registerEnumType } from '@nestjs/graphql';

export enum BannerType {
    VIDEO = 'VIDEO',
    IMAGE = 'IMAGE',
}
registerEnumType(BannerType, { name: 'BannerType' });

export enum BannerStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
}
registerEnumType(BannerStatus, { name: 'BannerStatus' });

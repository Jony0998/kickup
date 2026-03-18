import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BannerService } from './banner.service';
import { Banner, CreateBannerInput, UpdateBannerInput } from '../../schemas/Banner.graphql';
import { AuthGuard } from '../../auth/auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { JwtPayload } from '../../auth/auth.service';
import { MemberType } from '../../libs/enums/member.enum';
import { UnauthorizedException } from '@nestjs/common';

@Resolver(() => Banner)
export class BannerResolver {
    constructor(private readonly bannerService: BannerService) { }

    @Query(() => [Banner], { name: 'getBanners' })
    async getBanners() {
        return this.bannerService.getBanners();
    }

    @UseGuards(AuthGuard)
    @Query(() => [Banner], { name: 'getAllBanners' })
    async getAllBanners(@CurrentUser() user: JwtPayload) {
        // ADMIN ONLY
        if (user.memberType !== MemberType.ADMIN) {
            throw new UnauthorizedException('Admin privileges required');
        }
        return this.bannerService.getAllBanners();
    }

    @UseGuards(AuthGuard)
    @Query(() => Banner, { name: 'getBanner' })
    async getBanner(@Args('id', { type: () => ID }) id: string) {
        return this.bannerService.getBannerById(id);
    }

    @UseGuards(AuthGuard)
    @Mutation(() => Banner)
    async createBanner(
        @CurrentUser() user: JwtPayload,
        @Args('input') input: CreateBannerInput,
    ) {
        // ADMIN ONLY
        if (user.memberType !== MemberType.ADMIN) {
            throw new UnauthorizedException('Admin privileges required');
        }
        return this.bannerService.createBanner(user.sub, input);
    }

    @UseGuards(AuthGuard)
    @Mutation(() => Banner)
    async updateBanner(
        @CurrentUser() user: JwtPayload,
        @Args('input') input: UpdateBannerInput,
    ) {
        // ADMIN ONLY
        if (user.memberType !== MemberType.ADMIN) {
            throw new UnauthorizedException('Admin privileges required');
        }
        return this.bannerService.updateBanner(input);
    }

    @UseGuards(AuthGuard)
    @Mutation(() => Boolean)
    async deleteBanner(
        @CurrentUser() user: JwtPayload,
        @Args('id', { type: () => ID }) id: string,
    ) {
        // ADMIN ONLY
        if (user.memberType !== MemberType.ADMIN) {
            throw new UnauthorizedException('Admin privileges required');
        }
        return this.bannerService.deleteBanner(id);
    }
}

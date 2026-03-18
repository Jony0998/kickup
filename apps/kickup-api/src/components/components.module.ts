import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { PropertyModule } from './property/property.module';
import { MatchModule } from './match/match.module';
import { ReviewModule } from './review/review.module';
import { BookingModule } from './booking/booking.module';
import { TeamModule } from './team/team.module';
import { MatchResultModule } from './match-result/match-result.module';
import { PlayerStatisticsModule } from './player-statistics/player-statistics.module';
import { LeagueModule } from './league/league.module';
import { NotificationModule } from './notification/notification.module';
import { MatchInvitationModule } from './match-invitation/match-invitation.module';
import { RefereeModule } from './referee/referee.module';
import { MatchMediaModule } from './match-media/match-media.module';
import { PaymentModule } from './payment/payment.module';
import { ChatModule } from './chat/chat.module';
import { BannerModule } from './banner/banner.module';
import { UploaderModule } from './uploader/uploader.module';

@Module({
	imports: [
		MemberModule,
		PropertyModule,
		MatchModule,
		ReviewModule,
		BookingModule,
		TeamModule,
		MatchResultModule,
		PlayerStatisticsModule,
		LeagueModule,
		NotificationModule,
		MatchInvitationModule,
		RefereeModule,
		MatchMediaModule,
		PaymentModule,
		ChatModule,
		BannerModule,
		UploaderModule,
	],
})
export class ComponentsModule { }

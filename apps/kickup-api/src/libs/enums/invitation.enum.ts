import { registerEnumType } from '@nestjs/graphql';
import { InvitationStatus } from '../../schemas/MatchInvitation.model';

registerEnumType(InvitationStatus, {
	name: 'InvitationStatus',
});

export { InvitationStatus };


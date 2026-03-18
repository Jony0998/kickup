import { registerEnumType } from '@nestjs/graphql';
import { TeamStatus, TeamRole } from '../../schemas/Team.model';

registerEnumType(TeamStatus, {
	name: 'TeamStatus',
});

registerEnumType(TeamRole, {
	name: 'TeamRole',
});

export { TeamStatus, TeamRole };


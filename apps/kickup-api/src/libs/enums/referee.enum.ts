import { registerEnumType } from '@nestjs/graphql';
import { RefereeStatus, RefereeLevel } from '../../schemas/Referee.model';

registerEnumType(RefereeStatus, {
	name: 'RefereeStatus',
});

registerEnumType(RefereeLevel, {
	name: 'RefereeLevel',
});

export { RefereeStatus, RefereeLevel };


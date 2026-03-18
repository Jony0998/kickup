import { registerEnumType } from '@nestjs/graphql';
import { MatchResultStatus } from '../../schemas/MatchResult.model';

registerEnumType(MatchResultStatus, {
	name: 'MatchResultStatus',
});

export { MatchResultStatus };


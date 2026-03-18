import { registerEnumType } from '@nestjs/graphql';
import { ChatType } from '../../schemas/Chat.model';

registerEnumType(ChatType, {
	name: 'ChatType',
});

export { ChatType };


import { registerEnumType } from '@nestjs/graphql';
import { NotificationType, NotificationStatus } from '../../schemas/Notification.model';

registerEnumType(NotificationType, {
	name: 'NotificationType',
});

registerEnumType(NotificationStatus, {
	name: 'NotificationStatus',
});

export { NotificationType, NotificationStatus };


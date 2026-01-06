import { registerEnumType } from '@nestjs/graphql';
import { BookingStatus } from '../../schemas/Booking.model';

registerEnumType(BookingStatus, {
	name: 'BookingStatus',
});

export { BookingStatus };


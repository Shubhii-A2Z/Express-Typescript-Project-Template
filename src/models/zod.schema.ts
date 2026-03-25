import {z} from 'zod';

// This is sample ZodSchema
export const createBookingSchema=z.object({
    userId: z.number({error: "UserId is mendatory"}),
    hotelId: z.number({error: "BookingId is mendatory"}),
    bookingAmount: z.number({error: "Booking Amount is mendatory"}).min(1,{error: "Booking amount should be greater than 1"}),
});

// Validate this schema using zodValidate middleware via:- validateRequestBody(createBookingSchema)
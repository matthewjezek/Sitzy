import { z } from 'zod'


export const carSchema = z.object({
  name: z
    .string()
    .min(2, 'Název musí mít alespoň 2 znaky.')
    .max(50, 'Název může mít nejvýše 50 znaků.'),
  layout: z.enum(['Sedan', 'Coupe', 'Minivan'], {
    error: () => ({ message: 'Vyberte typ auta.' }),
  }),
})

export type CarFormValues = z.infer<typeof carSchema>


export const rideSchema = z.object({
  car_id: z.string().uuid('Vyberte auto.'),
  departure_time: z
    .string()
    .min(1, 'Zadejte čas odjezdu.')
    .refine(
      val => new Date(val) > new Date(),
      'Čas odjezdu musí být v budoucnosti.'
    ),
  destination: z
    .string()
    .min(2, 'Cíl musí mít alespoň 2 znaky.')
    .max(100, 'Cíl může mít nejvýše 100 znaků.'),
})

export type RideFormValues = z.infer<typeof rideSchema>


export const inviteSchema = z.object({
  email: z
    .email('Zadejte platný e-mail.')
    .min(1, 'Zadejte e-mail.')
    .transform(val => val.toLowerCase().trim()),
})

export type InviteFormValues = z.infer<typeof inviteSchema>


export const seatSchema = z.object({
  seat_position: z
    .number()
    .int()
    .min(1, 'Neplatné sedadlo.')
    .max(7, 'Neplatné sedadlo.'),
})

export type SeatFormValues = z.infer<typeof seatSchema>
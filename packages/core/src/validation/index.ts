import {z} from 'zod'

export const boxInputSchema = z.object({
	qr_code: z.string().min(1, 'QR code is required'),
	name: z.string().min(1, 'Name is required'),
	items: z.array(z.string().min(1, 'Item cannot be empty')),
	notes: z.string().optional(),
})

export const boxUpdateSchema = z.object({
	name: z.string().min(1, 'Name cannot be empty').optional(),
	items: z.array(z.string().min(1, 'Item cannot be empty')).optional(),
	notes: z.string().optional(),
})

export type BoxInputSchema = z.infer<typeof boxInputSchema>
export type BoxUpdateSchema = z.infer<typeof boxUpdateSchema>

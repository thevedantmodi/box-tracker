export type Box = {
	id: string
	user_id: string
	qr_code: string
	name: string
	items: string[]
	notes: string | null
	created_at: string
	updated_at: string
}

export type BoxInput = {
	qr_code: string
	name: string
	items: string[]
	notes?: string
}

export type BoxUpdate = Partial<Omit<BoxInput, 'qr_code'>>

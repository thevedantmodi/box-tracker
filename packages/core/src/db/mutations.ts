import {db} from './client'
import {BoxInput, BoxUpdate} from '../types'
import {boxInputSchema, boxUpdateSchema} from '../validation'

export class ValidationError extends Error {
	readonly issues: {path: string; message: string}[]

	constructor(issues: {path: string; message: string}[]) {
		const summary = issues.map((i) => `${i.path}: ${i.message}`).join(', ')
		super(`Validation failed: ${summary}`)
		this.name = 'ValidationError'
		this.issues = issues
	}
}

function validate<T>(schema: {safeParse: (v: unknown) => {success: boolean; data?: T; error?: {issues: {path: (string | number)[]; message: string}[]}}}, value: unknown): T {
	const result = schema.safeParse(value)
	if (!result.success) {
		const issues = (result.error?.issues ?? []).map((i) => ({
			path: i.path.join('.'),
			message: i.message,
		}))
		throw new ValidationError(issues)
	}
	return result.data as T
}

function nowIso(): string {
	return new Date().toISOString()
}

function generateId(): string {
	// crypto.randomUUID() is unavailable in React Native — use Math.random fallback
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0
		return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
	})
}

export async function createBox(input: BoxInput, userId: string): Promise<string> {
	const data = validate(boxInputSchema, input)
	const id = generateId()
	const now = nowIso()

	await db.execute(
		`INSERT INTO boxes (id, user_id, qr_code, name, items, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			id,
			userId,
			data.qr_code,
			data.name,
			JSON.stringify(data.items),
			data.notes ?? null,
			now,
			now,
		]
	)

	return id
}

export async function updateBox(id: string, update: BoxUpdate): Promise<void> {
	const data = validate(boxUpdateSchema, update)

	const setClauses: string[] = []
	const params: unknown[] = []

	if (data.name !== undefined) {
		setClauses.push('name = ?')
		params.push(data.name)
	}
	if (data.items !== undefined) {
		setClauses.push('items = ?')
		params.push(JSON.stringify(data.items))
	}
	if (data.notes !== undefined) {
		setClauses.push('notes = ?')
		params.push(data.notes)
	}

	if (setClauses.length === 0) return

	setClauses.push('updated_at = ?')
	params.push(nowIso())
	params.push(id)

	await db.execute(
		`UPDATE boxes SET ${setClauses.join(', ')} WHERE id = ?`,
		params
	)
}

export async function deleteBox(id: string): Promise<void> {
	await db.execute('DELETE FROM boxes WHERE id = ?', [id])
}

import {db} from './client'
import {Box} from '../types'

// SQLite stores items as JSON text — parse on every read
function parseRow(row: Record<string, unknown>): Box {
	return {
		id: row['id'] as string,
		user_id: row['user_id'] as string,
		qr_code: row['qr_code'] as string,
		name: row['name'] as string,
		items: row['items'] ? (JSON.parse(row['items'] as string) as string[]) : [],
		notes: (row['notes'] as string | null) ?? null,
		created_at: row['created_at'] as string,
		updated_at: row['updated_at'] as string,
	}
}

export async function getAllBoxes(): Promise<Box[]> {
	const rows = await db.getAll<Record<string, unknown>>(
		'SELECT * FROM boxes ORDER BY updated_at DESC'
	)
	return rows.map(parseRow)
}

export async function getBoxById(id: string): Promise<Box | null> {
	const row = await db.getOptional<Record<string, unknown>>(
		'SELECT * FROM boxes WHERE id = ?',
		[id]
	)
	return row ? parseRow(row) : null
}

export async function getBoxByQrCode(qrCode: string): Promise<Box | null> {
	const row = await db.getOptional<Record<string, unknown>>(
		'SELECT * FROM boxes WHERE qr_code = ?',
		[qrCode]
	)
	return row ? parseRow(row) : null
}

export async function searchBoxes(query: string): Promise<Box[]> {
	const pattern = `%${query}%`
	const rows = await db.getAll<Record<string, unknown>>(
		`SELECT * FROM boxes
     WHERE name LIKE ?
        OR CAST(items AS TEXT) LIKE ?
        OR notes LIKE ?
     ORDER BY updated_at DESC`,
		[pattern, pattern, pattern]
	)
	return rows.map(parseRow)
}

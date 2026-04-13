import {describe, it, expect, vi, beforeEach} from 'vitest'
import {getBoxByQrCode, getBoxById} from './queries'

// Mock the db client
vi.mock('./client', () => ({
	db: {
		getOptional: vi.fn(),
		getAll: vi.fn(),
	},
}))

import {db} from './client'

const mockRow = {
	id: 'abc-123',
	user_id: 'user-1',
	qr_code: 'BOX-001',
	name: 'Test Box',
	items: JSON.stringify(['lamp', 'winter coat']),
	notes: 'garage shelf',
	created_at: '2024-01-01T00:00:00.000Z',
	updated_at: '2024-01-01T00:00:00.000Z',
}

beforeEach(() => {
	vi.clearAllMocks()
})

describe('getBoxByQrCode', () => {
	it('returns parsed box when qr_code matches', async () => {
		vi.mocked(db.getOptional).mockResolvedValueOnce(mockRow)

		const box = await getBoxByQrCode('BOX-001')

		expect(box).not.toBeNull()
		expect(box?.id).toBe('abc-123')
		expect(box?.qr_code).toBe('BOX-001')
		expect(box?.items).toEqual(['lamp', 'winter coat'])
	})

	it('returns null when qr_code not found', async () => {
		vi.mocked(db.getOptional).mockResolvedValueOnce(null)

		const box = await getBoxByQrCode('UNKNOWN-999')

		expect(box).toBeNull()
	})
})

describe('getBoxById', () => {
	it('returns parsed box when id matches', async () => {
		vi.mocked(db.getOptional).mockResolvedValueOnce(mockRow)

		const box = await getBoxById('abc-123')

		expect(box).not.toBeNull()
		expect(box?.name).toBe('Test Box')
		expect(box?.notes).toBe('garage shelf')
	})

	it('parses empty items array correctly', async () => {
		vi.mocked(db.getOptional).mockResolvedValueOnce({...mockRow, items: null})

		const box = await getBoxById('abc-123')

		expect(box?.items).toEqual([])
	})
})

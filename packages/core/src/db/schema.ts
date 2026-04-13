import {column, Schema, Table} from '@powersync/common'

const boxes = new Table(
	{
		user_id: column.text,
		qr_code: column.text,
		name: column.text,
		// Stored as JSON-encoded string[] — parsed on read
		items: column.text,
		notes: column.text,
		created_at: column.text,
		updated_at: column.text,
	},
	{indexes: {qr_code_idx: ['qr_code']}}
)

export const AppSchema = new Schema({boxes})

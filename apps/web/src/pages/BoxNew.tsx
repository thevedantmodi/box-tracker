import {useState} from 'react'
import {useNavigate, useSearchParams} from 'react-router-dom'
import {createBox, getBoxByQrCode} from '@boxtrack/core'
import {connector} from '../lib/powersync'
import {showToast} from '../components/Toast'

export default function BoxNew() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const prefilledQr = searchParams.get('qr_code') ?? ''

	const [qrCode, setQrCode] = useState(prefilledQr)
	const [name, setName] = useState('')
	const [itemsRaw, setItemsRaw] = useState('')
	const [notes, setNotes] = useState('')
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function handleSave(e: React.FormEvent) {
		e.preventDefault()
		setSaving(true)
		setError(null)
		try {
			// Pre-check local uniqueness
			const existing = await getBoxByQrCode(qrCode.trim())
			if (existing) {
				setError(`QR code already assigned to "${existing.name}"`)
				setSaving(false)
				return
			}

			const supabase = connector.getSupabaseClient()
			const {data: {user}} = await supabase.auth.getUser()
			if (!user) throw new Error('Not logged in')

			const items = itemsRaw
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)

			const id = await createBox({qr_code: qrCode.trim(), name: name.trim(), items, notes: notes.trim() || undefined}, user.id)
			showToast('Box saved')
			navigate(`/box/${id}`)
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : 'Failed to save')
		} finally {
			setSaving(false)
		}

	}

	return (
		<div style={styles.container}>
			<button style={styles.back} onClick={() => navigate(-1)}>‹ Back</button>
			<h1 style={styles.title}>Add box</h1>

			<form onSubmit={handleSave} style={styles.form}>
				<label style={styles.label}>
					QR CODE
					{prefilledQr && <span style={styles.scannedBadge}>Scanned</span>}
				</label>
				<input
					style={styles.input}
					value={qrCode}
					onChange={(e) => setQrCode(e.target.value)}
					placeholder="BOX-001"
					disabled={!!prefilledQr || saving}
					required
				/>

				<label style={styles.label}>NAME *</label>
				<input
					style={styles.input}
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Garage shelf"
					disabled={saving}
					required
					autoFocus={!prefilledQr}
				/>

				<label style={styles.label}>ITEMS (COMMA-SEPARATED)</label>
				<input
					style={styles.input}
					value={itemsRaw}
					onChange={(e) => setItemsRaw(e.target.value)}
					placeholder="Lamp, winter coat, tools"
					disabled={saving}
				/>

				<label style={styles.label}>NOTES</label>
				<textarea
					style={{...styles.input, minHeight: 80, resize: 'vertical'}}
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					placeholder="Any extra details…"
					disabled={saving}
				/>

				{error && <p style={styles.error}>{error}</p>}

				<button style={styles.button} type="submit" disabled={saving}>
					{saving ? 'Saving…' : 'Save'}
				</button>
			</form>
		</div>
	)
}

const styles: Record<string, React.CSSProperties> = {
	container: {maxWidth: 480, margin: '0 auto', padding: '60px 20px 40px'},
	back: {background: 'none', color: '#2563eb', fontSize: 17, marginBottom: 20},
	title: {fontSize: 24, fontWeight: 700, marginBottom: 24},
	form: {display: 'flex', flexDirection: 'column', gap: 4},
	label: {
		fontSize: 12,
		fontWeight: 600,
		color: '#666',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		marginBottom: 4,
		marginTop: 12,
		display: 'flex',
		alignItems: 'center',
		gap: 8,
	},
	scannedBadge: {
		background: '#dcfce7',
		color: '#166534',
		fontSize: 11,
		fontWeight: 600,
		borderRadius: 20,
		padding: '2px 8px',
	},
	input: {
		border: '1px solid #ddd',
		borderRadius: 8,
		padding: '12px 14px',
		fontSize: 16,
		outline: 'none',
		width: '100%',
		background: '#fff',
	},
	error: {color: '#e53e3e', fontSize: 14, marginTop: 4},
	button: {
		background: '#2563eb',
		color: '#fff',
		borderRadius: 8,
		padding: 16,
		fontSize: 16,
		fontWeight: 600,
		marginTop: 16,
	},
}

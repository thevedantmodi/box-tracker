import {useState, useEffect} from 'react'
import {useParams, useNavigate} from 'react-router-dom'
import {getBoxById, updateBox, type Box} from '@boxtrack/core'
import {showToast} from '../components/Toast'

export default function BoxEdit() {
	const {id} = useParams<{id: string}>()
	const navigate = useNavigate()
	const [box, setBox] = useState<Box | null>(null)
	const [name, setName] = useState('')
	const [itemsRaw, setItemsRaw] = useState('')
	const [notes, setNotes] = useState('')
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!id) return
		getBoxById(id).then((b) => {
			if (!b) return navigate('/')
			setBox(b)
			setName(b.name)
			setItemsRaw(b.items.join(', '))
			setNotes(b.notes ?? '')
		})
	}, [id, navigate])

	async function handleSave(e: React.FormEvent) {
		e.preventDefault()
		if (!id) return
		setSaving(true)
		setError(null)
		try {
			const items = itemsRaw
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)

			await updateBox(id, {name: name.trim(), items, notes: notes.trim() || undefined})
			showToast('Box saved')
			navigate(`/box/${id}`)
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : 'Failed to save')
		} finally {
			setSaving(false)
		}
	}

	if (!box) return null

	return (
		<div style={styles.container}>
			<button style={styles.back} onClick={() => navigate(-1)}>‹ Back</button>
			<h1 style={styles.title}>Edit box</h1>

			<form onSubmit={handleSave} style={styles.form}>
				<label style={styles.label}>QR CODE</label>
				<input style={{...styles.input, background: '#f9fafb', color: '#888'}} value={box.qr_code} disabled />

				<label style={styles.label}>NAME *</label>
				<input
					style={styles.input}
					value={name}
					onChange={(e) => setName(e.target.value)}
					disabled={saving}
					required
					autoFocus
				/>

				<label style={styles.label}>ITEMS (COMMA-SEPARATED)</label>
				<input
					style={styles.input}
					value={itemsRaw}
					onChange={(e) => setItemsRaw(e.target.value)}
					disabled={saving}
				/>

				<label style={styles.label}>NOTES</label>
				<textarea
					style={{...styles.input, minHeight: 80, resize: 'vertical'}}
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
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

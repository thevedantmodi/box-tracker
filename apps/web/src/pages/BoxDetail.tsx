import {useState, useEffect, useRef} from 'react'
import {useParams, useNavigate} from 'react-router-dom'
import {getBoxById, deleteBox, type Box} from '@boxtrack/core'
import {showToast} from '../components/Toast'

export default function BoxDetail() {
	const {id} = useParams<{id: string}>()
	const navigate = useNavigate()
	const [box, setBox] = useState<Box | null | undefined>(undefined)
	const [deleting, setDeleting] = useState(false)
	const boxRef = useRef<Box | null | undefined>(undefined)

	useEffect(() => {
		if (!id) return

		async function load() {
			const result = await getBoxById(id!)
			setBox(result)
			boxRef.current = result
		}
		load()

		const interval = setInterval(async () => {
			const result = await getBoxById(id!)
			if (!result && boxRef.current !== undefined) {
				clearInterval(interval)
				alert('This box was deleted from another device.')
				navigate('/')
			} else {
				setBox(result)
				boxRef.current = result
			}
		}, 3000)

		return () => clearInterval(interval)
	}, [id, navigate])

	async function handleDelete() {
		if (!id || !box) return
		if (!window.confirm(`Delete "${box.name}"? This cannot be undone.`)) return
		setDeleting(true)
		try {
			await deleteBox(id)
			showToast('Box deleted')
			navigate('/')
		} finally {
			setDeleting(false)
		}
	}

	if (box === undefined) {
		return <div style={styles.center}><div style={styles.spinner} /></div>
	}

	if (box === null) {
		return (
			<div style={styles.center}>
				<p style={styles.missing}>Box not found.</p>
				<button style={styles.link} onClick={() => navigate(-1)}>Go back</button>
			</div>
		)
	}

	return (
		<div style={styles.container}>
			<button style={styles.back} onClick={() => navigate(-1)}>‹ Back</button>

			<h1 style={styles.name}>{box.name}</h1>
			<p style={styles.qr}>QR: {box.qr_code}</p>

			{box.items.length > 0 && (
				<section style={styles.section}>
					<h2 style={styles.sectionTitle}>Items</h2>
					<div style={styles.tags}>
						{box.items.map((item, i) => (
							<span key={i} style={styles.tag}>{item}</span>
						))}
					</div>
				</section>
			)}

			{box.notes && (
				<section style={styles.section}>
					<h2 style={styles.sectionTitle}>Notes</h2>
					<p style={styles.notes}>{box.notes}</p>
				</section>
			)}

			<div style={styles.actions}>
				<button style={styles.editBtn} onClick={() => navigate(`/box/${id}/edit`)}>
					Edit
				</button>
				<button style={styles.deleteBtn} onClick={handleDelete} disabled={deleting}>
					{deleting ? 'Deleting…' : 'Delete'}
				</button>
			</div>
		</div>
	)
}

const styles: Record<string, React.CSSProperties> = {
	container: {
		maxWidth: 480,
		margin: '0 auto',
		padding: '60px 20px 40px',
	},
	center: {
		height: '100vh',
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12,
	},
	spinner: {
		width: 32,
		height: 32,
		border: '3px solid #e5e7eb',
		borderTopColor: '#2563eb',
		borderRadius: '50%',
		animation: 'spin 0.8s linear infinite',
	},
	missing: {fontSize: 16, color: '#888'},
	link: {background: 'none', color: '#2563eb', fontSize: 16},
	back: {background: 'none', color: '#2563eb', fontSize: 17, marginBottom: 20},
	name: {fontSize: 26, fontWeight: 700, marginBottom: 6},
	qr: {fontSize: 13, color: '#999', marginBottom: 24},
	section: {marginBottom: 20},
	sectionTitle: {
		fontSize: 13,
		fontWeight: 600,
		color: '#666',
		marginBottom: 10,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	tags: {display: 'flex', flexWrap: 'wrap', gap: 8},
	tag: {
		background: '#eff6ff',
		color: '#1d4ed8',
		borderRadius: 20,
		padding: '5px 12px',
		fontSize: 14,
	},
	notes: {fontSize: 15, color: '#444', lineHeight: 1.6},
	actions: {display: 'flex', gap: 12, marginTop: 32},
	editBtn: {
		flex: 1,
		background: '#2563eb',
		color: '#fff',
		padding: 16,
		borderRadius: 10,
		fontWeight: 600,
		fontSize: 16,
	},
	deleteBtn: {
		flex: 1,
		background: '#fff',
		color: '#e53e3e',
		padding: 16,
		borderRadius: 10,
		fontWeight: 600,
		fontSize: 16,
		border: '1px solid #e53e3e',
	},
}

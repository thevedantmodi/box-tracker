import {useState, useEffect} from 'react'
import {useNavigate, Link} from 'react-router-dom'
import {getAllBoxes, searchBoxes, type Box} from '@boxtrack/core'
import {powerSync, connector} from '../lib/powersync'

export default function Home() {
	const navigate = useNavigate()
	const [boxes, setBoxes] = useState<Box[]>([])
	const [query, setQuery] = useState('')
	const [loading, setLoading] = useState(true)
	const [syncStatus, setSyncStatus] = useState<'online' | 'offline' | 'syncing'>('offline')

	useEffect(() => {
		async function init() {
			try {
				await powerSync.connect(connector)
			} catch {
				// already connected or no session — handled below
			}
			setLoading(false)
		}
		init()
	}, [])

	useEffect(() => {
		const unsub = powerSync.registerListener({
			statusChanged: (status) => {
				if (!status.connected) setSyncStatus('offline')
				else if (status.dataFlowStatus.downloading || status.dataFlowStatus.uploading)
					setSyncStatus('syncing')
				else setSyncStatus('online')
			},
		})
		return () => unsub()
	}, [])

	useEffect(() => {
		async function load() {
			const results = query.trim() ? await searchBoxes(query) : await getAllBoxes()
			setBoxes(results)
		}
		load()
	}, [query])

	// Poll for list updates
	useEffect(() => {
		const interval = setInterval(async () => {
			const results = query.trim() ? await searchBoxes(query) : await getAllBoxes()
			setBoxes(results)
		}, 3000)
		return () => clearInterval(interval)
	}, [query])

	async function handleSignOut() {
		const supabase = connector.getSupabaseClient()
		await supabase.auth.signOut()
		navigate('/login')
	}

	return (
		<div style={styles.container}>
			<div style={styles.header}>
				<h1 style={styles.title}>BoxTrack</h1>
				<div style={styles.headerRight}>
					{syncStatus !== 'online' && (
						<span style={styles.badge}>
							{syncStatus === 'syncing' ? 'Syncing…' : 'Offline'}
						</span>
					)}
					<button style={styles.signOut} onClick={handleSignOut}>Sign out</button>
				</div>
			</div>

			<input
				style={styles.search}
				type="search"
				placeholder="Search boxes…"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
			/>

			{loading ? null : boxes.length === 0 ? (
				<p style={styles.empty}>
					{query ? 'No boxes match your search.' : 'No boxes yet. Add your first one!'}
				</p>
			) : (
				<div style={styles.list}>
					{boxes.map((box) => (
						<Link key={box.id} to={`/box/${box.id}`} style={styles.card}>
							<div style={styles.cardName}>{box.name}</div>
							<div style={styles.cardMeta}>
								{box.items.length > 0
									? box.items.slice(0, 3).join(', ') +
										(box.items.length > 3 ? ` +${box.items.length - 3}` : '')
									: 'No items'}
							</div>
						</Link>
					))}
				</div>
			)}

			{/* FAB row */}
			<div style={styles.fab}>
				<button style={styles.fabBtn} onClick={() => navigate('/scan')} title="Scan QR">
					&#x1F4F7;
				</button>
				<button style={styles.fabBtnPrimary} onClick={() => navigate('/box/new')} title="Add box">
					+
				</button>
			</div>
		</div>
	)
}

const styles: Record<string, React.CSSProperties> = {
	container: {
		maxWidth: 480,
		margin: '0 auto',
		padding: '24px 16px 100px',
	},
	header: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 16,
	},
	title: {
		fontSize: 24,
		fontWeight: 700,
	},
	headerRight: {
		display: 'flex',
		alignItems: 'center',
		gap: 10,
	},
	badge: {
		background: '#fef3c7',
		color: '#92400e',
		fontSize: 12,
		fontWeight: 600,
		borderRadius: 20,
		padding: '3px 10px',
	},
	signOut: {
		background: 'none',
		color: '#666',
		fontSize: 14,
	},
	search: {
		width: '100%',
		border: '1px solid #ddd',
		borderRadius: 8,
		padding: '12px 14px',
		fontSize: 16,
		marginBottom: 16,
		outline: 'none',
	},
	empty: {
		color: '#888',
		textAlign: 'center',
		marginTop: 60,
		fontSize: 15,
	},
	list: {
		display: 'flex',
		flexDirection: 'column',
		gap: 10,
	},
	card: {
		display: 'block',
		border: '1px solid #e5e7eb',
		borderRadius: 10,
		padding: '14px 16px',
		color: '#111',
	},
	cardName: {
		fontWeight: 600,
		fontSize: 16,
		marginBottom: 4,
	},
	cardMeta: {
		fontSize: 13,
		color: '#666',
	},
	fab: {
		position: 'fixed',
		bottom: 32,
		right: 24,
		display: 'flex',
		gap: 12,
		alignItems: 'center',
	},
	fabBtn: {
		width: 48,
		height: 48,
		borderRadius: '50%',
		background: '#fff',
		border: '1px solid #ddd',
		fontSize: 22,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
	},
	fabBtnPrimary: {
		width: 56,
		height: 56,
		borderRadius: '50%',
		background: '#2563eb',
		color: '#fff',
		fontSize: 28,
		fontWeight: 300,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		boxShadow: '0 4px 12px rgba(37,99,235,0.4)',
	},
}

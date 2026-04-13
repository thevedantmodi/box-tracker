import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {db} from '@boxtrack/core'
import {connector} from '../lib/powersync'

type Mode = 'signin' | 'signup'

export default function Login() {
	const navigate = useNavigate()
	const [mode, setMode] = useState<Mode>('signin')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!email.trim() || !password.trim()) {
			setError('Email and password are required')
			return
		}
		setLoading(true)
		setError(null)
		try {
			const supabase = connector.getSupabaseClient()

			if (mode === 'signup') {
				const {error: authError} = await supabase.auth.signUp({
					email: email.trim(),
					password,
				})
				if (authError) throw authError
			}

			const {error: signInError} = await supabase.auth.signInWithPassword({
				email: email.trim(),
				password,
			})
			if (signInError) throw signInError

			await db.connect(connector)
			navigate('/')
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : 'Something went wrong')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div style={styles.container}>
			<h1 style={styles.title}>BoxTrack</h1>
			<p style={styles.subtitle}>
				{mode === 'signin' ? 'Sign in to your account.' : 'Create a new account.'}
			</p>

			<form onSubmit={handleSubmit} style={styles.form}>
				<input
					style={styles.input}
					type="email"
					placeholder="your@email.com"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					disabled={loading}
					autoComplete="email"
				/>
				<input
					style={styles.input}
					type="password"
					placeholder="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					disabled={loading}
					autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
				/>
				{error && <p style={styles.error}>{error}</p>}
				<button style={styles.button} type="submit" disabled={loading}>
					{loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
				</button>
			</form>

			<button
				style={styles.toggle}
				onClick={() => {
					setMode(mode === 'signin' ? 'signup' : 'signin')
					setError(null)
				}}
			>
				{mode === 'signin'
					? "Don't have an account? Sign up"
					: 'Already have an account? Sign in'}
			</button>
		</div>
	)
}

const styles: Record<string, React.CSSProperties> = {
	container: {
		maxWidth: 420,
		margin: '0 auto',
		padding: '60px 24px 24px',
	},
	title: {
		fontSize: 28,
		fontWeight: 700,
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: '#666',
		marginBottom: 32,
	},
	form: {
		display: 'flex',
		flexDirection: 'column',
		gap: 12,
	},
	input: {
		border: '1px solid #ddd',
		borderRadius: 8,
		padding: '14px',
		fontSize: 16,
		outline: 'none',
		width: '100%',
	},
	error: {
		color: '#e53e3e',
		fontSize: 14,
	},
	button: {
		background: '#2563eb',
		color: '#fff',
		borderRadius: 8,
		padding: '16px',
		fontSize: 16,
		fontWeight: 600,
		marginTop: 4,
	},
	toggle: {
		background: 'none',
		color: '#2563eb',
		fontSize: 15,
		marginTop: 20,
		display: 'block',
		width: '100%',
		textAlign: 'center',
	},
}

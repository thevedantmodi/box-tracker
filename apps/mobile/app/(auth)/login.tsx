import {useState} from 'react'
import {
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
} from 'react-native'
import {useRouter} from 'expo-router'
import {db} from '@boxtrack/core'
import {connector} from '../../lib/powersync'

type Mode = 'signin' | 'signup'

export default function LoginScreen() {
	const router = useRouter()
	const [mode, setMode] = useState<Mode>('signin')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function handleSubmit() {
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
			router.replace('/(app)')
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : 'Something went wrong')
		} finally {
			setLoading(false)
		}
	}

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
		>
			<Text style={styles.title}>BoxTrack</Text>
			<Text style={styles.subtitle}>
				{mode === 'signin' ? 'Sign in to your account.' : 'Create a new account.'}
			</Text>

			<TextInput
				style={styles.input}
				placeholder="your@email.com"
				keyboardType="email-address"
				autoCapitalize="none"
				autoCorrect={false}
				value={email}
				onChangeText={setEmail}
				editable={!loading}
			/>

			<TextInput
				style={styles.input}
				placeholder="Password"
				secureTextEntry
				value={password}
				onChangeText={setPassword}
				editable={!loading}
			/>

			{error ? <Text style={styles.error}>{error}</Text> : null}

			<TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
				{loading ? (
					<ActivityIndicator color="#fff" />
				) : (
					<Text style={styles.buttonText}>
						{mode === 'signin' ? 'Sign in' : 'Create account'}
					</Text>
				)}
			</TouchableOpacity>

			<TouchableOpacity
				style={styles.toggle}
				onPress={() => {
					setMode(mode === 'signin' ? 'signup' : 'signin')
					setError(null)
				}}
			>
				<Text style={styles.toggleText}>
					{mode === 'signin'
						? "Don't have an account? Sign up"
						: 'Already have an account? Sign in'}
				</Text>
			</TouchableOpacity>
		</KeyboardAvoidingView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		padding: 24,
		backgroundColor: '#fff',
	},
	title: {
		fontSize: 28,
		fontWeight: '700',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: '#666',
		marginBottom: 32,
	},
	input: {
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 8,
		padding: 14,
		fontSize: 16,
		marginBottom: 12,
	},
	error: {
		color: '#e53e3e',
		marginBottom: 12,
		fontSize: 14,
	},
	button: {
		backgroundColor: '#2563eb',
		borderRadius: 8,
		padding: 16,
		alignItems: 'center',
		marginBottom: 16,
	},
	buttonText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: 16,
	},
	toggle: {
		alignItems: 'center',
	},
	toggleText: {
		color: '#2563eb',
		fontSize: 15,
	},
})

import {useState} from 'react'
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	StyleSheet,
	ActivityIndicator,
} from 'react-native'
import {useLocalSearchParams, useRouter} from 'expo-router'
import {createBox, getBoxByQrCode, boxInputSchema, ValidationError} from '@boxtrack/core'
import {connector} from '../../../lib/powersync'
import {showToast} from '../../../components/Toast'

type FieldErrors = Partial<Record<'qr_code' | 'name' | 'items' | 'notes', string>>

export default function NewBoxScreen() {
	const router = useRouter()
	const {qr_code: paramQr} = useLocalSearchParams<{qr_code?: string}>()
	const [qrCode, setQrCode] = useState(paramQr ?? '')
	const [name, setName] = useState('')
	const [itemsText, setItemsText] = useState('')
	const [notes, setNotes] = useState('')
	const [errors, setErrors] = useState<FieldErrors>({})
	const [saving, setSaving] = useState(false)

	const qrLocked = Boolean(paramQr)

	async function handleSave() {
		setErrors({})
		const items = itemsText
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)

		const input = {qr_code: qrCode.trim(), name: name.trim(), items, notes: notes.trim() || undefined}
		const parsed = boxInputSchema.safeParse(input)
		if (!parsed.success) {
			const fe: FieldErrors = {}
			for (const issue of parsed.error.issues) {
				const key = issue.path[0] as keyof FieldErrors
				if (key) fe[key] = issue.message
			}
			setErrors(fe)
			return
		}

		// Pre-check local uniqueness before hitting the DB
		const existing = await getBoxByQrCode(qrCode.trim())
		if (existing) {
			setErrors({qr_code: `Already assigned to "${existing.name}"`})
			return
		}

		setSaving(true)
		try {
			const supabase = connector.getSupabaseClient()
			const {data: {session}} = await supabase.auth.getSession()
			if (!session) throw new Error('Not authenticated')

			const id = await createBox(parsed.data, session.user.id)
			showToast('Box saved')
			router.replace(`/box/${id}`)
		} catch (e) {
			if (e instanceof ValidationError) {
				const fe: FieldErrors = {}
				for (const issue of e.issues) {
					fe[issue.path as keyof FieldErrors] = issue.message
				}
				setErrors(fe)
			} else {
				setErrors({name: e instanceof Error ? e.message : 'Save failed'})
			}
		} finally {
			setSaving(false)
		}
	}

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
			<TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
				<Text style={styles.back}>‹ Back</Text>
			</TouchableOpacity>
			<Text style={styles.title}>Add box</Text>

			<Field label="QR code" error={errors.qr_code}>
				<TextInput
					style={[styles.input, qrLocked && styles.inputLocked]}
					value={qrCode}
					onChangeText={setQrCode}
					editable={!qrLocked}
					autoCapitalize="none"
				/>
				{qrLocked && <Text style={styles.badge}>Scanned</Text>}
			</Field>

			<Field label="Name *" error={errors.name}>
				<TextInput style={styles.input} value={name} onChangeText={setName} />
			</Field>

			<Field label="Items (comma-separated)" error={errors.items}>
				<TextInput
					style={styles.input}
					value={itemsText}
					onChangeText={setItemsText}
					placeholder="lamp, winter coat, cables"
				/>
			</Field>

			<Field label="Notes" error={errors.notes}>
				<TextInput
					style={[styles.input, styles.inputMulti]}
					value={notes}
					onChangeText={setNotes}
					multiline
					numberOfLines={3}
				/>
			</Field>

			<TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
				{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
			</TouchableOpacity>
		</ScrollView>
	)
}

function Field({label, error, children}: {label: string; error?: string; children: React.ReactNode}) {
	return (
		<View style={fieldStyles.wrap}>
			<Text style={fieldStyles.label}>{label}</Text>
			{children}
			{error ? <Text style={fieldStyles.error}>{error}</Text> : null}
		</View>
	)
}

const fieldStyles = StyleSheet.create({
	wrap: {marginBottom: 16},
	label: {fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4},
	error: {color: '#e53e3e', fontSize: 13, marginTop: 4},
})

const styles = StyleSheet.create({
	container: {flex: 1, backgroundColor: '#fff'},
	content: {padding: 20, paddingTop: 60},
	backRow: {marginBottom: 16},
	back: {fontSize: 17, color: '#2563eb'},
	title: {fontSize: 24, fontWeight: '700', marginBottom: 24},
	input: {
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
		backgroundColor: '#fafafa',
	},
	inputLocked: {backgroundColor: '#f3f4f6', color: '#666'},
	inputMulti: {height: 80, textAlignVertical: 'top'},
	badge: {
		fontSize: 12,
		color: '#2563eb',
		fontWeight: '600',
		marginTop: 4,
	},
	saveBtn: {
		backgroundColor: '#2563eb',
		padding: 16,
		borderRadius: 10,
		alignItems: 'center',
		marginTop: 8,
	},
	saveBtnText: {color: '#fff', fontWeight: '600', fontSize: 16},
})

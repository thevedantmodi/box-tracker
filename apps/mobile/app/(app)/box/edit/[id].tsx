import {useState, useEffect} from 'react'
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
import {getBoxById, updateBox, boxUpdateSchema, ValidationError, type Box} from '@boxtrack/core'
import {showToast} from '../../../../components/Toast'

type FieldErrors = Partial<Record<'name' | 'items' | 'notes', string>>

export default function EditBoxScreen() {
	const {id} = useLocalSearchParams<{id: string}>()
	const router = useRouter()
	const [box, setBox] = useState<Box | null>(null)
	const [name, setName] = useState('')
	const [itemsText, setItemsText] = useState('')
	const [notes, setNotes] = useState('')
	const [errors, setErrors] = useState<FieldErrors>({})
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (!id) return
		getBoxById(id).then((result) => {
			if (!result) {
				router.back()
				return
			}
			setBox(result)
			setName(result.name)
			setItemsText(result.items.join(', '))
			setNotes(result.notes ?? '')
		})
	}, [id, router])

	async function handleSave() {
		setErrors({})
		const items = itemsText
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)

		const update = {
			name: name.trim(),
			items,
			notes: notes.trim() || undefined,
		}

		const parsed = boxUpdateSchema.safeParse(update)
		if (!parsed.success) {
			const fe: FieldErrors = {}
			for (const issue of parsed.error.issues) {
				const key = issue.path[0] as keyof FieldErrors
				if (key) fe[key] = issue.message
			}
			setErrors(fe)
			return
		}

		setSaving(true)
		try {
			await updateBox(id!, parsed.data)
			showToast('Box saved')
			router.back()
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

	if (!box) {
		return (
			<View style={styles.center}>
				<ActivityIndicator />
			</View>
		)
	}

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
			<TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
				<Text style={styles.back}>‹ Back</Text>
			</TouchableOpacity>
			<Text style={styles.title}>Edit box</Text>

			{/* QR — always locked */}
			<View style={fieldStyles.wrap}>
				<Text style={fieldStyles.label}>QR code</Text>
				<TextInput style={[styles.input, styles.inputLocked]} value={box.qr_code} editable={false} />
			</View>

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
	center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
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
	saveBtn: {
		backgroundColor: '#2563eb',
		padding: 16,
		borderRadius: 10,
		alignItems: 'center',
		marginTop: 8,
	},
	saveBtnText: {color: '#fff', fontWeight: '600', fontSize: 16},
})

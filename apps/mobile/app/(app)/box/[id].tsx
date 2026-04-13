import {useState, useRef, useCallback} from 'react'
import {
	View,
	Text,
	TouchableOpacity,
	ScrollView,
	StyleSheet,
	Alert,
	ActivityIndicator,
} from 'react-native'
import {useLocalSearchParams, useRouter} from 'expo-router'
import {useFocusEffect} from '@react-navigation/native'
import {getBoxById, deleteBox, type Box} from '@boxtrack/core'
import {showToast} from '../../../components/Toast'

export default function BoxDetailScreen() {
	const {id} = useLocalSearchParams<{id: string}>()
	const router = useRouter()
	const [box, setBox] = useState<Box | null | undefined>(undefined) // undefined = loading
	const [deleting, setDeleting] = useState(false)
	// Use a ref in the polling callback to avoid stale closure on `box`
	const boxRef = useRef<Box | null | undefined>(undefined)

	useFocusEffect(
		useCallback(() => {
			if (!id) return

			async function load() {
				const result = await getBoxById(id!)
				setBox(result)
				boxRef.current = result
			}
			load()

			// Poll every 3 s to catch deletions from another device
			const interval = setInterval(async () => {
				const result = await getBoxById(id!)
				if (!result && boxRef.current !== undefined) {
					clearInterval(interval)
					Alert.alert('Box removed', 'This box was deleted from another device.')
					router.replace('/(app)')
				} else {
					setBox(result)
					boxRef.current = result
				}
			}, 3000)

			return () => clearInterval(interval)
		}, [id, router])
	)

	function confirmDelete() {
		Alert.alert('Delete box', `Delete "${box?.name}"? This cannot be undone.`, [
			{text: 'Cancel', style: 'cancel'},
			{
				text: 'Delete',
				style: 'destructive',
				onPress: async () => {
					if (!id) return
					setDeleting(true)
					try {
						await deleteBox(id)
						showToast('Box deleted')
						router.replace('/(app)')
					} finally {
						setDeleting(false)
					}
				},
			},
		])
	}

	if (box === undefined) {
		return (
			<View style={styles.center}>
				<ActivityIndicator />
			</View>
		)
	}

	if (box === null) {
		return (
			<View style={styles.center}>
				<Text style={styles.missingText}>Box not found.</Text>
				<TouchableOpacity onPress={() => router.back()}>
					<Text style={styles.link}>Go back</Text>
				</TouchableOpacity>
			</View>
		)
	}

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.content}>
			{/* Back */}
			<TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
				<Text style={styles.back}>‹ Back</Text>
			</TouchableOpacity>

			<Text style={styles.name}>{box.name}</Text>
			<Text style={styles.qr}>QR: {box.qr_code}</Text>

			{/* Items */}
			{box.items.length > 0 ? (
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Items</Text>
					<View style={styles.tags}>
						{box.items.map((item, i) => (
							<View key={i} style={styles.tag}>
								<Text style={styles.tagText}>{item}</Text>
							</View>
						))}
					</View>
				</View>
			) : null}

			{/* Notes */}
			{box.notes ? (
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Notes</Text>
					<Text style={styles.notes}>{box.notes}</Text>
				</View>
			) : null}

			{/* Actions */}
			<View style={styles.actions}>
				<TouchableOpacity
					style={styles.editBtn}
					onPress={() => router.push(`/box/edit/${id}`)}
				>
					<Text style={styles.editBtnText}>Edit</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete} disabled={deleting}>
					<Text style={styles.deleteBtnText}>{deleting ? 'Deleting…' : 'Delete'}</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: {flex: 1, backgroundColor: '#fff'},
	content: {padding: 20, paddingTop: 60},
	center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
	missingText: {fontSize: 16, color: '#888', marginBottom: 12},
	link: {color: '#2563eb', fontSize: 16},
	backRow: {marginBottom: 20},
	back: {fontSize: 17, color: '#2563eb'},
	name: {fontSize: 26, fontWeight: '700', marginBottom: 6},
	qr: {fontSize: 13, color: '#999', marginBottom: 24},
	section: {marginBottom: 20},
	sectionTitle: {
		fontSize: 13,
		fontWeight: '600',
		color: '#666',
		marginBottom: 10,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	tags: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
	tag: {
		backgroundColor: '#eff6ff',
		borderRadius: 20,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	tagText: {color: '#1d4ed8', fontSize: 14},
	notes: {fontSize: 15, color: '#444', lineHeight: 22},
	actions: {flexDirection: 'row', gap: 12, marginTop: 32},
	editBtn: {
		flex: 1,
		backgroundColor: '#2563eb',
		padding: 16,
		borderRadius: 10,
		alignItems: 'center',
	},
	editBtnText: {color: '#fff', fontWeight: '600', fontSize: 16},
	deleteBtn: {
		flex: 1,
		backgroundColor: '#fff',
		padding: 16,
		borderRadius: 10,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#e53e3e',
	},
	deleteBtnText: {color: '#e53e3e', fontWeight: '600', fontSize: 16},
})

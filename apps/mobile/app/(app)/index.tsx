import {useState, useCallback, useEffect} from 'react'
import {
	View,
	Text,
	TextInput,
	FlatList,
	TouchableOpacity,
	StyleSheet,
	ListRenderItem,
} from 'react-native'
import {useRouter} from 'expo-router'
import {useFocusEffect} from '@react-navigation/native'
import {getAllBoxes, searchBoxes, useBoxesStore, type Box} from '@boxtrack/core'

export default function HomeScreen() {
	const router = useRouter()
	const syncStatus = useBoxesStore((s) => s.syncStatus)
	const [query, setQuery] = useState('')
	const [boxes, setBoxes] = useState<Box[]>([])
	const [loading, setLoading] = useState(true)

	const load = useCallback(async () => {
		setLoading(true)
		try {
			const results = query.trim()
				? await searchBoxes(query.trim())
				: await getAllBoxes()
			setBoxes(results)
		} finally {
			setLoading(false)
		}
	}, [query])

	// Clear search and reload whenever screen gains focus
	useFocusEffect(
		useCallback(() => {
			setQuery('')
		}, [])
	)

	// Reload whenever query changes
	useEffect(() => {
		load()
	}, [load])

	const renderItem: ListRenderItem<Box> = ({item}) => (
		<TouchableOpacity style={styles.row} onPress={() => router.push(`/box/${item.id}`)}>
			<View style={styles.rowMain}>
				<Text style={styles.rowName}>{item.name}</Text>
				<Text style={styles.rowMeta}>
					{item.items.length} item{item.items.length !== 1 ? 's' : ''}
					{item.items.length > 0 ? ` · ${item.items.slice(0, 3).join(', ')}` : ''}
				</Text>
			</View>
			<Text style={styles.arrow}>›</Text>
		</TouchableOpacity>
	)

	function EmptyState() {
		if (loading) return null
		if (syncStatus === 'syncing' && boxes.length === 0) {
			return (
				<View style={styles.emptyWrap}>
					<Text style={styles.emptyText}>Syncing your boxes…</Text>
				</View>
			)
		}
		return (
			<View style={styles.emptyWrap}>
				<Text style={styles.emptyText}>
					{query.trim() ? 'No boxes match your search.' : 'No boxes yet. Tap + to add one.'}
				</Text>
			</View>
		)
	}

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.headerTitle}>Boxes</Text>
				{syncStatus === 'offline' && (
					<View style={styles.offlineBadge}>
						<Text style={styles.offlineBadgeText}>Offline</Text>
					</View>
				)}
			</View>

			{/* Search */}
			<TextInput
				style={styles.search}
				placeholder="Search boxes…"
				value={query}
				onChangeText={setQuery}
				clearButtonMode="while-editing"
			/>

			{/* List */}
			<FlatList
				data={boxes}
				keyExtractor={(b) => b.id}
				renderItem={renderItem}
				ListEmptyComponent={EmptyState}
				contentContainerStyle={boxes.length === 0 ? styles.listEmpty : undefined}
			/>

			{/* FAB */}
			<TouchableOpacity style={styles.fab} onPress={() => router.push('/box/new')}>
				<Text style={styles.fabText}>+</Text>
			</TouchableOpacity>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {flex: 1, backgroundColor: '#fff'},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingTop: 60,
		paddingHorizontal: 16,
		paddingBottom: 8,
	},
	headerTitle: {fontSize: 28, fontWeight: '700', flex: 1},
	offlineBadge: {
		backgroundColor: '#f59e0b',
		borderRadius: 12,
		paddingHorizontal: 10,
		paddingVertical: 4,
	},
	offlineBadgeText: {color: '#fff', fontSize: 12, fontWeight: '600'},
	search: {
		margin: 16,
		marginTop: 8,
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 10,
		padding: 12,
		fontSize: 16,
		backgroundColor: '#f9f9f9',
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 14,
		paddingHorizontal: 16,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#eee',
	},
	rowMain: {flex: 1},
	rowName: {fontSize: 17, fontWeight: '500'},
	rowMeta: {fontSize: 14, color: '#888', marginTop: 2},
	arrow: {fontSize: 22, color: '#ccc'},
	emptyWrap: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40},
	emptyText: {fontSize: 16, color: '#888', textAlign: 'center'},
	listEmpty: {flexGrow: 1},
	fab: {
		position: 'absolute',
		bottom: 32,
		right: 24,
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: '#2563eb',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOpacity: 0.2,
		shadowOffset: {width: 0, height: 2},
		shadowRadius: 6,
		elevation: 4,
	},
	fabText: {fontSize: 30, color: '#fff', lineHeight: 36},
})

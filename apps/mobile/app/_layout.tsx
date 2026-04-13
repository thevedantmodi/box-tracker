import {useEffect} from 'react'
import {View} from 'react-native'
import {Stack, useRouter} from 'expo-router'
import {db, useBoxesStore} from '@boxtrack/core'
import {connector, powerSync} from '../lib/powersync'
import {Toast} from '../components/Toast'

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
	return Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))])
}

export default function RootLayout() {
	const router = useRouter()
	const setSyncStatus = useBoxesStore((s) => s.setSyncStatus)

	useEffect(() => {
		// Subscribe to sync status changes
		const unsub = powerSync.registerListener({
			statusChanged: (status) => {
				if (!status.connected) {
					setSyncStatus('offline')
				} else if (status.dataFlowStatus.downloading || status.dataFlowStatus.uploading) {
					setSyncStatus('syncing')
				} else {
					setSyncStatus('online')
				}
			},
		})

		// Check auth and connect — 10s timeout in case Supabase is unreachable
		async function init() {
			const supabase = connector.getSupabaseClient()
			const result = await withTimeout(
				supabase.auth.getSession(),
				10_000,
				{data: {session: null}, error: null}
			)

			if (result.data.session) {
				await db.connect(connector)
			} else {
				router.replace('/(auth)/login')
			}
		}

		init()

		return unsub
	}, [router, setSyncStatus])

	return (
		<View style={{flex: 1}}>
			<Stack screenOptions={{headerShown: false}} />
			<Toast />
		</View>
	)
}

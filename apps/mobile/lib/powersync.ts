/**
 * Platform-specific PowerSync bootstrap.
 * This is the ONLY file in apps/mobile that may import @powersync/react-native.
 * All other app code imports from @boxtrack/core only.
 */
import {PowerSyncDatabase} from '@powersync/react-native'
import {AppSchema, initDb, SupabaseConnector} from '@boxtrack/core'

function requireEnv(name: string): string {
	const val = process.env[name]
	if (!val) throw new Error(`Missing env var: ${name}\nCreate apps/mobile/.env — see .env.example`)
	return val
}

const supabaseUrl = requireEnv('EXPO_PUBLIC_SUPABASE_URL')
const supabaseAnonKey = requireEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY')
const powersyncUrl = requireEnv('EXPO_PUBLIC_POWERSYNC_URL')

export const connector = new SupabaseConnector(supabaseUrl, supabaseAnonKey, powersyncUrl)

export const powerSync = new PowerSyncDatabase({
	schema: AppSchema,
	database: {dbFilename: 'boxtrack.db'},
})

// Register the singleton so all @boxtrack/core functions can use it.
initDb(powerSync)

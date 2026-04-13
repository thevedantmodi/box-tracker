/**
 * Web-specific PowerSync bootstrap.
 * This is the ONLY file in apps/web that may import @powersync/web.
 * All other app code imports from @boxtrack/core only.
 */
import {PowerSyncDatabase} from '@powersync/web'
import {AppSchema, initDb, SupabaseConnector} from '@boxtrack/core'

function requireEnv(name: string): string {
	const val = import.meta.env[name]
	if (!val) throw new Error(`Missing env var: ${name}\nCreate apps/web/.env — see .env.example`)
	return val as string
}

const supabaseUrl = requireEnv('VITE_SUPABASE_URL')
const supabaseAnonKey = requireEnv('VITE_SUPABASE_ANON_KEY')
const powersyncUrl = requireEnv('VITE_POWERSYNC_URL')

export const connector = new SupabaseConnector(supabaseUrl, supabaseAnonKey, powersyncUrl)

export const powerSync = new PowerSyncDatabase({
	schema: AppSchema,
	database: {dbFilename: 'boxtrack.db'},
})

// Register the singleton so all @boxtrack/core functions can use it.
initDb(powerSync)

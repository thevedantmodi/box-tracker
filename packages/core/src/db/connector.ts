import {
	AbstractPowerSyncDatabase,
	PowerSyncBackendConnector,
	PowerSyncCredentials,
	UpdateType,
} from '@powersync/common'
import {createClient, SupabaseClient} from '@supabase/supabase-js'

export class SupabaseConnector implements PowerSyncBackendConnector {
	private client: SupabaseClient

	constructor(
		private supabaseUrl: string,
		private supabaseAnonKey: string,
		private powersyncUrl: string
	) {
		this.client = createClient(supabaseUrl, supabaseAnonKey)
	}

	getSupabaseClient(): SupabaseClient {
		return this.client
	}

	async fetchCredentials(): Promise<PowerSyncCredentials | null> {
		const {
			data: {session},
			error,
		} = await this.client.auth.getSession()

		if (error || !session) return null

		return {
			endpoint: this.powersyncUrl,
			token: session.access_token,
			expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined,
		}
	}

	async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
		const batch = await database.getCrudBatch()
		if (!batch) return

		try {
			for (const entry of batch.crud) {
				const {op, table, id, opData} = entry

				switch (op) {
					case UpdateType.PUT:
						await this.client.from(table).upsert({id, ...opData}).throwOnError()
						break
					case UpdateType.PATCH:
						await this.client.from(table).update(opData ?? {}).eq('id', id).throwOnError()
						break
					case UpdateType.DELETE:
						await this.client.from(table).delete().eq('id', id).throwOnError()
						break
				}
			}
			await batch.complete()
		} catch (error) {
			// PowerSync will retry on next opportunity
			throw error
		}
	}
}

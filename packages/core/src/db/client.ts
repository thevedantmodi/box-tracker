import {AbstractPowerSyncDatabase} from '@powersync/common'

// Set by the platform app (mobile/web) calling initDb().
// Each platform creates a concrete PowerSyncDatabase with its own storage adapter,
// then injects it here. All query/mutation code in this package uses this reference.
let _db: AbstractPowerSyncDatabase | undefined

/**
 * Called once at app startup, before any queries run.
 * Mobile: pass a `PowerSyncDatabase` from `@powersync/react-native`.
 * Web:    pass a `PowerSyncDatabase` from `@powersync/web`.
 */
export function initDb(instance: AbstractPowerSyncDatabase): void {
	_db = instance
}

function getDb(): AbstractPowerSyncDatabase {
	if (!_db) {
		throw new Error(
			'PowerSync not initialized. Call initDb() before using any db functions.'
		)
	}
	return _db
}

// Proxy so callers can use `db.execute(...)` / `db.connect(...)` directly
// without going through getDb() everywhere.
export const db = new Proxy({} as AbstractPowerSyncDatabase, {
	get(_target, prop) {
		return Reflect.get(getDb(), prop, getDb())
	},
	set(_target, prop, value) {
		return Reflect.set(getDb(), prop, value)
	},
})

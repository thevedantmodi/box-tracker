// Types
export type {Box, BoxInput, BoxUpdate} from './types'

// Validation schemas + inferred types
export {boxInputSchema, boxUpdateSchema} from './validation'
export type {BoxInputSchema, BoxUpdateSchema} from './validation'

// DB client + setup
export {db, initDb} from './db/client'

// PowerSync schema (apps need this to create platform-specific instance)
export {AppSchema} from './db/schema'

// Supabase connector
export {SupabaseConnector} from './db/connector'

// Queries
export {getAllBoxes, getBoxById, getBoxByQrCode, searchBoxes} from './db/queries'

// Mutations
export {createBox, updateBox, deleteBox, ValidationError} from './db/mutations'

// Store
export {useBoxesStore} from './store/boxes'

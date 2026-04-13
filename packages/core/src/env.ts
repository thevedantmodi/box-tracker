import {z} from 'zod'

const envSchema = z.object({
	SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
	SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
	POWERSYNC_URL: z.string().url('POWERSYNC_URL must be a valid URL'),
})

function loadEnv() {
	const result = envSchema.safeParse({
		SUPABASE_URL: process.env['SUPABASE_URL'],
		SUPABASE_ANON_KEY: process.env['SUPABASE_ANON_KEY'],
		POWERSYNC_URL: process.env['POWERSYNC_URL'],
	})

	if (!result.success) {
		const missing = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')
		throw new Error(`Missing or invalid environment variables:\n${missing}`)
	}

	return result.data
}

export const env = loadEnv()

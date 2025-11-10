import { z } from 'zod';

// Constants
const DEFAULT_APP_URL = 'http://localhost:3000';
const FIREBASE_PREFIX = 'NEXT_PUBLIC_FIREBASE_';

// Helper to handle empty strings as undefined for defaults
const emptyStringToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => (val === '' ? undefined : val), schema);

// Server-only environment variables schema
const serverEnvSchema = z.object({
  // CloudCart API Configuration
  SITE_URL: z.string().url('SITE_URL must be a valid URL'),
  CLOUDCART_API_KEY: z.string().min(1, 'CLOUDCART_API_KEY is required'),

  // Firebase Admin (Server-side only)
  FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
});

// Client-accessible environment variables schema
const clientEnvSchema = z.object({
  // Next.js Configuration
  NEXT_PUBLIC_APP_URL: emptyStringToUndefined(
    z.string().url().default(DEFAULT_APP_URL)
  ),

  // Firebase Configuration (optional during build, required at runtime)
  NEXT_PUBLIC_FIREBASE_API_KEY: emptyStringToUndefined(z.string().optional()),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: emptyStringToUndefined(z.string().optional()),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: emptyStringToUndefined(z.string().optional()),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: emptyStringToUndefined(z.string().optional()),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: emptyStringToUndefined(z.string().optional()),
  NEXT_PUBLIC_FIREBASE_APP_ID: emptyStringToUndefined(z.string().optional()),

  // Application Configuration
  NODE_ENV: emptyStringToUndefined(
    z.enum(['development', 'production', 'test']).default('development')
  ),
});

// Type exports
type ClientEnv = z.infer<typeof clientEnvSchema>;
type ServerEnv = z.infer<typeof serverEnvSchema>;
type EnvErrors = Record<string, string[] | undefined>;

// Check if we're on the server
const isServer = typeof window === 'undefined';

/**
 * Formats validation errors into a readable string.
 */
const formatValidationErrors = (errors: EnvErrors): string => {
  return Object.entries(errors)
    .map(([key, messages]) => `${key}: ${messages?.join(', ')}`)
    .join('\n');
};

/**
 * Separates Firebase-related errors from critical errors.
 */
const separateFirebaseErrors = (
  errors: EnvErrors
): { critical: EnvErrors; firebase: EnvErrors } => {
  const critical: EnvErrors = {};
  const firebase: EnvErrors = {};
  
  for (const [key, messages] of Object.entries(errors)) {
    if (key.startsWith(FIREBASE_PREFIX)) {
      firebase[key] = messages;
    } else {
      critical[key] = messages;
    }
  }
  
  return { critical, firebase };
};

/**
 * Builds a partial client environment object from process.env.
 * Used when validation fails but we still need to extract valid values.
 */
const buildPartialClientEnv = (): Partial<ClientEnv> => ({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL,
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NODE_ENV: (process.env.NODE_ENV as ClientEnv['NODE_ENV']) || 'development',
});

/**
 * Validates server environment variables.
 * @returns Validated server env object, or null if not on server
 * @throws {Error} If validation fails
 */
const validateServerEnv = (): ServerEnv | null => {
  if (!isServer) return null;
  
  const serverEnv = serverEnvSchema.safeParse(process.env);
  if (!serverEnv.success) {
    const errorMessages = formatValidationErrors(serverEnv.error.flatten().fieldErrors);
    console.error('❌ Server environment validation failed:\n', errorMessages);
    throw new Error(`Invalid server environment configuration:\n${errorMessages}`);
  }
  
  return serverEnv.data;
};

/**
 * Validates and parses environment variables.
 * @throws {Error} If critical environment variables are missing or invalid
 * @returns Validated environment variables object
 */
function validateEnv(): ClientEnv & Partial<ServerEnv> {
  const clientEnv = clientEnvSchema.safeParse(process.env);
  
  // Handle client validation errors
  if (!clientEnv.success) {
    const errors = clientEnv.error.flatten().fieldErrors;
    const { critical, firebase } = separateFirebaseErrors(errors);
    
    // Throw on critical errors
    if (Object.keys(critical).length > 0) {
      const errorMessages = formatValidationErrors(critical);
      console.error('❌ Client environment validation failed:\n', errorMessages);
      throw new Error(`Invalid client environment configuration:\n${errorMessages}`);
    }
    
    // Warn about missing Firebase variables
    if (Object.keys(firebase).length > 0) {
      const missingKeys = Object.keys(firebase).join(', ');
      console.warn(`⚠️  Missing Firebase environment variables: ${missingKeys}. Make sure they're set in .env.local`);
    }
    
    // Return partial data even if Firebase vars are missing
    const partialClientEnv = buildPartialClientEnv();
    const serverEnv = validateServerEnv();
    
    return serverEnv ? { ...partialClientEnv, ...serverEnv } as ClientEnv & ServerEnv : partialClientEnv as ClientEnv;
  }

  // Client validation succeeded - validate server env vars on server
  const serverEnv = validateServerEnv();
  return serverEnv ? { ...clientEnv.data, ...serverEnv } : clientEnv.data;
}

// Export validated environment variables
export const env = validateEnv();

// Type-safe accessors for server-only variables
export const getServerEnv = (): ClientEnv & ServerEnv => {
  if (!isServer) {
    throw new Error('Server environment variables can only be accessed on the server');
  }
  return env as ClientEnv & ServerEnv;
};



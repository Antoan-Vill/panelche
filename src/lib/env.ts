import { z } from 'zod';

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
    z.string().url().default('http://localhost:3000')
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

// Check if we're on the server
const isServer = typeof window === 'undefined';

// Parse and validate environment variables
function validateEnv() {
  // Always validate client env vars
  const clientEnv = clientEnvSchema.safeParse(process.env);
  
  if (!clientEnv.success) {
    const errors = clientEnv.error.flatten().fieldErrors;
    // Filter out optional Firebase variables from critical errors
    const criticalErrors = Object.entries(errors).filter(
      ([key]) => !key.startsWith('NEXT_PUBLIC_FIREBASE_')
    );
    
    if (criticalErrors.length > 0) {
      const errorMessages = criticalErrors
        .map(([key, messages]) => `${key}: ${messages?.join(', ')}`)
        .join('\n');
      console.error('❌ Client environment validation failed:\n', errorMessages);
      throw new Error(`Invalid client environment configuration:\n${errorMessages}`);
    }
    
    // Warn about missing Firebase variables but don't throw
    const firebaseErrors = Object.entries(errors).filter(
      ([key]) => key.startsWith('NEXT_PUBLIC_FIREBASE_')
    );
    if (firebaseErrors.length > 0) {
      const warningMessages = firebaseErrors
        .map(([key]) => key)
        .join(', ');
      console.warn(`⚠️  Missing Firebase environment variables: ${warningMessages}. Make sure they're set in .env.local`);
    }
    
    // Return partial data even if Firebase vars are missing (they're optional)
    // Extract valid values from process.env directly
    const partialClientEnv = {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    };

    // Only validate server env vars on the server
    if (isServer) {
      const serverEnv = serverEnvSchema.safeParse(process.env);
      
      if (!serverEnv.success) {
        const errors = serverEnv.error.flatten().fieldErrors;
        const errorMessages = Object.entries(errors)
          .map(([key, messages]) => `${key}: ${messages?.join(', ')}`)
          .join('\n');
        console.error('❌ Server environment validation failed:\n', errorMessages);
        throw new Error(`Invalid server environment configuration:\n${errorMessages}`);
      }

      return {
        ...partialClientEnv,
        ...serverEnv.data,
      };
    }

    return partialClientEnv;
  }

  // Only validate server env vars on the server
  if (isServer) {
    const serverEnv = serverEnvSchema.safeParse(process.env);
    
    if (!serverEnv.success) {
      const errors = serverEnv.error.flatten().fieldErrors;
      const errorMessages = Object.entries(errors)
        .map(([key, messages]) => `${key}: ${messages?.join(', ')}`)
        .join('\n');
      console.error('❌ Server environment validation failed:\n', errorMessages);
      throw new Error(`Invalid server environment configuration:\n${errorMessages}`);
    }

    return {
      ...clientEnv.data,
      ...serverEnv.data,
    };
  }

  return clientEnv.data;
}

// Runtime validation helper for Firebase config
export function validateFirebaseConfig() {
  const required = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ] as const;

  const missing = required.filter(key => {
    const value = env[key as keyof typeof env];
    return !value || (typeof value === 'string' && value.trim() === '');
  });
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase environment variables: ${missing.join(', ')}. ` +
      `Please add them to your .env.local file and restart the dev server.`
    );
  }
  
  return {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };
}

// Export validated environment variables
export const env = validateEnv() as z.infer<typeof clientEnvSchema> & Partial<z.infer<typeof serverEnvSchema>>;

// Type-safe accessors for server-only variables
export const getServerEnv = () => {
  if (!isServer) {
    throw new Error('Server environment variables can only be accessed on the server');
  }
  return env as z.infer<typeof clientEnvSchema> & z.infer<typeof serverEnvSchema>;
};



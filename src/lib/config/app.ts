import { z } from 'zod';

// App configuration schema
const appConfigSchema = z.object({
  // App metadata
  name: z.string().min(1),
  description: z.string().min(1),
  version: z.string().min(1),

  // URLs
  urls: z.object({
    home: z.string().url(),
    api: z.string().url(),
    docs: z.string().url().optional(),
    support: z.string().url().optional(),
  }),

  // Feature flags
  features: z.object({
    analytics: z.boolean().default(false),
    errorReporting: z.boolean().default(false),
    realtimeUpdates: z.boolean().default(true),
    caching: z.boolean().default(true),
    darkMode: z.boolean().default(false),
    notifications: z.boolean().default(false),
  }),

  // API configuration
  api: z.object({
    timeout: z.number().positive().default(10000), // 10 seconds
    retries: z.number().int().min(0).max(5).default(3),
    rateLimit: z.object({
      requests: z.number().positive().default(100),
      windowMs: z.number().positive().default(60000), // 1 minute
    }),
  }),

  // UI configuration
  ui: z.object({
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    animations: z.boolean().default(true),
    reducedMotion: z.boolean().default(false),
    language: z.string().default('en'),
    timezone: z.string().default('UTC'),
  }),

  // Pagination defaults
  pagination: z.object({
    defaultPageSize: z.number().positive().default(20),
    maxPageSize: z.number().positive().default(100),
  }),

  // Cache configuration
  cache: z.object({
    defaultTtl: z.number().positive().default(300), // 5 minutes
    maxAge: z.number().positive().default(3600), // 1 hour
  }),

  // External services
  services: z.object({
    firebase: z.object({
      enabled: z.boolean().default(true),
      emulator: z.boolean().default(false),
    }),
    cloudcart: z.object({
      enabled: z.boolean().default(true),
      timeout: z.number().positive().default(30000), // 30 seconds
    }),
  }),
});

// Default configuration values
const defaultConfig = {
  name: 'Dashboard',
  description: 'A modern dashboard application for e-commerce management',
  version: process.env.npm_package_version || '1.0.0',

  urls: {
    home: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    api: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api`,
    docs: process.env.NEXT_PUBLIC_DOCS_URL,
    support: process.env.NEXT_PUBLIC_SUPPORT_URL,
  },

  features: {
    analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    errorReporting: process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === 'true',
    realtimeUpdates: process.env.NEXT_PUBLIC_ENABLE_REALTIME_UPDATES !== 'false',
    caching: process.env.NEXT_PUBLIC_ENABLE_CACHING !== 'false',
    darkMode: process.env.NEXT_PUBLIC_ENABLE_DARK_MODE === 'true',
    notifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
  },

  api: {
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000'),
    retries: parseInt(process.env.NEXT_PUBLIC_API_RETRIES || '3'),
    rateLimit: {
      requests: parseInt(process.env.NEXT_PUBLIC_RATE_LIMIT_REQUESTS || '100'),
      windowMs: parseInt(process.env.NEXT_PUBLIC_RATE_LIMIT_WINDOW_MS || '60000'),
    },
  },

  ui: {
    theme: (process.env.NEXT_PUBLIC_THEME as 'light' | 'dark' | 'system') || 'system',
    animations: process.env.NEXT_PUBLIC_ENABLE_ANIMATIONS !== 'false',
    reducedMotion: process.env.NEXT_PUBLIC_REDUCED_MOTION === 'true',
    language: process.env.NEXT_PUBLIC_LANGUAGE || 'en',
    timezone: process.env.NEXT_PUBLIC_TIMEZONE || 'UTC',
  },

  pagination: {
    defaultPageSize: parseInt(process.env.NEXT_PUBLIC_DEFAULT_PAGE_SIZE || '20'),
    maxPageSize: parseInt(process.env.NEXT_PUBLIC_MAX_PAGE_SIZE || '100'),
  },

  cache: {
    defaultTtl: parseInt(process.env.NEXT_PUBLIC_CACHE_DEFAULT_TTL || '300'),
    maxAge: parseInt(process.env.NEXT_PUBLIC_CACHE_MAX_AGE || '3600'),
  },

  services: {
    firebase: {
      enabled: process.env.NEXT_PUBLIC_FIREBASE_ENABLED !== 'false',
      emulator: process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === 'true',
    },
    cloudcart: {
      enabled: process.env.NEXT_PUBLIC_CLOUDCART_ENABLED !== 'false',
      timeout: parseInt(process.env.NEXT_PUBLIC_CLOUDCART_TIMEOUT || '30000'),
    },
  },
};

// Validate and export configuration
const config = appConfigSchema.parse(defaultConfig);

// Type-safe configuration object
export type AppConfig = typeof config;

// Export validated configuration
export { config };

// Helper functions for configuration access
export const getConfig = () => config;

export const isFeatureEnabled = (feature: keyof typeof config.features): boolean => {
  return config.features[feature];
};

export const getApiConfig = () => config.api;

export const getUIConfig = () => config.ui;

export const getCacheConfig = () => config.cache;

export const getPaginationConfig = () => config.pagination;

export const getServiceConfig = (service: keyof typeof config.services) => {
  return config.services[service];
};

// Environment-specific configurations
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

// Development helpers
if (isDevelopment) {
  console.log('🚀 App Configuration:', config);
}

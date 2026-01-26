export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

const OPTIONAL_ENV_VARS = [
  'VITE_ESCROW_CONTRACT_ADDRESS',
  'VITE_GHETTO_TOKEN_ADDRESS',
  'VITE_USDC_CONTRACT_ADDRESS',
];

export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const varName of REQUIRED_ENV_VARS) {
    const value = import.meta.env[varName];
    if (!value || value.trim() === '') {
      errors.push(`Required environment variable ${varName} is not set`);
    }
  }

  for (const varName of OPTIONAL_ENV_VARS) {
    const value = import.meta.env[varName];
    if (!value || value.trim() === '') {
      warnings.push(`Optional environment variable ${varName} is not set. Some features may not work.`);
    }
  }

  if (import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.startsWith('https://')) {
    errors.push('VITE_SUPABASE_URL must start with https://');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function logEnvironmentStatus(): void {
  const result = validateEnvironment();

  if (!result.valid) {
    console.error('Environment validation failed:');
    result.errors.forEach(error => console.error(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn('Environment validation warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (result.valid && result.warnings.length === 0) {
    console.log('Environment validation passed');
  }
}

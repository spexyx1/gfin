import { requireSupabase, handleSupabaseError } from '../lib/supabase';
import { logger } from './logger';

/**
 * Higher-order function to wrap Supabase queries with standard error handling
 * Reduces code duplication across hooks
 */
export async function withSupabaseQuery<T>(
  operation: () => Promise<T>,
  errorContext: string
): Promise<T> {
  try {
    requireSupabase();
    return await operation();
  } catch (error) {
    logger.error(`Supabase query failed: ${errorContext}`, 'withSupabaseQuery', error);
    handleSupabaseError(error);
    throw error;
  }
}

/**
 * Safely parse numeric values from database
 */
export function parseNumeric(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Safely parse date values from database
 */
export function parseDate(value: any): Date | undefined {
  if (!value) return undefined;
  return new Date(value);
}

/**
 * Check if a UUID is valid
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate positive number input
 */
export function validatePositiveNumber(value: number, fieldName: string): void {
  if (typeof value !== 'number' || !isFinite(value)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  if (value <= 0) {
    throw new Error(`${fieldName} must be positive`);
  }
}

/**
 * Validate percentage input (0-100)
 */
export function validatePercentage(value: number, fieldName: string): void {
  if (typeof value !== 'number' || !isFinite(value)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  if (value < 0 || value > 100) {
    throw new Error(`${fieldName} must be between 0 and 100`);
  }
}

/**
 * Validate non-empty string input
 */
export function validateNonEmptyString(value: string, fieldName: string): void {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} is required`);
  }
}

/**
 * Batch fetch data by IDs to avoid N+1 queries
 */
export async function batchFetchByIds<T>(
  table: string,
  ids: string[],
  select: string = '*'
): Promise<T[]> {
  if (ids.length === 0) return [];

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .in('id', ids);

  if (error) {
    logger.error(`Batch fetch failed for table: ${table}`, 'batchFetchByIds', error);
    throw error;
  }

  return (data as T[]) || [];
}

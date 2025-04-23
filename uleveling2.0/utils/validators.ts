import * as z from 'zod';

// Basic email validation
export const emailSchema = z.string().email("Invalid email address");

// Basic password validation (minimum 8 characters)
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters long");

/**
 * Validates if a string is not empty.
 */
export const notEmptyStringSchema = z.string().min(1, "Field cannot be empty");

/**
 * Validates if a value is a positive number.
 */
export const positiveNumberSchema = z.number().positive("Must be a positive number");

/**
 * Creates a validator function from a Zod schema.
 * @param schema The Zod schema to use for validation.
 * @returns A function that takes a value and returns a validation result.
 */
export function createValidator<T>(schema: z.ZodSchema<T>) {
  return (value: unknown): { success: boolean; error?: string } => {
    const result = schema.safeParse(value);
    if (result.success) {
      return { success: true };
    }
    // Extract the first error message
    const errorMessage = result.error.errors[0]?.message ?? "Invalid input";
    return { success: false, error: errorMessage };
  };
} 
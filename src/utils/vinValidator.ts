import { z } from 'zod';
import type { VinValidationResult } from '../types/vin';

const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
const VIN_VALUES: { [key: string]: number } = {
  'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
  'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9, 'S': 2,
  'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9,
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '0': 0
};

const vinSchema = z.string()
  .length(17)
  .regex(/^[A-HJ-NPR-Z0-9]+$/)
  .refine((vin) => {
    // First character must be a letter or number 1-5
    const firstChar = vin[0];
    return /^[A-HJ-NPR-Z1-5]$/.test(firstChar);
  }, "First character must be a letter or number 1-5")
  .refine((vin) => {
    // No more than 4 consecutive identical characters
    return !/(.)\1{3}/.test(vin);
  }, "Invalid pattern: too many consecutive identical characters")
  .refine((vin) => {
    // Year character validation (position 10)
    const yearChar = vin[9];
    return /^[A-HJ-NPR-TV-Y1-9]$/.test(yearChar);
  }, "Invalid year character at position 10");

export function validateVin(vin: string): VinValidationResult {
  const errors: string[] = [];
  const normalizedVin = vin.toUpperCase().trim().replace(/[^A-HJ-NPR-Z0-9]/g, '');

  if (normalizedVin.length !== 17) {
    errors.push(`VIN must be 17 characters long (got ${normalizedVin.length})`);
    return { isValid: false, errors, normalizedVin };
  }

  try {
    vinSchema.parse(normalizedVin);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.errors.map(e => e.message));
      return { isValid: false, errors, normalizedVin };
    }
  }

  // Check check digit with more detailed error reporting
  const checkDigit = normalizedVin[8];
  let sum = 0;
  let invalidChars: string[] = [];

  for (let i = 0; i < 17; i++) {
    const char = normalizedVin[i];
    const value = VIN_VALUES[char];
    
    if (value === undefined) {
      invalidChars.push(`${char} at position ${i + 1}`);
      continue;
    }
    
    sum += value * VIN_WEIGHTS[i];
  }

  if (invalidChars.length > 0) {
    errors.push(`Invalid characters found: ${invalidChars.join(', ')}`);
    return { isValid: false, errors, normalizedVin };
  }

  const calculatedCheckDigit = sum % 11;
  const expectedCheckDigit = calculatedCheckDigit === 10 ? 'X' : calculatedCheckDigit.toString();

  // Compare check digits, handling both numeric and 'X' cases
  const actualCheckDigit = checkDigit === 'X' ? 'X' : checkDigit;
  if (actualCheckDigit !== expectedCheckDigit) {
    errors.push(`Invalid check digit at position 9. Expected ${expectedCheckDigit}, got ${actualCheckDigit}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalizedVin
  };
}
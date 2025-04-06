export type VinValidationResult = {
  isValid: boolean;
  errors: string[];
  normalizedVin: string;
};

export type VinDetails = {
  manufacturer: string;
  year: number;
  serialNumber: string;
  countryCode: string;
  isValid: boolean;
};
/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Find the best match for a string from an array of options
 * @param input The string to match
 * @param options Array of valid options to match against
 * @param threshold Maximum character difference allowed (0-1, where 0 is exact match)
 * @returns The best matching option, or the original input if no good match found
 */
export function findBestMatch(
  input: string,
  options: string[],
  threshold: number = 0.3
): string {
  if (!input || options.length === 0) return input;

  const inputLower = input.toLowerCase().trim();
  
  // First check for exact match (case-insensitive)
  const exactMatch = options.find(opt => opt.toLowerCase() === inputLower);
  if (exactMatch) return exactMatch;

  let bestMatch = input;
  let bestDistance = Infinity;

  for (const option of options) {
    const optionLower = option.toLowerCase().trim();
    const distance = levenshteinDistance(inputLower, optionLower);
    const maxLen = Math.max(inputLower.length, optionLower.length);
    const normalizedDistance = distance / maxLen;

    if (normalizedDistance <= threshold && distance < bestDistance) {
      bestDistance = distance;
      bestMatch = option;
    }
  }

  return bestMatch;
}

/**
 * Match multiple strings against their respective option arrays
 */
export function fuzzyMatchObject<T extends Record<string, unknown>>(
  data: T,
  fieldOptions: Partial<Record<keyof T, string[]>>,
  threshold: number = 0.3
): T {
  const result: T = { ...data };

  for (const [field, options] of Object.entries(fieldOptions)) {
    const key = field as keyof T;
    if (options && Array.isArray(options) && result[key]) {
      const current = result[key];
      if (typeof current === 'string') {
        (result as unknown as Record<string, unknown>)[field] = findBestMatch(
          current,
          options,
          threshold
        );
      }
    }
  }

  return result;
}

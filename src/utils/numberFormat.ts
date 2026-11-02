/**
 * Indonesian Number & Currency Formatting Utilities
 * Uses dot (.) as thousand separator and comma (,) or dot (.) for decimals
 */

/**
 * Format a number or numeric string to Indonesian dot-separated format (e.g. 20000 -> "20.000")
 */
export function formatNumberWithDots(value: number | string | null | undefined, allowDecimal: boolean = false): string {
  if (value === null || value === undefined || value === '') return '';

  const str = String(value).trim();
  if (str === '') return '';

  if (allowDecimal) {
    // Normalise comma to dot for parsing
    const normalized = str.replace(/,/g, '.');
    // If it ends with dot/comma while typing, keep it
    const hasTrailingDecimal = str.endsWith('.') || str.endsWith(',');
    const parts = normalized.split('.');

    const intPart = parts[0].replace(/\D/g, '');
    const formattedInt = intPart ? Number(intPart).toLocaleString('id-ID') : '0';

    if (parts.length > 1) {
      const decPart = parts.slice(1).join('').replace(/\D/g, '');
      return `${formattedInt},${decPart}`;
    }

    if (hasTrailingDecimal) {
      return `${formattedInt},`;
    }

    return formattedInt;
  }

  // Integer only
  const cleanDigits = str.replace(/\D/g, '');
  if (!cleanDigits) return '';
  return Number(cleanDigits).toLocaleString('id-ID');
}

/**
 * Parse a dot-formatted string back to a pure numeric value
 * e.g. "20.000" -> 20000, "1.500,25" -> 1500.25, "0,25" -> 0.25
 */
export function parseNumberFromDots(formattedStr: string | number): number {
  if (formattedStr === null || formattedStr === undefined || formattedStr === '') return 0;
  if (typeof formattedStr === 'number') return isNaN(formattedStr) ? 0 : formattedStr;

  const str = String(formattedStr).trim();
  if (!str) return 0;

  // If string contains no separators, parse directly
  if (!/[.,]/.test(str)) {
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  // Check if string uses thousand separators like "5,000", "5.000", "1.000.000", "1,000,000"
  // 1. If it has both dot and comma (e.g. "5.000,5" or "5,000.5")
  if (str.includes('.') && str.includes(',')) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastComma > lastDot) {
      // Indonesian style: 5.000,5 -> remove dots, replace comma with dot
      const clean = str.replace(/\./g, '').replace(',', '.');
      return parseFloat(clean) || 0;
    } else {
      // US style: 5,000.5 -> remove commas
      const clean = str.replace(/,/g, '');
      return parseFloat(clean) || 0;
    }
  }

  // 2. Contains ONLY dots or ONLY commas
  const separator = str.includes('.') ? '.' : ',';
  const parts = str.split(separator);

  // If there are multiple separators (e.g. 1.000.000 or 1,000,000), they are all thousand separators
  if (parts.length > 2) {
    const clean = str.replace(new RegExp(`\\${separator}`, 'g'), '');
    return parseFloat(clean) || 0;
  }

  // If there is 1 separator (e.g. "5,000" or "5.000" vs "5,5" or "5.5")
  const decimalPart = parts[1];
  // If decimalPart has exactly 3 digits (e.g. "000" in "5,000" or "5.000"), it's a thousand separator unless explicitly specified
  if (decimalPart.length === 3) {
    const clean = str.replace(new RegExp(`\\${separator}`, 'g'), '');
    return parseFloat(clean) || 0;
  }

  // Otherwise (e.g. 1 or 2 digits like 5,5 or 5.5 or 5,25), it's a decimal
  const clean = parts[0].replace(/\D/g, '') + '.' + decimalPart.replace(/\D/g, '');
  return parseFloat(clean) || 0;
}

/**
 * Format pure number to Rupiah string, e.g. 15000 -> "Rp 15.000"
 */
export function formatRupiah(value: number | null | undefined): string {
  const val = Number(value || 0);
  return `Rp ${val.toLocaleString('id-ID')}`;
}

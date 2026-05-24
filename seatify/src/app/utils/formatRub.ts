/**
 * Formats a ruble price in Russian standard: space as thousands separator, ₽ suffix.
 * e.g. 1500 → "1 500 ₽", 449 → "449 ₽"
 * Uses non-breaking space ( ) as the thousands separator.
 */
export const formatRub = (price: number): string => {
  const rounded = Math.round(price);
  if (rounded >= 1000) {
    const thousands = Math.floor(rounded / 1000);
    const rest = rounded % 1000;
    return rest > 0
      ? `${thousands} ${rest.toString().padStart(3, "0")} ₽`
      : `${thousands} 000 ₽`;
  }
  return `${rounded} ₽`;
};

/** Service fee charged per booking (in rubles). */
export const SERVICE_FEE = 99;

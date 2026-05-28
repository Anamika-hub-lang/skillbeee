export function formatMinor(minor: number, currency: string): string {
  const c = (currency || 'INR').toUpperCase();
  const major = minor / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: c.length === 3 ? c : 'INR',
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${c} ${major.toFixed(2)}`;
  }
}

/** Requirement `budget` is stored as whole major units (not cents). */
export function formatGigBudget(budget: number, currency: string): string {
  const c = (currency || 'INR').toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: c.length === 3 ? c : 'INR',
      maximumFractionDigits: 0,
    }).format(budget);
  } catch {
    return `${c} ${budget}`;
  }
}

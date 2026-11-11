/** Arabic phrase for a number of clinics, with the right grammar for the count. */
export function clinicsPhrase(n: number): string {
  if (n === 1) return "في عيادة واحدة";
  if (n === 2) return "في عيادتين";
  if (n >= 3 && n <= 10) return `في ${n} عيادات`;
  if (n >= 11) return `في ${n} عيادة`;
  return "";
}

/** "العيادة" for exactly one clinic, otherwise "العيادات" (zero counts as plural). */
export function clinicsWord(n: number): "العيادة" | "العيادات" {
  return n === 1 ? "العيادة" : "العيادات";
}

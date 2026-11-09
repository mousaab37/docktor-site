/** Builds a wa.me link. Throws when the number is not 8-15 digits. */
export function waLink(number: string, message?: string): string {
  if (!/^\d{8,15}$/.test(number)) {
    throw new Error(`Invalid WhatsApp number: "${number}" (expected 8-15 digits)`);
  }
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Replaces every {clinic} placeholder with the clinic name. */
export function clinicMessage(template: string, clinicName: string): string {
  return template.replaceAll("{clinic}", clinicName);
}

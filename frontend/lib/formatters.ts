export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** (312) 555-0100 — strips a leading US country code. */
export function formatUSPhone(value: string): string {
  let digits = digitsOnly(value);
  if (digits.length > 10 && digits.startsWith("1")) digits = digits.slice(1);
  digits = digits.slice(0, 10);

  if (digits.length === 0) return "";
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** E.164, the format SMS providers expect: +13125550100 */
export function toE164US(value: string): string {
  return `+1${digitsOnly(value).slice(-10)}`;
}

/** 123-45-6789 */
export function formatSSN(value: string): string {
  const digits = digitsOnly(value).slice(0, 9);
  if (digits.length < 4) return digits;
  if (digits.length < 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

/** MM/DD/YYYY */
export function formatDateInput(value: string): string {
  const digits = digitsOnly(value).slice(0, 8);
  if (digits.length < 3) return digits;
  if (digits.length < 5) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function formatZip(value: string): string {
  return digitsOnly(value).slice(0, 5);
}

/** "742 N Milwaukee Ave, Chicago, IL 60642, USA" → drops the country suffix. */
export function withoutCountry(address: string): string {
  return address.replace(/,\s*(USA|United States)$/i, "").trim();
}

export function formatPlate(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9 -]/g, "").slice(0, 8);
}

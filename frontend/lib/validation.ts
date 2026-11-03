import { digitsOnly } from "@/lib/formatters";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN_LENGTH = 8;
export const DRIVER_MIN_AGE = 21;

export function isEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function isUSPhone(value: string): boolean {
  let digits = digitsOnly(value);
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  // NANP: area code and exchange can't start with 0 or 1
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(digits);
}

export function isZip(value: string): boolean {
  return /^\d{5}$/.test(value.trim());
}

export function isSSN(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length !== 9) return false;
  const area = digits.slice(0, 3);
  const group = digits.slice(3, 5);
  const serial = digits.slice(5);
  if (area === "000" || area === "666" || area.startsWith("9")) return false;
  return group !== "00" && serial !== "0000";
}

export function passwordError(value: string): string | undefined {
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return "Include at least one letter and one number";
  }
  return undefined;
}

/** Parses MM/DD/YYYY, rejecting impossible dates like 02/31. */
export function parseUSDate(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function ageOn(birth: Date, today = new Date()): number {
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export type FormErrors<K extends string> = Partial<Record<K, string>>;

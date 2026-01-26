import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInYears } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function generateInvoiceNumber(): string {
  // Generate a short unique ID (timestamp + random)
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${timestamp}-${random}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function calculateAge(dob: Date | string | undefined | null): number | string {
  if (!dob) return "N/A"
  try {
    const date = typeof dob === 'string' ? new Date(dob) : dob
    return differenceInYears(new Date(), date)
  } catch (error) {
    return "N/A"
  }
}

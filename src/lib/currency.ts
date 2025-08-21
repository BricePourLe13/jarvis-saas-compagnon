export type SupportedCurrency = 'USD' | 'EUR'

export interface CurrencyFormatOptions {
  currency?: SupportedCurrency
  locale?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

const DEFAULT_CURRENCY: SupportedCurrency = (process.env.NEXT_PUBLIC_CURRENCY as SupportedCurrency) || 'USD'
const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_LOCALE || 'en-US'

export function formatCurrency(
  value: number | null | undefined,
  {
    currency = DEFAULT_CURRENCY,
    locale = DEFAULT_LOCALE,
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  }: CurrencyFormatOptions = {}
): string {
  const amount = typeof value === 'number' && !Number.isNaN(value) ? value : 0
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount)
  } catch {
    // Fallback simple en cas d'environnement limité
    const symbol = currency === 'EUR' ? '€' : '$'
    return `${symbol}${amount.toFixed(Math.max(minimumFractionDigits, 0))}`
  }
}


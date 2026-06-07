export const PRO_PRICE_MONTHLY =
  Number(process.env.NEXT_PUBLIC_PRO_PRICE) > 0
    ? Number(process.env.NEXT_PUBLIC_PRO_PRICE)
    : 9.99

export const PRO_CURRENCY = process.env.NEXT_PUBLIC_PRO_CURRENCY?.trim() || 'USD'

export function formatProPrice() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: PRO_CURRENCY,
  }).format(PRO_PRICE_MONTHLY)
}

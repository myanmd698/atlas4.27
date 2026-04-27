export type AccountCategory =
  | 'banking'
  | 'investment'
  | 'credit_card'
  | 'crypto'

export type LinkedAccount = {
  id: string
  institutionId: string
  institutionName: string
  /** Display name, e.g. "Checking" */
  name: string
  /** Last 4 digits */
  mask: string
  subtype: string
  category: AccountCategory
}

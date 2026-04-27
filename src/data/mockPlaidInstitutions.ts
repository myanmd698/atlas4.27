import type { AccountCategory, LinkedAccount } from '../lib/linkedAccounts'

export type MockInstitution = {
  id: string
  name: string
}

export const ACCOUNT_CATEGORIES: {
  id: AccountCategory
  label: string
}[] = [
  { id: 'banking', label: 'Banking' },
  { id: 'investment', label: 'Investment' },
  { id: 'credit_card', label: 'Credit card' },
  { id: 'crypto', label: 'Crypto' },
]

export const institutionsByCategory: Record<AccountCategory, MockInstitution[]> =
  {
    banking: [
      { id: 'ins_chase', name: 'Chase' },
      { id: 'ins_bofa', name: 'Bank of America' },
      { id: 'ins_wells', name: 'Wells Fargo' },
      { id: 'ins_citi', name: 'Citibank' },
    ],
    investment: [
      { id: 'ins_fidelity', name: 'Fidelity' },
      { id: 'ins_vanguard', name: 'Vanguard' },
      { id: 'ins_schwab', name: 'Charles Schwab' },
      { id: 'ins_robinhood', name: 'Robinhood' },
    ],
    credit_card: [
      { id: 'ins_amex', name: 'American Express' },
      { id: 'ins_chase_sapphire', name: 'Chase' },
      { id: 'ins_cap_one', name: 'Capital One' },
      { id: 'ins_discover', name: 'Discover' },
    ],
    crypto: [
      { id: 'ins_coinbase', name: 'Coinbase' },
      { id: 'ins_kraken', name: 'Kraken' },
      { id: 'ins_gemini', name: 'Gemini' },
      { id: 'ins_binance_us', name: 'Binance.US' },
    ],
  }

function randomMask(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export function mockAccountsForLink(
  institution: MockInstitution,
  category: AccountCategory,
): LinkedAccount[] {
  const base = {
    institutionId: institution.id,
    institutionName: institution.name,
    category,
  }

  switch (category) {
    case 'banking':
      return [
        {
          id: crypto.randomUUID(),
          ...base,
          name: 'Checking',
          mask: randomMask(),
          subtype: 'checking',
        },
        {
          id: crypto.randomUUID(),
          ...base,
          name: 'Savings',
          mask: randomMask(),
          subtype: 'savings',
        },
      ]
    case 'investment':
      return [
        {
          id: crypto.randomUUID(),
          ...base,
          name: 'Individual brokerage',
          mask: randomMask(),
          subtype: 'brokerage',
        },
      ]
    case 'credit_card':
      return [
        {
          id: crypto.randomUUID(),
          ...base,
          name: 'Credit card',
          mask: randomMask(),
          subtype: 'credit card',
        },
      ]
    case 'crypto':
      return [
        {
          id: crypto.randomUUID(),
          ...base,
          name: 'Spot wallet',
          mask: randomMask(),
          subtype: 'crypto',
        },
        {
          id: crypto.randomUUID(),
          ...base,
          name: 'Earn wallet',
          mask: randomMask(),
          subtype: 'crypto',
        },
      ]
  }
}

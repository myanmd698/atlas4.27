export const PRIMARY_REASONS = [
  {
    id: 'directional',
    title: 'Stay on track with the big picture',
    blurb:
      'A consistent check-in on direction, not line items—mainly net worth and pace.',
  },
  {
    id: 'milestone',
    title: 'A big life decision soon',
    blurb:
      'A home, wedding, child, or education goal—I want the tradeoffs to be clear.',
  },
  {
    id: 'partner',
    title: 'Get aligned with a partner',
    blurb:
      'I need a shared, contextual summary we can look at without rebuilding spreadsheets.',
  },
  {
    id: 'optimization',
    title: 'Do a little better, passively',
    blurb:
      'I want light-touch ideas on what could improve, without high-maintenance budgets.',
  },
] as const

export type PrimaryReasonId = (typeof PRIMARY_REASONS)[number]['id']

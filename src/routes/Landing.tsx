import { Link } from 'react-router-dom'
import { planLabel, TRIAL_DAYS } from '../lib/pricing'
import { PRIMARY_REASONS } from './reasons'

const FEATURES: {
  title: string
  body: string
}[] = [
  {
    title: 'A directional snapshot',
    body: 'Net worth, pace, and a simple trend—not every line item, so the picture stays legible.',
  },
  {
    title: 'Optional account linking',
    body: 'Connect your institutions when you want Qapital Atlas to read balances; you can also explore with sample data first.',
  },
  {
    title: 'Trial, then a clear plan',
    body: `Start with a ${TRIAL_DAYS}-day free trial, then continue at ${planLabel('monthly')} or ${planLabel('annual')}. The annual option is one payment for the year.`,
  },
  {
    title: 'Tailored to your goal',
    body: "Tell us what you're here for so we can prioritize the story you see first.",
  },
]

export function Landing() {
  return (
    <div className="landing">
      <header className="landing__hero flow">
        <h1 className="landing__brand">Qapital Atlas</h1>
        <p className="landing__tagline">
          See where you are headed, not every coffee purchase.
        </p>
        <p className="flow__lead text-muted">
          Qapital Atlas is a calm place to check direction on your money: net worth, pace, and
          a few high-signal focus areas—so you and anyone you plan with can stay
          aligned without building another spreadsheet.
        </p>
        <div className="landing__cta">
          <Link className="btn btn--primary" to="/signup">
            Get started
          </Link>
        </div>
      </header>

      <section className="landing__section" aria-labelledby="can-do-heading">
        <h2 id="can-do-heading" className="flow__sub">
          What you can do with Qapital Atlas
        </h2>
        <div className="cards">
          {FEATURES.map((f) => (
            <div key={f.title} className="card">
              <h3 className="card__t">{f.title}</h3>
              <p className="card__b text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="landing__section"
        aria-labelledby="goals-heading"
      >
        <h2 id="goals-heading" className="flow__sub">
          Built for different “whys”
        </h2>
        <ul className="landing__list">
          {PRIMARY_REASONS.map((r) => (
            <li key={r.id} className="landing__list-item">
              <strong className="landing__list-title">{r.title}</strong>
              <span className="text-muted">{r.blurb}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="flow__footer text-muted small">
        In this build, some steps are simulated in your browser. Linking to banks and
        live data are optional next steps—Qapital Atlas is a prototype for the product direction.
      </p>
    </div>
  )
}

import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { TrendChart } from '../components/TrendChart'
import { useSession } from '../context/SessionContext'
import { getInitialScreenName } from '../lib/redirects'
import { updateSession } from '../lib/session'
import { getInsightsSummary, type InsightsSummary } from '../mocks/apiLogic'
import { PRIMARY_REASONS } from '../data/reasons'
import type { RootStackParamList } from '../navigation/types'
import { colors, space } from '../theme'
import type { RootScreenProps } from '../navigation/types'

type Props = RootScreenProps<'Dashboard'>

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

export function DashboardScreen({ navigation }: Props) {
  const { session, refresh } = useSession()
  const [data, setData] = useState<InsightsSummary | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (session == null) {
      navigation.replace('SignUp')
      return
    }
    if (session.onboardingStep !== 'complete') {
      const n = getInitialScreenName(
        session,
      ) as keyof RootStackParamList
      if (n !== 'Dashboard') navigation.replace(n)
    }
  }, [session, navigation])

  useEffect(() => {
    if (session == null || session.onboardingStep !== 'complete') return
    void (async () => {
      try {
        setLoadError(null)
        setData(await getInsightsSummary())
      } catch (e) {
        setLoadError(
          e instanceof Error ? e.message : 'Could not load the summary.',
        )
      }
    })()
  }, [session?.token, session?.onboardingStep])

  if (session == null || session.onboardingStep !== 'complete') {
    return <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>
  }

  const reason =
    session.primaryReasonId != null
      ? PRIMARY_REASONS.find((r) => r.id === session.primaryReasonId)
      : null
  const showSample = !session.accountsLinked

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      style={styles.flex}
    >
      <View style={styles.head}>
        <Text style={styles.h1}>Your directional snapshot</Text>
        {reason != null && (
          <Text style={styles.personalized}>
            Personalized for: <Text style={styles.bold}>{reason.title}</Text>
          </Text>
        )}
      </View>

      {showSample ? (
        <View style={styles.banner}>
          <View style={styles.bannerRow}>
            <Text style={styles.bannerText}>
              <Text style={styles.bold}>Sample data.</Text> This preview is mock
              data so you can see how we summarize direction, not every
              transaction. You can{' '}
            </Text>
            <Pressable
              onPress={async () => {
                await updateSession({ onboardingStep: 'connect' })
                await refresh()
                navigation.replace('OnboardingConnect')
              }}
            >
              <Text style={styles.link}>try the link step again</Text>
            </Pressable>
            <Text style={styles.bannerText}> in this demo.</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.banner, styles.bannerMuted]}>
          <Text style={styles.bannerText}>
            <Text style={styles.bold}>Preview (mock).</Text> The link step was
            completed in this demo; you still see sample insights in this build.
          </Text>
        </View>
      )}

      {loadError != null && (
        <Text style={styles.error} accessibilityRole="alert">
          {loadError}
        </Text>
      )}

      {data != null && (
        <>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Estimated net worth</Text>
            <Text style={styles.kpiValue}>
              {fmtCurrency(data.netWorth)}
            </Text>
            <Text style={styles.kpiDelta}>
              {data.netWorthChange12mPct >= 0 ? '+' : ''}
              {data.netWorthChange12mPct.toFixed(1)}% 12m
            </Text>
            <View style={styles.hr} />
            <Text style={styles.kpiHeadline}>{data.headline}</Text>
          </View>
          {data.focusAreas.map((a) => (
            <View key={a.title} style={styles.card}>
              <Text style={styles.cardT}>{a.title}</Text>
              <Text style={styles.cardB}>{a.body}</Text>
            </View>
          ))}
          <Text style={styles.h2}>Net worth (trend, mock series)</Text>
          <TrendChart series={data.netWorthSeries} />
        </>
      )}

      {data == null && loadError == null && (
        <Text style={styles.muted}>Loading summary…</Text>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  flex: { backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', backgroundColor: colors.bg },
  scroll: { padding: space.pad, paddingBottom: 32 },
  head: { marginBottom: 16 },
  h1: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '600',
  },
  personalized: { color: colors.muted, fontSize: 15, marginTop: 6 },
  bold: { color: colors.text, fontWeight: '600' },
  banner: {
    backgroundColor: colors.bgElev,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  bannerMuted: { borderStyle: 'dashed' },
  bannerRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline' },
  bannerText: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  link: { color: colors.accent, textDecorationLine: 'underline' },
  error: { color: colors.danger, marginBottom: 8 },
  kpi: {
    backgroundColor: colors.bgElev,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  kpiLabel: {
    color: colors.muted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  kpiValue: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
    marginTop: 4,
  },
  kpiDelta: { color: colors.up, fontSize: 16, fontWeight: '500', marginTop: 2 },
  hr: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    marginTop: 12,
    marginBottom: 0,
  },
  kpiHeadline: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 12 },
  card: {
    backgroundColor: colors.bgElev,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  cardT: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 6 },
  cardB: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  h2: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 6 },
  muted: { color: colors.muted },
})

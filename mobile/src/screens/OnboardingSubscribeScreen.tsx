import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSession } from '../context/SessionContext'
import { getInitialScreenName } from '../lib/redirects'
import { planLabel, type SubscriptionPlan } from '../lib/pricing'
import { updateSession } from '../lib/session'
import { confirmSubscription } from '../mocks/apiLogic'
import type { RootStackParamList, RootScreenProps } from '../navigation/types'
import { colors, space } from '../theme'

type Props = RootScreenProps<'OnboardingSubscribe'>

/**
 * In production, load a hosted pay page in a WebView, use Adyen’s mobile SDK, or
 * a redirect flow; this screen mirrors the web prototype with a local mock.
 */
export function OnboardingSubscribeScreen({ navigation }: Props) {
  const { session, refresh } = useSession()
  const [plan, setPlan] = useState<SubscriptionPlan>('monthly')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (session == null) {
      navigation.replace('SignUp')
      return
    }
    if (session.onboardingStep !== 'subscribe') {
      const next = getInitialScreenName(session) as keyof RootStackParamList
      if (next !== 'OnboardingSubscribe') navigation.replace(next)
    }
  }, [session, navigation])

  async function onStartTrial() {
    if (session == null) return
    setErr(null)
    setBusy(true)
    try {
      const res = await confirmSubscription({
        plan,
        userId: session.userId,
      })
      await updateSession({
        subscriptionPlan: res.plan,
        subscriptionStatus: res.subscriptionStatus,
        trialEndsAt: res.trialEndsAt,
        onboardingStep: 'reasons',
      })
      await refresh()
      navigation.replace('OnboardingWhy')
    } catch (caught: unknown) {
      setErr(
        caught instanceof Error ? caught.message : 'Could not continue.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (session == null || session.onboardingStep !== 'subscribe') {
    return <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.h1}>Start your 7-day free trial</Text>
      <Text style={styles.lead}>
        No charge today. After the trial, your plan is {planLabel('monthly')}{' '}
        or {planLabel('annual')}. Cancel before the trial ends to avoid
        being charged. This app uses a mock of the Adyen web flow; ship a WebView
        to your checkout URL or a native Adyen layer for real cards.
      </Text>
      {(['monthly', 'annual'] as const).map((p) => {
        const active = plan === p
        return (
          <Pressable
            key={p}
            onPress={() => {
              setPlan(p)
            }}
            style={({ pressed }) => [
              styles.card,
              active && styles.cardActive,
              pressed && !active && styles.cardPressed,
            ]}
          >
            <Text style={styles.title}>
              {p === 'monthly' ? 'Monthly' : 'Annual'}
            </Text>
            <Text style={styles.blurb}>{planLabel(p)}</Text>
          </Pressable>
        )
      })}
      {err != null ? <Text style={styles.error} accessibilityRole="alert">{err}</Text> : null}
      <Pressable
        style={({ pressed }) => [styles.btn, busy && styles.btnOff, pressed && !busy && styles.btnPressed]}
        onPress={() => void onStartTrial()}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Start 7-day free trial (mock)</Text>
        )}
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', backgroundColor: colors.bg },
  scroll: { padding: space.pad, paddingBottom: 40, backgroundColor: colors.bg },
  h1: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  lead: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 20 },
  card: {
    backgroundColor: colors.bgElev,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  cardActive: { borderColor: colors.accent, backgroundColor: 'rgba(61, 139, 122, 0.12)' },
  cardPressed: { opacity: 0.9 },
  title: { color: colors.text, fontSize: 16, fontWeight: '600' },
  blurb: { color: colors.muted, fontSize: 14, marginTop: 4 },
  error: { color: colors.danger, marginBottom: 8 },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnOff: { opacity: 0.5 },
  btnPressed: { opacity: 0.9 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})

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
import { updateSession } from '../lib/session'
import { savePrimaryReason } from '../mocks/apiLogic'
import { PRIMARY_REASONS, type PrimaryReasonId } from '../data/reasons'
import type { RootStackParamList, RootScreenProps } from '../navigation/types'
import { colors, space } from '../theme'

type Props = RootScreenProps<'OnboardingWhy'>

export function OnboardingWhyScreen({ navigation }: Props) {
  const { session, refresh } = useSession()
  const [reasonId, setReasonId] = useState<PrimaryReasonId | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (session == null) {
      navigation.replace('SignUp')
      return
    }
    if (session.onboardingStep !== 'reasons') {
      const next = getInitialScreenName(
        session,
      ) as keyof RootStackParamList
      if (next !== 'OnboardingWhy') navigation.replace(next)
    }
  }, [session, navigation])

  async function onSubmit() {
    if (session == null) return
    setErr(null)
    if (reasonId == null) {
      setErr('Choose one option so we can tailor the experience.')
      return
    }
    setBusy(true)
    try {
      await savePrimaryReason({ reasonId })
      await updateSession({ primaryReasonId: reasonId, onboardingStep: 'complete' })
      await refresh()
      navigation.replace('Dashboard')
    } catch (caught: unknown) {
      setErr(
        caught instanceof Error ? caught.message : 'Could not save.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (session == null || session.onboardingStep !== 'reasons') {
    return <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.h1}>What brings you to Qapital Atlas today?</Text>
      <Text style={styles.lead}>
        We use this to prioritize what you see first—one choice is enough for now.
      </Text>
      {PRIMARY_REASONS.map((r) => {
        const active = reasonId === r.id
        return (
          <Pressable
            key={r.id}
            onPress={() => {
              setReasonId(r.id)
            }}
            style={({ pressed }) => [
              styles.card,
              active && styles.cardActive,
              pressed && !active && styles.cardPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <View style={styles.cardRow}>
              <View
                style={[styles.dot, active && styles.dotOn]}
                accessibilityElementsHidden
              />
              <View style={styles.cardText}>
                <Text style={styles.title}>{r.title}</Text>
                <Text style={styles.blurb}>{r.blurb}</Text>
              </View>
            </View>
          </Pressable>
        )
      })}
      {err != null ? (
        <Text style={styles.error} accessibilityRole="alert">
          {err}
        </Text>
      ) : null}
      <Pressable
        style={({ pressed }) => [styles.btn, busy && styles.btnOff, pressed && !busy && styles.btnPressed]}
        onPress={() => void onSubmit()}
        disabled={busy}
        accessibilityRole="button"
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Continue</Text>
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
  cardRow: { flexDirection: 'row', gap: 10 },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.line,
    marginTop: 2,
  },
  dotOn: { borderColor: colors.accent, backgroundColor: colors.accent },
  cardText: { flex: 1, gap: 4 },
  title: { color: colors.text, fontSize: 16, fontWeight: '600' },
  blurb: { color: colors.muted, fontSize: 14, lineHeight: 20 },
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

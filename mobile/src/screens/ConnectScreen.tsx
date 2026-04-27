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
import { setAccounts } from '../mocks/apiLogic'
import type { RootStackParamList } from '../navigation/types'
import { colors, space } from '../theme'
import type { RootScreenProps } from '../navigation/types'

type Props = RootScreenProps<'OnboardingConnect'>

export function ConnectScreen({ navigation }: Props) {
  const { session, refresh } = useSession()
  const [busy, setBusy] = useState(false)
  const [linking, setLinking] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (session == null) {
      navigation.replace('SignUp')
      return
    }
    if (session.onboardingStep !== 'connect') {
      const n = getInitialScreenName(
        session,
      ) as keyof RootStackParamList
      if (n !== 'OnboardingConnect') navigation.replace(n)
    }
  }, [session, navigation])

  async function finish(action: 'link' | 'skip') {
    setErr(null)
    if (action === 'link') setLinking(true)
    else setBusy(true)
    try {
      const res = await setAccounts({ action })
      await updateSession({
        onboardingStep: 'complete',
        accountsLinked: res.accountsLinked,
      })
      await refresh()
      navigation.replace('Dashboard')
    } catch (caught: unknown) {
      setErr(
        caught instanceof Error ? caught.message : 'Could not continue.',
      )
    } finally {
      setLinking(false)
      setBusy(false)
    }
  }

  if (session == null || session.onboardingStep !== 'connect') {
    return <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.h1}>Link your accounts (optional)</Text>
      <Text style={styles.lead}>
        Connect with Plaid so North can read balances and keep your summary up to
        date. In this prototype, Link accounts simulates a successful
        connect—you still see the same sample insights either way.
      </Text>
      {err != null ? <Text style={styles.error} accessibilityRole="alert">{err}</Text> : null}
      <Pressable
        style={({ pressed }) => [styles.btn, (busy || linking) && styles.btnOff, pressed && !busy && !linking && styles.pressed]}
        onPress={() => void finish('link')}
        disabled={busy || linking}
      >
        {linking ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Link accounts</Text>
        )}
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.ghost, (busy || linking) && styles.btnOff, pressed && !busy && !linking && styles.pressed]}
        onPress={() => void finish('skip')}
        disabled={busy || linking}
      >
        <Text style={styles.ghostText}>
          {busy ? 'Skipping…' : 'Skip for now'}
        </Text>
      </Pressable>
      <Text style={styles.footer}>
        Real Plaid integration and bank connections are a follow-up; in this
        build everything is mocked on device.
      </Text>
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
  error: { color: colors.danger, marginBottom: 12, fontSize: 14 },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnOff: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  ghost: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  ghostText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  pressed: { opacity: 0.9 },
  footer: { color: colors.muted, fontSize: 12, marginTop: 20, lineHeight: 18 },
})

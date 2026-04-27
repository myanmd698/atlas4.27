import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSession } from '../context/SessionContext'
import { getInitialScreenName } from '../lib/redirects'
import { saveAfterRegister } from '../lib/session'
import type { RootStackParamList } from '../navigation/types'
import { register } from '../mocks/apiLogic'
import { colors, space } from '../theme'
import type { RootScreenProps } from '../navigation/types'

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

type Props = RootScreenProps<'SignUp'>

export function SignUpScreen({ navigation }: Props) {
  const { session, ready, refresh } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!ready) return
    if (session == null) return
    const n = getInitialScreenName(session) as keyof RootStackParamList
    if (n !== 'SignUp') navigation.replace(n)
  }, [ready, session, navigation])

  async function onSubmit() {
    setErr(null)
    const eTrim = email.trim()
    if (!isValidEmail(eTrim)) {
      setErr('Enter a valid email address.')
      return
    }
    if (password.length < 8) {
      setErr('Use at least 8 characters for your password.')
      return
    }
    if (password !== confirm) {
      setErr('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      const r = await register({ email: eTrim, password })
      await saveAfterRegister({
        userId: r.userId,
        token: r.token,
        email: r.email,
      })
      await refresh()
      navigation.replace('OnboardingConnect')
    } catch (caught: unknown) {
      setErr(caught instanceof Error ? caught.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.body}>
          <Text style={styles.h1}>Create your account</Text>
          <Text style={styles.lead}>
            A calm place to see where you are headed—not every coffee purchase.
          </Text>
          {err != null ? (
            <Text style={styles.error} accessibilityRole="alert">
              {err}
            </Text>
          ) : null}
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!busy}
              placeholder="you@company.com"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              editable={!busy}
              style={styles.input}
            />
            <Text style={styles.hint}>At least 8 characters.</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              editable={!busy}
              style={styles.input}
            />
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.btn,
              busy && styles.btnDisabled,
              pressed && !busy && styles.btnPressed,
            ]}
            onPress={() => void onSubmit()}
            disabled={busy}
            accessibilityRole="button"
            accessibilityState={{ busy }}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Continue</Text>
            )}
          </Pressable>
          <Text style={styles.footer}>
            By continuing, you agree this is a prototype. No real bank link yet.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: space.pad },
  body: { maxWidth: 500, alignSelf: 'stretch' },
  h1: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '600',
    marginBottom: space.sm,
  },
  lead: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 20 },
  error: { color: colors.danger, fontSize: 14, marginBottom: 12 },
  field: { marginBottom: 16 },
  label: { color: colors.muted, fontSize: 14, fontWeight: '500', marginBottom: 6 },
  input: {
    backgroundColor: colors.bgElev,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  hint: { color: colors.muted, fontSize: 12, marginTop: 4 },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { opacity: 0.9 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { color: colors.muted, fontSize: 12, marginTop: 20, lineHeight: 18 },
})

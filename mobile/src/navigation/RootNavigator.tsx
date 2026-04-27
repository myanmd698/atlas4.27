import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Pressable, Text, View } from 'react-native'
import { useSession } from '../context/SessionContext'
import { getInitialScreenName } from '../lib/redirects'
import { colors } from '../theme'
import { ConnectScreen } from '../screens/ConnectScreen'
import { DashboardScreen } from '../screens/DashboardScreen'
import { OnboardingWhyScreen } from '../screens/OnboardingWhyScreen'
import { OnboardingSubscribeScreen } from '../screens/OnboardingSubscribeScreen'
import { SignUpScreen } from '../screens/SignUpScreen'
import type { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

function headerSignOut() {
  return {
    headerRight: () => <HeaderSignOutButton />,
  }
}

function HeaderSignOutButton() {
  const { signOut } = useSession()
  return (
    <Pressable
      onPress={() => {
        void signOut()
      }}
      hitSlop={8}
    >
      <View>
        <Text style={{ color: colors.muted, textDecorationLine: 'underline' }}>
          Sign out
        </Text>
      </View>
    </Pressable>
  )
}

const screenDef = (name: string) => ({
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '600' as const, fontSize: 17 },
  contentStyle: { backgroundColor: colors.bg },
  title: name,
})

export function RootNavigator() {
  const { session } = useSession()
  return (
    <Stack.Navigator
      initialRouteName={getInitialScreenName(session)}
      screenOptions={{ headerShadowVisible: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{ ...screenDef('Qapital Atlas'), headerShown: true }}
      />
      <Stack.Screen
        name="OnboardingConnect"
        component={ConnectScreen}
        options={{ ...screenDef('Qapital Atlas'), ...headerSignOut() }}
      />
      <Stack.Screen
        name="OnboardingSubscribe"
        component={OnboardingSubscribeScreen}
        options={{ ...screenDef('Qapital Atlas'), ...headerSignOut() }}
      />
      <Stack.Screen
        name="OnboardingWhy"
        component={OnboardingWhyScreen}
        options={{ ...screenDef('Qapital Atlas'), ...headerSignOut() }}
      />
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ ...screenDef('Qapital Atlas'), ...headerSignOut() }}
      />
    </Stack.Navigator>
  )
}

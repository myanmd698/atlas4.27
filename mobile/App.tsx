import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { SessionProvider, useSession } from './src/context/SessionContext'
import { RootNavigator } from './src/navigation/RootNavigator'
import { navigationRef } from './src/navigation/navigationRef'
import { colors } from './src/theme'

function Gate() {
  const { ready } = useSession()
  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }
  return (
    <NavigationContainer ref={navigationRef}>
      <RootNavigator />
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <Gate />
        <StatusBar style="light" />
      </SessionProvider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

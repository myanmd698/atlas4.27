import type { NativeStackScreenProps } from '@react-navigation/native-stack'

export type RootStackParamList = {
  SignUp: undefined
  OnboardingConnect: undefined
  OnboardingSubscribe: undefined
  OnboardingWhy: undefined
  Dashboard: undefined
}

export type RootScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>

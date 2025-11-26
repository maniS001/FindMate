import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Header from '../components/Header';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

function RootLayoutContent() {
  const { theme, colors } = useTheme();

  const navigationTheme = theme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <Header />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background }
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="victim/search" />
            <Stack.Screen name="victim/results" />
            <Stack.Screen name="victim/claim/[id]" />
            <Stack.Screen name="founder/report" />
            <Stack.Screen name="founder/complaints" />
            <Stack.Screen name="success" />
            <Stack.Screen name="account" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="about" />
          </Stack>
        </View>
      </SafeAreaProvider>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}


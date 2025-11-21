import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F8FAFC' }, // Light slate background
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="founder/report" options={{ presentation: 'modal', headerShown: true, title: 'Report Found Item' }} />
        <Stack.Screen name="victim/search" options={{ headerShown: true, title: 'Find Lost Item' }} />
        <Stack.Screen name="victim/results" options={{ headerShown: true, title: 'Search Results' }} />
        <Stack.Screen name="victim/claim/[id]" options={{ headerShown: true, title: 'Claim Item' }} />
      </Stack>
    </SafeAreaProvider>
  );
}

import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Stack, usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Header from '../components/Header';
import WebContainer from '../components/WebContainer';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { API_URL } from '../constants/api';
import { registerForPushNotificationsAsync } from '../utils/pushNotifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function RootLayoutContent() {
  const { theme, colors } = useTheme();
  const pathname = usePathname();

  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const { user, token: authToken } = useAuth();

  useEffect(() => {
    registerForPushNotificationsAsync().then(async pushToken => {
      setExpoPushToken(pushToken ?? '');
      if (pushToken) {
        // Save to AsyncStorage so login/signup can access it
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.setItem('expoPushToken', pushToken);

        // Sync push token to backend if user is already logged in
        if (authToken) {
          try {
            await fetch(`${API_URL}/auth/update-push-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
              body: JSON.stringify({ pushToken }),
            });
          } catch (e) {
            console.warn('Failed to sync push token to backend:', e);
          }
        }
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      const url = response.notification.request.content.data?.url;
      if (url && typeof url === 'string') {
        const { router } = require('expo-router');
        router.push(url);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const navigationTheme = theme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <WebContainer>
            <Stack
              screenOptions={{
                headerShown: true,
                header: () => <Header forceShow />,
                contentStyle: { backgroundColor: colors.background }
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="auth/login" options={{ headerShown: false }} />
              <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
              <Stack.Screen name="victim/search" />
              <Stack.Screen name="victim/results" />
              <Stack.Screen name="victim/claim/[id]" />
              <Stack.Screen name="founder/report" />
              <Stack.Screen name="founder/complaints" options={{ headerShown: false }} />
              <Stack.Screen name="founder/complaint-detail" />
              <Stack.Screen name="success" options={{ headerShown: false }} />
              <Stack.Screen name="account" options={{ headerShown: false }} />
              <Stack.Screen name="settings" options={{ headerShown: false }} />
              <Stack.Screen name="about" options={{ headerShown: false }} />
              <Stack.Screen name="notifications" options={{ headerShown: false }} />
            </Stack>
          </WebContainer>
        </View>
      </SafeAreaProvider>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

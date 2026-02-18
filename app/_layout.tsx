import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { initDatabase } from '../db/schema';
import { getRandomNote } from '../db/queries';
import { rescheduleIfEnabled } from '../services/notifications';
import theme from '../constants/theme';

import '../global.css';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SQLiteProvider databaseName="penguins-diary.db" onInit={initDatabase}>
          <NotificationRescheduler />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.colors.washi },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="note/[id]" />
            <Stack.Screen name="settings" />
          </Stack>
          {/* Dark status bar for light washi background */}
          <StatusBar style="dark" />
        </SQLiteProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Picks a fresh random note and reschedules the notification on every app launch
function NotificationRescheduler() {
  const db = useSQLiteContext();

  useEffect(() => {
    rescheduleIfEnabled(async () => {
      const note = await getRandomNote(db);
      return note?.content ?? null;
    });
  }, [db]);

  return null;
}

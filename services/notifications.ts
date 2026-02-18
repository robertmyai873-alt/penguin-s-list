import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Storage keys
const NOTIFICATION_ENABLED_KEY = 'notification_enabled';
const NOTIFICATION_HOUR_KEY = 'notification_hour';
const NOTIFICATION_MINUTE_KEY = 'notification_minute';

// Default settings
const DEFAULT_HOUR = 9;
const DEFAULT_MINUTE = 0;

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

// Get current notification settings
export async function getNotificationSettings(): Promise<NotificationSettings> {
  const [enabledStr, hourStr, minuteStr] = await Promise.all([
    AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY),
    AsyncStorage.getItem(NOTIFICATION_HOUR_KEY),
    AsyncStorage.getItem(NOTIFICATION_MINUTE_KEY),
  ]);

  return {
    enabled: enabledStr === 'true',
    hour: hourStr ? parseInt(hourStr, 10) : DEFAULT_HOUR,
    minute: minuteStr ? parseInt(minuteStr, 10) : DEFAULT_MINUTE,
  };
}

// Save notification settings
export async function saveNotificationSettings(
  settings: NotificationSettings
): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, settings.enabled.toString()),
    AsyncStorage.setItem(NOTIFICATION_HOUR_KEY, settings.hour.toString()),
    AsyncStorage.setItem(NOTIFICATION_MINUTE_KEY, settings.minute.toString()),
  ]);
}

// Schedule the next notification (one-shot for the next occurrence of hour:minute)
export async function scheduleDailyNotification(
  hour: number,
  minute: number,
  noteContent: string
): Promise<string> {
  // Cancel any existing scheduled notifications first
  await cancelAllNotifications();

  // Calculate the next occurrence of the target time
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);

  // If the target time already passed today, schedule for tomorrow
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }

  const secondsUntil = Math.max(1, Math.round((next.getTime() - now.getTime()) / 1000));

  // Schedule a one-shot notification — on next app open we reschedule with a new random note
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Gratitude reminder',
      body: noteContent,
      data: { type: 'daily_gratitude' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsUntil,
      repeats: false,
    },
  });

  return identifier;
}

// Cancel all scheduled notifications
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Format time for display (e.g., "9:00 AM")
export function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

// Reschedule with a fresh random note (call on every app open)
export async function rescheduleIfEnabled(
  getRandomContent: () => Promise<string | null>
): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.enabled) return;

  const content = await getRandomContent();
  if (!content) return;

  await scheduleDailyNotification(settings.hour, settings.minute, content);
}

// Check if notifications are available on this device
export async function areNotificationsAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }
  return true;
}

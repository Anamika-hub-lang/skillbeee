import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null = null;
let handlerConfigured = false;
let autoRegistrationDisabled = false;

/**
 * Expo Go (SDK 53+) throws when `expo-notifications` loads on Android because
 * remote push was removed. Skip the native module entirely in Expo Go.
 */
export function canUseAppNotifications(): boolean {
  if (Platform.OS === 'web') return false;
  if (!Device.isDevice) return false;
  const inExpoGo =
    Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';
  return !inExpoGo;
}

export function expoGoNotificationsMessage(): string {
  return 'Notifications need a development build. Expo Go on Android no longer supports push — use `npx expo run:android` or an EAS build to test alerts.';
}

async function getNotifications(): Promise<NotificationsModule | null> {
  if (!canUseAppNotifications()) return null;

  if (!notificationsModule) {
    notificationsModule = await import('expo-notifications');
    if (!autoRegistrationDisabled) {
      autoRegistrationDisabled = true;
      try {
        await notificationsModule.setAutoServerRegistrationEnabledAsync(false);
      } catch {
        /* ignore — avoids projectId error on auto token registration */
      }
    }
  }
  if (!handlerConfigured) {
    handlerConfigured = true;
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
  return notificationsModule;
}

function getEasProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId
  );
}

export async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const Notifications = await getNotifications();
  if (!Notifications) return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'SkillBee',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FFC629',
  });
}

/** Request permission + Android channel. No EAS project required. */
export async function enableAppNotifications(): Promise<void> {
  if (!canUseAppNotifications()) {
    throw new Error(expoGoNotificationsMessage());
  }

  const Notifications = await getNotifications();
  if (!Notifications) return;

  await ensureAndroidNotificationChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    throw new Error('Allow notifications in your phone settings to get alerts.');
  }
}

export async function tryGetExpoPushToken(): Promise<string | null> {
  if (!canUseAppNotifications()) return null;
  const projectId = getEasProjectId();
  if (!projectId) return null;
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return null;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    return null;
  }
}

export async function registerForPushNotifications(): Promise<string | null> {
  await enableAppNotifications();
  return tryGetExpoPushToken();
}

export async function presentLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (!canUseAppNotifications()) return;
  const Notifications = await getNotifications();
  if (!Notifications) return;
  await ensureAndroidNotificationChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? {},
      sound: true,
    },
    trigger: null,
  });
}

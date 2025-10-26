/**
 * 푸시 알림 서비스
 * FCM과 로컬 알림을 관리합니다.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import Constants from 'expo-constants';

// 알림 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
}

export interface ScheduleNotificationOptions {
  title: string;
  body: string;
  data?: any;
  trigger: Date;
}

/**
 * 푸시 알림 권한 요청
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (!Device.isDevice) {
      console.log('에뮬레이터에서는 푸시 알림을 사용할 수 없습니다.');
      return false;
    }

    // Expo 알림 권한 요청
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('푸시 알림 권한이 거부되었습니다.');
      return false;
    }

    // Android 13+ (API level 33+)에서 추가 권한 필요
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: '기본 알림',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FCD34D',
      });

      // 일정 알림 채널
      await Notifications.setNotificationChannelAsync('schedule', {
        name: '일정 알림',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
      });
    }

    return true;
  } catch (error) {
    console.error('푸시 알림 권한 요청 실패:', error);
    return false;
  }
}

/**
 * FCM 디바이스 토큰 가져오기
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.log('에뮬레이터에서는 FCM 토큰을 가져올 수 없습니다.');
      return null;
    }

    // FCM 토큰 가져오기
    const token = await messaging().getToken();
    console.log('FCM 토큰:', token);
    
    return token;
  } catch (error) {
    console.error('FCM 토큰 가져오기 실패:', error);
    return null;
  }
}

/**
 * Expo Push 토큰 가져오기 (대체용)
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.log('에뮬레이터에서는 Expo Push 토큰을 가져올 수 없습니다.');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    if (!projectId) {
      console.log('EAS 프로젝트 ID가 설정되지 않았습니다.');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({
      projectId,
    })).data;
    
    console.log('Expo Push 토큰:', token);
    return token;
  } catch (error) {
    console.error('Expo Push 토큰 가져오기 실패:', error);
    return null;
  }
}

/**
 * 로컬 알림 예약 (일정 하루 전 알림용)
 */
export async function scheduleLocalNotification(
  options: ScheduleNotificationOptions
): Promise<string | null> {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: options.title,
        body: options.body,
        data: options.data || {},
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        date: options.trigger,
        channelId: 'schedule',
      },
    });

    console.log('로컬 알림 예약됨:', identifier, options.trigger);
    return identifier;
  } catch (error) {
    console.error('로컬 알림 예약 실패:', error);
    return null;
  }
}

/**
 * 예약된 로컬 알림 취소
 */
export async function cancelScheduledNotification(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    console.log('로컬 알림 취소됨:', identifier);
  } catch (error) {
    console.error('로컬 알림 취소 실패:', error);
  }
}

/**
 * 모든 예약된 로컬 알림 취소
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('모든 로컬 알림 취소됨');
  } catch (error) {
    console.error('모든 로컬 알림 취소 실패:', error);
  }
}

/**
 * 일정에 대한 알림 예약
 * - 일정 시작 하루 전 (created_at 기준)
 * - 일정 만료 하루 전 (due_date 기준)
 */
export async function scheduleRecordNotifications(record: {
  id: number;
  title: string;
  created_at: string;
  due_date?: string;
}): Promise<{ startNotificationId?: string; dueNotificationId?: string }> {
  const result: { startNotificationId?: string; dueNotificationId?: string } = {};

  try {
    const now = new Date();
    
    // 일정 시작 하루 전 알림 (created_at 1년 후 - 1일)
    // 실제 사용 시나리오에 맞게 조정 필요
    const createdDate = new Date(record.created_at);
    const oneYearLater = new Date(createdDate);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    const oneDayBeforeStart = new Date(oneYearLater);
    oneDayBeforeStart.setDate(oneDayBeforeStart.getDate() - 1);
    oneDayBeforeStart.setHours(9, 0, 0, 0); // 오전 9시

    if (oneDayBeforeStart > now) {
      const startNotificationId = await scheduleLocalNotification({
        title: '일정 시작 알림',
        body: `"${record.title}" 일정이 내일 시작됩니다.`,
        data: { recordId: record.id, type: 'start_reminder' },
        trigger: oneDayBeforeStart,
      });
      
      if (startNotificationId) {
        result.startNotificationId = startNotificationId;
      }
    }

    // 일정 만료 하루 전 알림
    if (record.due_date) {
      const dueDate = new Date(record.due_date);
      const oneDayBeforeDue = new Date(dueDate);
      oneDayBeforeDue.setDate(oneDayBeforeDue.getDate() - 1);
      oneDayBeforeDue.setHours(9, 0, 0, 0); // 오전 9시

      if (oneDayBeforeDue > now) {
        const dueNotificationId = await scheduleLocalNotification({
          title: '일정 만료 임박',
          body: `"${record.title}" 일정이 내일 만료됩니다.`,
          data: { recordId: record.id, type: 'due_reminder' },
          trigger: oneDayBeforeDue,
        });
        
        if (dueNotificationId) {
          result.dueNotificationId = dueNotificationId;
        }
      }
    }

    return result;
  } catch (error) {
    console.error('일정 알림 예약 실패:', error);
    return result;
  }
}

/**
 * 즉시 테스트 알림 보내기 (개발용)
 */
export async function sendTestNotification(): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '테스트 알림 📱',
        body: '푸시 알림이 정상적으로 작동합니다!',
        data: { test: true },
      },
      trigger: null, // 즉시 발송
    });
    console.log('테스트 알림 발송됨');
  } catch (error) {
    console.error('테스트 알림 발송 실패:', error);
  }
}

/**
 * FCM 메시지 리스너 설정
 */
export function setupFCMListeners(
  onMessageReceived: (message: any) => void,
  onTokenRefresh?: (token: string) => void
): () => void {
  // 포그라운드 메시지 수신
  const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
    console.log('포그라운드 메시지 수신:', remoteMessage);
    
    // 포그라운드에서도 알림 표시
    await Notifications.scheduleNotificationAsync({
      content: {
        title: remoteMessage.notification?.title || '알림',
        body: remoteMessage.notification?.body || '',
        data: remoteMessage.data || {},
      },
      trigger: null,
    });
    
    onMessageReceived(remoteMessage);
  });

  // 백그라운드 메시지 수신 (앱이 종료된 상태)
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('백그라운드 메시지 수신:', remoteMessage);
    onMessageReceived(remoteMessage);
  });

  // 토큰 갱신 리스너
  let unsubscribeTokenRefresh: (() => void) | undefined;
  if (onTokenRefresh) {
    unsubscribeTokenRefresh = messaging().onTokenRefresh((token) => {
      console.log('FCM 토큰 갱신됨:', token);
      onTokenRefresh(token);
    });
  }

  // 정리 함수 반환
  return () => {
    unsubscribeForeground();
    if (unsubscribeTokenRefresh) {
      unsubscribeTokenRefresh();
    }
  };
}

/**
 * 예약된 모든 알림 조회
 */
export async function getAllScheduledNotifications() {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('예약된 알림 목록:', notifications);
    return notifications;
  } catch (error) {
    console.error('예약된 알림 조회 실패:', error);
    return [];
  }
}


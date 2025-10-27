import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { 
  NotoSansKR_400Regular, 
  NotoSansKR_500Medium, 
  NotoSansKR_700Bold 
} from '@expo-google-fonts/noto-sans-kr';
import { Platform, View, Text, ActivityIndicator, SafeAreaView } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import firebase from '@react-native-firebase/app';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import CreateFieldScreen from './src/screens/CreateFieldScreen';
import FieldListScreen from './src/screens/FieldListScreen';
import FieldDetailScreen from './src/screens/FieldDetailScreen';
import EditFieldScreen from './src/screens/EditFieldScreen';
import CreateRecordScreen from './src/screens/CreateRecordScreen';
import RecordsListScreen from './src/screens/RecordsListScreen';
import RecordDetailScreen from './src/screens/RecordDetailScreen';
import EditRecordScreen from './src/screens/EditRecordScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import * as NotificationService from './src/services/notificationService';

const Stack = createStackNavigator();

// SplashScreen 유지
SplashScreen.preventAutoHideAsync();

// 한글 폰트를 포함한 커스텀 설정
const customConfig = {
  ...config,
  tokens: {
    ...config.tokens,
    fonts: {
      ...config.tokens.fonts,
      body: 'NotoSansKR_400Regular',
      heading: 'NotoSansKR_700Bold',
    },
  },
  components: {
    ...config.components,
    Text: {
      ...config.components?.Text,
      defaultProps: {
        ...config.components?.Text?.defaultProps,
        fontFamily: 'NotoSansKR_400Regular',
      },
    },
    Heading: {
      ...config.components?.Heading,
      defaultProps: {
        ...config.components?.Heading?.defaultProps,
        fontFamily: 'NotoSansKR_700Bold',
      },
    },
    Button: {
      ...config.components?.Button,
      defaultProps: {
        ...config.components?.Button?.defaultProps,
      },
    },
    ButtonText: {
      ...config.components?.ButtonText,
      defaultProps: {
        ...config.components?.ButtonText?.defaultProps,
        fontFamily: 'NotoSansKR_500Medium',
      },
    },
  },
};

// 로딩 컴포넌트
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
    <ActivityIndicator size="large" color="#6366F1" />
  </View>
);

// 네비게이션 컴포넌트 (인증 상태에 따라 화면 결정)
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? "Home" : "Login"}
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          // 인증된 사용자용 화면들
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="CreateField" component={CreateFieldScreen} />
            <Stack.Screen name="FieldList" component={FieldListScreen} />
            <Stack.Screen name="FieldDetail" component={FieldDetailScreen} />
            <Stack.Screen name="EditField" component={EditFieldScreen} />
            <Stack.Screen name="CreateRecord" component={CreateRecordScreen} />
            <Stack.Screen name="RecordsList" component={RecordsListScreen} />
            <Stack.Screen name="RecordDetail" component={RecordDetailScreen} />
            <Stack.Screen name="EditRecord" component={EditRecordScreen} />
          </>
        ) : (
          // 인증되지 않은 사용자용 화면들
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    NotoSansKR_400Regular,
    NotoSansKR_500Medium,
    NotoSansKR_700Bold,
  });

  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    const hideSplashScreen = async () => {
      if (fontsLoaded || fontError) {
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          console.error('스플래시 스크린 숨기기 실패:', error);
        }
      }
    };

    hideSplashScreen();
  }, [fontsLoaded, fontError]);

  // 푸시 알림 리스너 설정
  useEffect(() => {
    // Firebase 앱이 초기화되었는지 확인
    const initializeFirebase = async () => {
      try {
        // Firebase 앱이 이미 초기화되었는지 확인
        /* //개발 시 firebase 초기화 오류로 인해 주석처리
        if (!firebase.apps.length) {
          // Firebase가 초기화되지 않았으면 google-services.json에서 자동으로 초기화
          await firebase.initializeApp();
          console.log('✅ Firebase 초기화 완료');
        } else { */
          console.log('✅ Firebase 이미 초기화됨');
        /* } */
      } catch (error) {
        console.error('❌ Firebase 초기화 실패:', error);
        // Firebase 초기화 실패 시에도 앱은 계속 실행
      }
    };

    //개발 시 firebase 초기화 오류로 인해 주석처리
    //initializeFirebase();

    // 알림이 수신되었을 때 호출
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 알림 수신:', notification);
    });

    // 사용자가 알림을 탭했을 때 호출
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 알림 탭:', response);
      const data = response.notification.request.content.data;
      
      // 알림 데이터에 따라 화면 이동 등 처리
      if (data.recordId) {
        console.log('일정 ID:', data.recordId, '타입:', data.type);
        // TODO: 해당 일정 상세 화면으로 이동
      }
    });

    // FCM 메시지 리스너 설정 (Firebase 초기화 후)
    let unsubscribeFCM: (() => void) | null = null;
    
    setTimeout(() => {
      try {
        if (firebase.apps.length > 0) {
          unsubscribeFCM = NotificationService.setupFCMListeners(
            (message) => {
              console.log('📨 FCM 메시지 수신:', message);
            },
            async (token) => {
              console.log('🔄 FCM 토큰 갱신:', token);
              // TODO: 서버에 새 토큰 업데이트
            }
          );
        }
      } catch (error) {
        console.error('❌ FCM 리스너 설정 실패:', error);
      }
    }, 1000);

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      if (unsubscribeFCM) {
        unsubscribeFCM();
      }
    };
  }, []);

  // 디버그 정보 표시 컴포넌트 제거
  // const DebugOverlay = () => (...);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>폰트 로딩 중...</Text>
      </View>
    );
  }

  return (
    <GluestackUIProvider config={customConfig}>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="dark" backgroundColor="transparent" />
        {/* 디버그 오버레이 제거 */}
      </AuthProvider>
    </GluestackUIProvider>
  );
}
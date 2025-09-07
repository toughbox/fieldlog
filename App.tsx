import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { 
  NotoSansKR_400Regular, 
  NotoSansKR_500Medium, 
  NotoSansKR_700Bold 
} from '@expo-google-fonts/noto-sans-kr';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import CreateFieldScreen from './src/screens/CreateFieldScreen';
import FieldListScreen from './src/screens/FieldListScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';

const Stack = createStackNavigator();

// SplashScreen 유지
SplashScreen.preventAutoHideAsync();

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
          </>
        ) : (
          // 인증되지 않은 사용자용 화면들
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    NotoSansKR_400Regular,
    NotoSansKR_500Medium,
    NotoSansKR_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  // Noto Sans KR 폰트를 기본으로 사용하는 테마
  const theme = {
    ...DefaultTheme,
    fonts: {
      ...DefaultTheme.fonts,
      regular: {
        fontFamily: 'NotoSansKR_400Regular',
        fontWeight: 'normal' as const,
      },
      medium: {
        fontFamily: 'NotoSansKR_500Medium',
        fontWeight: 'normal' as const,
      },
      light: {
        fontFamily: 'NotoSansKR_400Regular',
        fontWeight: 'normal' as const,
      },
      thin: {
        fontFamily: 'NotoSansKR_400Regular',
        fontWeight: 'normal' as const,
      },
      // 추가 폰트 설정
      labelLarge: {
        fontFamily: 'NotoSansKR_500Medium',
        fontWeight: 'normal' as const,
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: 0.1,
      },
      bodyLarge: {
        fontFamily: 'NotoSansKR_400Regular',
        fontWeight: 'normal' as const,
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: 0.15,
      },
      bodyMedium: {
        fontFamily: 'NotoSansKR_400Regular',
        fontWeight: 'normal' as const,
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: 0.25,
      },
    },
  };

  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </PaperProvider>
  );
}
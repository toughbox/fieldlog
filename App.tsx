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
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import SignUpScreen from './src/screens/SignUpScreen';

const Stack = createStackNavigator();

// SplashScreen 유지
SplashScreen.preventAutoHideAsync();

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
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </PaperProvider>
  );
}

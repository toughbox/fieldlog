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
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import CreateFieldScreen from './src/screens/CreateFieldScreen';
import FieldListScreen from './src/screens/FieldListScreen';
import FieldDetailScreen from './src/screens/FieldDetailScreen';
import EditFieldScreen from './src/screens/EditFieldScreen';
import CreateRecordScreen from './src/screens/CreateRecordScreen';
import RecordsListScreen from './src/screens/RecordsListScreen';
import RecordDetailScreen from './src/screens/RecordDetailScreen';
import EditRecordScreen from './src/screens/EditRecordScreen';
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

  return (
    <GluestackUIProvider config={customConfig}>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="dark" backgroundColor="transparent" />
      </AuthProvider>
    </GluestackUIProvider>
  );
}
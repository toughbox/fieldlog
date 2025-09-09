import React, { useState } from 'react';
import { Alert, ScrollView, StatusBar } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  InputField,
  Card,
  Heading,
  SafeAreaView,
  ButtonText,
  ButtonIcon,
  Center,
  Spinner
} from '@gluestack-ui/themed';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { currentApi, LoginRequest } from '../services/api';
import { validateEmail } from '../utils/validation';
import { useAuth } from '../context/AuthContext';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleLogin = async () => {
    // 기본 유효성 검사
    if (!email.trim() || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('알림', '올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🔄 로그인 API 호출 시작...');
      
      const loginData: LoginRequest = {
        email: email.trim().toLowerCase(),
        password: password,
      };

      const response = await currentApi.login(loginData);
      
      if (response.success && response.data) {
        console.log('✅ 로그인 API 성공:', response.data.user);
        
        // 인증 컨텍스트를 통해 로그인 처리 (토큰 저장 포함)
        await login(
          response.data.access_token,
          response.data.refresh_token,
          response.data.user
        );
        
        console.log('✅ 인증 처리 완료 - 자동으로 홈 화면으로 이동됩니다');
      } else {
        console.error('❌ 로그인 실패:', response.error);
        Alert.alert(
          '로그인 실패', 
          response.error || '로그인 중 오류가 발생했습니다.'
        );
      }
    } catch (error) {
      console.error('❌ 로그인 예외 오류:', error);
      Alert.alert(
        '오류 발생',
        '네트워크 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  return (
    <SafeAreaView flex={1} bg="$coolGray50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={false} />
      <ScrollView flex={1} contentContainerStyle={{ paddingTop: 20 }}>
        {/* 로고 및 타이틀 */}
        <Box alignItems="center" mt="$20" mb="$10">
          <Text fontSize="$3xl">🏗️</Text>
          <Heading size="xl">현장기록</Heading>
        </Box>

        {/* 로그인 폼 */}
        <Card bg="white" p="$6" mx="$4" borderRadius="$xl" shadowOpacity={0.1} shadowRadius={8} mb="$6">
          <VStack space="md">
            <VStack space="xs">
              <Text size="sm" color="$gray600">이메일</Text>
              <Input variant="outline" size="lg">
                <InputField
                  placeholder="이메일을 입력하세요"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </Input>
            </VStack>

            <VStack space="xs">
              <Text size="sm" color="$gray600">비밀번호</Text>
              <Input variant="outline" size="lg">
                <InputField
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </Input>
            </VStack>

            <Button
              action="primary"
              size="lg"
              onPress={handleLogin}
              isDisabled={isLoading}
              mt="$4"
            >
              {isLoading ? (
                <HStack alignItems="center" space="sm">
                  <Spinner color="white" size="small" />
                  <ButtonText>로그인 중...</ButtonText>
                </HStack>
              ) : (
                <>
                  <ButtonIcon as={LogIn} />
                  <ButtonText>로그인</ButtonText>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onPress={handleSignUp}
            >
              <ButtonText>회원가입</ButtonText>
            </Button>
          </VStack>
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
};

export default LoginScreen;

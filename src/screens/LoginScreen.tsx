import React, { useState } from 'react';
import { Alert, ScrollView, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  InputField,
  InputSlot,
  InputIcon,
  Heading,
  SafeAreaView,
  ButtonText,
  ButtonIcon,
  Spinner,
  Pressable
} from '@gluestack-ui/themed';
import { LogIn, Mail, Lock, Eye, EyeOff, Building2 } from 'lucide-react-native';
import { currentApi, LoginRequest } from '../services/api';
import { validateEmail } from '../utils/validation';
import { useAuth } from '../context/AuthContext';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
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
    <SafeAreaView flex={1} bg="$white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView 
        flex={1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          flex={1} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* 상단 헤더 영역 */}
          <Box 
            bg="$blue600" 
            pt="$16" 
            pb="$12" 
            px="$6"
            borderBottomLeftRadius="$3xl"
            borderBottomRightRadius="$3xl"
          >
            <VStack space="md" alignItems="center">
              {/* 로고 아이콘 */}
              <Box 
                bg="$white" 
                p="$4" 
                borderRadius="$2xl"
              >
                <Building2 size={48} color="#2563eb" strokeWidth={2.5} />
              </Box>
              
              {/* 타이틀 */}
              <VStack space="xs" alignItems="center">
                <Heading size="2xl" color="$white" fontWeight="$bold">
                  현장기록
                </Heading>
                <Text size="md" color="$blue100" fontWeight="$medium">
                  자유롭게 작성하는 현장 기록 관리 시스템
                </Text>
              </VStack>
            </VStack>
          </Box>

          {/* 로그인 폼 영역 */}
          <Box flex={1} px="$6" pt="$8">
            <VStack space="xl">
              {/* 환영 메시지 */}
              {/* <VStack space="xs">
                <Heading size="xl" color="$gray900">
                  환영합니다!
                </Heading>
                <Text size="md" color="$gray600">
                  계정에 로그인하여 시작하세요
                </Text>
              </VStack> */}

              {/* 이메일 입력 */}
              <VStack space="sm">
                <Text size="sm" color="$gray700" fontWeight="$medium">
                  이메일
                </Text>
                <Input 
                  variant="outline" 
                  size="xl"
                  borderColor={emailFocused ? '$blue600' : '$gray300'}
                  borderWidth={emailFocused ? 2 : 1}
                  bg="$gray50"
                >
                  <InputSlot pl="$4">
                    <InputIcon as={Mail} color={emailFocused ? "$blue600" : "$gray500"} />
                  </InputSlot>
                  <InputField
                    placeholder="your@email.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    fontSize="$md"
                    pl="$2"
                  />
                </Input>
              </VStack>

              {/* 비밀번호 입력 */}
              <VStack space="sm">
                <HStack justifyContent="space-between" alignItems="center">
                  <Text size="sm" color="$gray700" fontWeight="$medium">
                    비밀번호
                  </Text>
                  <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
                    <Text size="sm" color="$blue600" fontWeight="$medium">
                      비밀번호 찾기
                    </Text>
                  </Pressable>
                </HStack>
                <Input 
                  variant="outline" 
                  size="xl"
                  borderColor={passwordFocused ? '$blue600' : '$gray300'}
                  borderWidth={passwordFocused ? 2 : 1}
                  bg="$gray50"
                >
                  <InputSlot pl="$4">
                    <InputIcon as={Lock} color={passwordFocused ? "$blue600" : "$gray500"} />
                  </InputSlot>
                  <InputField
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    fontSize="$md"
                    pl="$2"
                  />
                  <InputSlot pr="$4" onPress={() => setShowPassword(!showPassword)}>
                    <InputIcon 
                      as={showPassword ? Eye : EyeOff} 
                      color="$gray500"
                    />
                  </InputSlot>
                </Input>
              </VStack>

              {/* 로그인 버튼 */}
              <Button
                size="xl"
                bg="$blue600"
                borderRadius="$xl"
                onPress={handleLogin}
                isDisabled={isLoading}
                mt="$2"
              >
                {isLoading ? (
                  <HStack alignItems="center" space="sm">
                    <Spinner color="$white" size="small" />
                    <ButtonText fontSize="$md" fontWeight="$semibold">
                      로그인 중...
                    </ButtonText>
                  </HStack>
                ) : (
                  <HStack alignItems="center" space="sm">
                    <ButtonIcon as={LogIn} size="xl" />
                    <ButtonText fontSize="$md" fontWeight="$semibold">
                      로그인
                    </ButtonText>
                  </HStack>
                )}
              </Button>

              {/* 구분선 */}
              <HStack alignItems="center" space="md" my="$2">
                <Box flex={1} h={1} bg="$gray300" />
                <Text size="sm" color="$gray500">또는</Text>
                <Box flex={1} h={1} bg="$gray300" />
              </HStack>

              {/* 회원가입 버튼 */}
              <Button
                size="xl"
                variant="outline"
                borderRadius="$xl"
                borderColor="$blue600"
                borderWidth={2}
                onPress={handleSignUp}
                bg="$white"
              >
                <ButtonText 
                  fontSize="$md" 
                  fontWeight="$semibold"
                  color="$blue600"
                >
                  회원가입
                </ButtonText>
              </Button>

              {/* 하단 여백 */}
              <Box h="$8" />
            </VStack>
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

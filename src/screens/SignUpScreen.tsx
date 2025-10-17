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
import { UserPlus, Mail, Lock, User, ArrowLeft, Eye, EyeOff, Building2, Phone } from 'lucide-react-native';
import { currentApi, SignUpRequest } from '../services/api';
import { validateSignUpForm, SignUpFormData } from '../utils/validation';

interface SignUpScreenProps {
  navigation: any;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState<SignUpFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const updateFormData = (field: keyof SignUpFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSignUp = async () => {
    console.log('🚀 회원가입 버튼 클릭됨');
    
    const validation = validateSignUpForm(formData);
    console.log('✅ 유효성 검사 결과:', validation);
    
    if (!validation.isValid) {
      Alert.alert('입력 오류', validation.message || '입력 정보를 확인해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔄 회원가입 API 호출 시작...');
      
      const signUpRequest: SignUpRequest = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        company: formData.company || undefined,
        phone: formData.phone || undefined
      };

      console.log('📤 요청 데이터:', { ...signUpRequest, password: '***' });

      const response = await currentApi.signUp(signUpRequest);
      
      console.log('📥 API 응답:', response);
      
      if (response.success) {
        Alert.alert(
          '회원가입 완료', 
          '회원가입이 성공적으로 완료되었습니다. 로그인해주세요.',
          [{ text: '확인', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('회원가입 실패', response.error || response.message || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 회원가입 오류:', error);
      Alert.alert(
        '오류 발생',
        '네트워크 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView flex={1} bg="$white">
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
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
            pt="$12" 
            pb="$10" 
            px="$6"
            borderBottomLeftRadius="$3xl"
            borderBottomRightRadius="$3xl"
          >
            {/* 뒤로가기 버튼 */}
            <Pressable
              onPress={() => navigation.goBack()}
              position="absolute"
              top="$12"
              left="$4"
              p="$2"
            >
              <ArrowLeft size={24} color="#ffffff" />
            </Pressable>

            <VStack space="md" alignItems="center" mt="$6">
              {/* 로고 아이콘 */}
              <Box 
                bg="$white" 
                p="$4" 
                borderRadius="$2xl"
              >
                <UserPlus size={40} color="#2563eb" strokeWidth={2.5} />
              </Box>
              
              {/* 타이틀 */}
              <VStack space="xs" alignItems="center">
                <Heading size="2xl" color="$white" fontWeight="$bold">
                  회원가입
                </Heading>
                <Text size="sm" color="$blue100" fontWeight="$medium">
                  현장기록에 오신 것을 환영합니다
                </Text>
              </VStack>
            </VStack>
          </Box>

          {/* 회원가입 폼 영역 */}
          <Box px="$6" pt="$6" pb="$8">
            <VStack space="lg">
              {/* 이름 입력 */}
              <VStack space="sm">
                <Text size="sm" color="$gray700" fontWeight="$medium">
                  이름 <Text color="$red600">*</Text>
                </Text>
                <Input 
                  variant="outline" 
                  size="xl"
                  borderColor={focusedField === 'name' ? '$blue600' : '$gray300'}
                  borderWidth={focusedField === 'name' ? 2 : 1}
                  bg="$gray50"
                >
                  <InputSlot pl="$4">
                    <InputIcon as={User} color={focusedField === 'name' ? "$blue600" : "$gray500"} />
                  </InputSlot>
                  <InputField
                    placeholder="홍길동"
                    value={formData.name}
                    onChangeText={(value) => updateFormData('name', value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    fontSize="$md"
                    pl="$2"
                  />
                </Input>
              </VStack>

              {/* 이메일 입력 */}
              <VStack space="sm">
                <Text size="sm" color="$gray700" fontWeight="$medium">
                  이메일 <Text color="$red600">*</Text>
                </Text>
                <Input 
                  variant="outline" 
                  size="xl"
                  borderColor={focusedField === 'email' ? '$blue600' : '$gray300'}
                  borderWidth={focusedField === 'email' ? 2 : 1}
                  bg="$gray50"
                >
                  <InputSlot pl="$4">
                    <InputIcon as={Mail} color={focusedField === 'email' ? "$blue600" : "$gray500"} />
                  </InputSlot>
                  <InputField
                    placeholder="your@email.com"
                    value={formData.email}
                    onChangeText={(value) => updateFormData('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    fontSize="$md"
                    pl="$2"
                  />
                </Input>
              </VStack>

              {/* 비밀번호 입력 */}
              <VStack space="sm">
                <Text size="sm" color="$gray700" fontWeight="$medium">
                  비밀번호 <Text color="$red600">*</Text>
                </Text>
                <Input 
                  variant="outline" 
                  size="xl"
                  borderColor={focusedField === 'password' ? '$blue600' : '$gray300'}
                  borderWidth={focusedField === 'password' ? 2 : 1}
                  bg="$gray50"
                >
                  <InputSlot pl="$4">
                    <InputIcon as={Lock} color={focusedField === 'password' ? "$blue600" : "$gray500"} />
                  </InputSlot>
                  <InputField
                    placeholder="8자 이상 입력"
                    value={formData.password}
                    onChangeText={(value) => updateFormData('password', value)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
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

              {/* 비밀번호 확인 */}
              <VStack space="sm">
                <Text size="sm" color="$gray700" fontWeight="$medium">
                  비밀번호 확인 <Text color="$red600">*</Text>
                </Text>
                <Input 
                  variant="outline" 
                  size="xl"
                  borderColor={focusedField === 'confirmPassword' ? '$blue600' : '$gray300'}
                  borderWidth={focusedField === 'confirmPassword' ? 2 : 1}
                  bg="$gray50"
                >
                  <InputSlot pl="$4">
                    <InputIcon as={Lock} color={focusedField === 'confirmPassword' ? "$blue600" : "$gray500"} />
                  </InputSlot>
                  <InputField
                    placeholder="비밀번호 재입력"
                    value={formData.confirmPassword}
                    onChangeText={(value) => updateFormData('confirmPassword', value)}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    fontSize="$md"
                    pl="$2"
                  />
                  <InputSlot pr="$4" onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <InputIcon 
                      as={showConfirmPassword ? Eye : EyeOff} 
                      color="$gray500"
                    />
                  </InputSlot>
                </Input>
              </VStack>

              {/* 회사명 입력 (선택) */}
              <VStack space="sm">
                <Text size="sm" color="$gray700" fontWeight="$medium">
                  회사명 <Text size="xs" color="$gray500">(선택)</Text>
                </Text>
                <Input 
                  variant="outline" 
                  size="xl"
                  borderColor={focusedField === 'company' ? '$blue600' : '$gray300'}
                  borderWidth={focusedField === 'company' ? 2 : 1}
                  bg="$gray50"
                >
                  <InputSlot pl="$4">
                    <InputIcon as={Building2} color={focusedField === 'company' ? "$blue600" : "$gray500"} />
                  </InputSlot>
                  <InputField
                    placeholder="소속 회사명"
                    value={formData.company}
                    onChangeText={(value) => updateFormData('company', value)}
                    onFocus={() => setFocusedField('company')}
                    onBlur={() => setFocusedField(null)}
                    fontSize="$md"
                    pl="$2"
                  />
                </Input>
              </VStack>

              {/* 전화번호 입력 (선택) */}
              <VStack space="sm">
                <Text size="sm" color="$gray700" fontWeight="$medium">
                  전화번호 <Text size="xs" color="$gray500">(선택)</Text>
                </Text>
                <Input 
                  variant="outline" 
                  size="xl"
                  borderColor={focusedField === 'phone' ? '$blue600' : '$gray300'}
                  borderWidth={focusedField === 'phone' ? 2 : 1}
                  bg="$gray50"
                >
                  <InputSlot pl="$4">
                    <InputIcon as={Phone} color={focusedField === 'phone' ? "$blue600" : "$gray500"} />
                  </InputSlot>
                  <InputField
                    placeholder="010-0000-0000"
                    value={formData.phone}
                    onChangeText={(value) => updateFormData('phone', value)}
                    keyboardType="phone-pad"
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    fontSize="$md"
                    pl="$2"
                  />
                </Input>
              </VStack>

              {/* 회원가입 버튼 */}
              <Button
                size="xl"
                bg="$blue600"
                borderRadius="$xl"
                onPress={handleSignUp}
                isDisabled={isLoading}
                mt="$4"
              >
                {isLoading ? (
                  <HStack alignItems="center" space="sm">
                    <Spinner color="$white" size="small" />
                    <ButtonText fontSize="$md" fontWeight="$semibold">
                      가입 중...
                    </ButtonText>
                  </HStack>
                ) : (
                  <HStack alignItems="center" space="sm">
                    <ButtonIcon as={UserPlus} size="xl" />
                    <ButtonText fontSize="$md" fontWeight="$semibold">
                      회원가입 완료
                    </ButtonText>
                  </HStack>
                )}
              </Button>

              {/* 구분선 */}
              <HStack alignItems="center" space="md" mt="$6">
                <Box flex={1} h={1} bg="$gray300" />
                <Text size="sm" color="$gray500">이미 계정이 있으신가요?</Text>
                <Box flex={1} h={1} bg="$gray300" />
              </HStack>

              {/* 로그인 링크 */}
              <Button
                size="lg"
                variant="link"
                onPress={() => navigation.goBack()}
              >
                <ButtonText 
                  fontSize="$md" 
                  fontWeight="$semibold"
                  color="$blue600"
                >
                  로그인하기
                </ButtonText>
              </Button>

              {/* 하단 여백 */}
              <Box h="$4" />
            </VStack>
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUpScreen;
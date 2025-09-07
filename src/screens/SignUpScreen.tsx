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
import { UserPlus, Mail, Lock, User, ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
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

  const updateFormData = (field: keyof SignUpFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSignUp = async () => {
    const validation = validateSignUpForm(formData);
    if (!validation.isValid) {
      Alert.alert('입력 오류', validation.errors.join('\n'));
      return;
    }

    try {
      setIsLoading(true);
      
      const signUpRequest: SignUpRequest = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        company: formData.company || undefined,
        phone: formData.phone || undefined
      };

      const response = await currentApi.signUp(signUpRequest);
      
      if (response.success) {
        Alert.alert(
          '회원가입 완료', 
          '회원가입이 성공적으로 완료되었습니다. 로그인해주세요.',
          [{ text: '확인', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('회원가입 실패', response.message || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      Alert.alert('오류', '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView flex={1} bg="$coolGray50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={false} />
      <ScrollView flex={1} p="$6" contentContainerStyle={{ paddingTop: 10 }}>
        {/* 헤더 */}
        <Box mb="$8">
          <HStack alignItems="center" space="sm" mb="$6">
            <Button variant="ghost" size="sm" onPress={() => navigation.goBack()}>
              <ButtonIcon as={ArrowLeft} />
            </Button>
          </HStack>
          
          <VStack alignItems="center" space="sm">
            <Center w="$20" h="$20" bg="$primary100" borderRadius="$full">
              <Text fontSize="$3xl">📝</Text>
            </Center>
            <Heading size="2xl" color="$primary600">회원가입</Heading>
            <Text color="$gray600" textAlign="center">현장기록에 오신 것을 환영합니다</Text>
          </VStack>
        </Box>

        {/* 회원가입 폼 */}
        <Card bg="white" p="$6" borderRadius="$xl" shadowOpacity={0.1} shadowRadius={8}>
          <VStack space="md">
            <VStack space="xs">
              <Text size="sm" color="$gray600">이름 *</Text>
              <Input>
                <InputField
                  placeholder="이름을 입력하세요"
                  value={formData.name}
                  onChangeText={(value) => updateFormData('name', value)}
                />
              </Input>
            </VStack>

            <VStack space="xs">
              <Text size="sm" color="$gray600">이메일 *</Text>
              <Input>
                <InputField
                  placeholder="이메일을 입력하세요"
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </Input>
            </VStack>

            <VStack space="xs">
              <Text size="sm" color="$gray600">비밀번호 *</Text>
              <Input>
                <InputField
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setShowPassword(!showPassword)}
                  mr="$2"
                >
                  <ButtonIcon as={showPassword ? EyeOff : Eye} />
                </Button>
              </Input>
            </VStack>

            <VStack space="xs">
              <Text size="sm" color="$gray600">비밀번호 확인 *</Text>
              <Input>
                <InputField
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  mr="$2"
                >
                  <ButtonIcon as={showConfirmPassword ? EyeOff : Eye} />
                </Button>
              </Input>
            </VStack>

            <VStack space="xs">
              <Text size="sm" color="$gray600">회사명</Text>
              <Input>
                <InputField
                  placeholder="회사명을 입력하세요 (선택사항)"
                  value={formData.company}
                  onChangeText={(value) => updateFormData('company', value)}
                />
              </Input>
            </VStack>

            <VStack space="xs">
              <Text size="sm" color="$gray600">전화번호</Text>
              <Input>
                <InputField
                  placeholder="전화번호를 입력하세요 (선택사항)"
                  value={formData.phone}
                  onChangeText={(value) => updateFormData('phone', value)}
                  keyboardType="phone-pad"
                />
              </Input>
            </VStack>

            <Button
              action="primary"
              size="lg"
              onPress={handleSignUp}
              isDisabled={isLoading}
              mt="$4"
            >
              {isLoading ? (
                <HStack alignItems="center" space="sm">
                  <Spinner color="white" size="small" />
                  <ButtonText>가입 중...</ButtonText>
                </HStack>
              ) : (
                <>
                  <ButtonIcon as={UserPlus} />
                  <ButtonText>회원가입</ButtonText>
                </>
              )}
            </Button>
          </VStack>
        </Card>

        {/* 로그인 링크 */}
        <VStack alignItems="center" space="sm" mt="$6" mb="$10">
          <Text color="$gray600">이미 계정이 있으신가요?</Text>
          <Button
            variant="ghost"
            onPress={() => navigation.goBack()}
          >
            <ButtonText color="$primary600">로그인하기</ButtonText>
          </Button>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignUpScreen;
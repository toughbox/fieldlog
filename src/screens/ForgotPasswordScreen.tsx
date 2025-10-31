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
  Spinner,
  Pressable
} from '@gluestack-ui/themed';
import { ArrowLeft, Mail, Send } from 'lucide-react-native';
import { currentApi } from '../services/api';
import { validateEmail } from '../utils/validation';

interface ForgotPasswordScreenProps {
  navigation: any;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const handleRequestReset = async () => {
    // 유효성 검사
    if (!email.trim()) {
      Alert.alert('알림', '이메일을 입력해주세요.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('알림', '올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await currentApi.requestPasswordReset(email.trim().toLowerCase());
      
      if (response.success) {
        // 이메일 발송 성공 - 재설정 화면으로 이동
        Alert.alert(
          '✅ 이메일 발송 완료',
          '비밀번호 재설정 안내가 이메일로 발송되었습니다.\n\n이메일에서 6자리 재설정 토큰을 확인하세요.',
          [
            { 
              text: '확인', 
              onPress: () => {
                // 개발 모드에서 토큰이 반환되면 자동으로 다음 화면으로 이동
                if (response.data?.dev_token) {
                  console.log('🔑 개발 토큰:', response.data.dev_token);
                }
                navigation.navigate('ResetPassword', { email: email.trim().toLowerCase() });
              }
            }
          ]
        );
      } else {
        // 이메일이 존재하지 않거나 다른 오류
        Alert.alert(
          '❌ 오류', 
          response.error || '비밀번호 재설정 요청 중 오류가 발생했습니다.'
        );
      }
    } catch (error) {
      console.error('비밀번호 재설정 요청 오류:', error);
      Alert.alert(
        '❌ 네트워크 오류',
        '서버와 통신할 수 없습니다.\n인터넷 연결을 확인하고 다시 시도해주세요.'
      );
    } finally {
      setIsLoading(false);
    }
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
          {/* 헤더 */}
          <Box px="$6" pt="$4" pb="$2">
            <Pressable
              onPress={() => navigation.goBack()}
              flexDirection="row"
              alignItems="center"
              space="sm"
            >
              <ArrowLeft size={24} color="#2563eb" strokeWidth={2.5} />
              <Text size="md" color="$blue600" fontWeight="$semibold">
                로그인으로 돌아가기
              </Text>
            </Pressable>
          </Box>

          {/* 메인 콘텐츠 */}
          <Box flex={1} px="$6" pt="$8">
            <VStack space="xl">
              {/* 아이콘 및 제목 */}
              <VStack space="md" alignItems="center">
                <Box 
                  bg="$blue50" 
                  p="$5" 
                  borderRadius="$full"
                >
                  <Mail size={48} color="#2563eb" strokeWidth={2} />
                </Box>
                
                <VStack space="xs" alignItems="center">
                  <Heading size="2xl" color="$gray900" textAlign="center">
                    비밀번호 찾기
                  </Heading>
                  <Text size="md" color="$gray600" textAlign="center" px="$4">
                    가입하신 이메일 주소를 입력하세요.{'\n'}
                    비밀번호 재설정 안내를 보내드립니다.
                  </Text>
                </VStack>
              </VStack>

              {/* 이메일 입력 */}
              <VStack space="sm" mt="$4">
                <Text size="sm" color="$gray700" fontWeight="$medium">
                  이메일 주소
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

              {/* 재설정 요청 버튼 */}
              <Button
                size="xl"
                bg="$blue600"
                borderRadius="$xl"
                onPress={handleRequestReset}
                isDisabled={isLoading}
                mt="$4"
              >
                {isLoading ? (
                  <HStack alignItems="center" space="sm">
                    <Spinner color="$white" size="small" />
                    <ButtonText fontSize="$md" fontWeight="$semibold">
                      처리 중...
                    </ButtonText>
                  </HStack>
                ) : (
                  <HStack alignItems="center" space="sm">
                    <Send size={20} color="white" />
                    <ButtonText fontSize="$md" fontWeight="$semibold">
                      재설정 안내 받기
                    </ButtonText>
                  </HStack>
                )}
              </Button>

              {/* 안내 메시지 */}
              <Box 
                bg="$blue50" 
                p="$4" 
                borderRadius="$lg"
                borderWidth={1}
                borderColor="$blue200"
              >
                <VStack space="sm">
                  <Text size="sm" color="$blue800" fontWeight="$bold">
                    💡 안내사항
                  </Text>
                  <Text size="sm" color="$blue700" lineHeight="$lg">
                    • 이메일로 6자리 재설정 토큰이 발송됩니다{'\n'}
                    • 토큰은 10분간 유효합니다{'\n'}
                    • 이메일이 오지 않으면 스팸함을 확인해주세요
                  </Text>
                </VStack>
              </Box>
            </VStack>
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;


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
import { ArrowLeft, Lock, Eye, EyeOff, Key, Check } from 'lucide-react-native';
import { currentApi } from '../services/api';

interface ResetPasswordScreenProps {
  navigation: any;
  route: any;
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation, route }) => {
  const { email } = route.params;
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenFocused, setTokenFocused] = useState(false);
  const [newPasswordFocused, setNewPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const handleResetPassword = async () => {
    // 유효성 검사
    if (!token.trim()) {
      Alert.alert('알림', '재설정 토큰을 입력해주세요.');
      return;
    }

    if (!newPassword) {
      Alert.alert('알림', '새 비밀번호를 입력해주세요.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('알림', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('알림', '비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await currentApi.resetPassword(email, token.trim(), newPassword);
      
      if (response.success) {
        Alert.alert(
          '비밀번호 변경 완료',
          '비밀번호가 성공적으로 변경되었습니다.\n새 비밀번호로 로그인해주세요.',
          [
            { 
              text: '확인', 
              onPress: () => {
                // 로그인 화면으로 이동
                navigation.navigate('Login');
              }
            }
          ]
        );
      } else {
        Alert.alert('오류', response.error || '비밀번호 재설정 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error);
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
                뒤로가기
              </Text>
            </Pressable>
          </Box>

          {/* 메인 콘텐츠 */}
          <Box flex={1} px="$6" pt="$8">
            <VStack space="xl">
              {/* 아이콘 및 제목 */}
              <VStack space="md" alignItems="center">
                <Box 
                  bg="$green50" 
                  p="$5" 
                  borderRadius="$full"
                >
                  <Key size={48} color="#10b981" strokeWidth={2} />
                </Box>
                
                <VStack space="xs" alignItems="center">
                  <Heading size="2xl" color="$gray900" textAlign="center">
                    비밀번호 재설정
                  </Heading>
                  <Text size="md" color="$gray600" textAlign="center" px="$4">
                    이메일로 받은 재설정 토큰을 입력하고{'\n'}
                    새 비밀번호를 설정하세요.
                  </Text>
                </VStack>
              </VStack>

              {/* 이메일 표시 */}
              <Box 
                bg="$gray100" 
                p="$3" 
                borderRadius="$lg"
                borderWidth={1}
                borderColor="$gray300"
              >
                <Text size="sm" color="$gray600" textAlign="center">
                  {email}
                </Text>
              </Box>

              {/* 토큰 입력 */}
              <VStack space="sm">
                <Text size="sm" color="$gray700" fontWeight="$medium">
                  재설정 토큰 (6자리)
                </Text>
                <Input 
                  variant="outline" 
                  size="xl"
                  borderColor={tokenFocused ? '$green600' : '$gray300'}
                  borderWidth={tokenFocused ? 2 : 1}
                  bg="$gray50"
                >
                  <InputSlot pl="$4">
                    <InputIcon as={Key} color={tokenFocused ? "$green600" : "$gray500"} />
                  </InputSlot>
                  <InputField
                    placeholder="123456"
                    value={token}
                    onChangeText={setToken}
                    keyboardType="number-pad"
                    maxLength={6}
                    onFocus={() => setTokenFocused(true)}
                    onBlur={() => setTokenFocused(false)}
                    fontSize="$lg"
                    pl="$2"
                    letterSpacing={4}
                  />
                </Input>
              </VStack>

              {/* 새 비밀번호 입력 */}
              <VStack space="sm">
                <Text size="sm" color="$gray700" fontWeight="$medium">
                  새 비밀번호
                </Text>
                <Input 
                  variant="outline" 
                  size="xl"
                  borderColor={newPasswordFocused ? '$blue600' : '$gray300'}
                  borderWidth={newPasswordFocused ? 2 : 1}
                  bg="$gray50"
                >
                  <InputSlot pl="$4">
                    <InputIcon as={Lock} color={newPasswordFocused ? "$blue600" : "$gray500"} />
                  </InputSlot>
                  <InputField
                    placeholder="새 비밀번호 (6자 이상)"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    onFocus={() => setNewPasswordFocused(true)}
                    onBlur={() => setNewPasswordFocused(false)}
                    fontSize="$md"
                    pl="$2"
                  />
                  <InputSlot pr="$4" onPress={() => setShowNewPassword(!showNewPassword)}>
                    <InputIcon 
                      as={showNewPassword ? Eye : EyeOff} 
                      color="$gray500"
                    />
                  </InputSlot>
                </Input>
              </VStack>

              {/* 비밀번호 확인 입력 */}
              <VStack space="sm">
                <Text size="sm" color="$gray700" fontWeight="$medium">
                  비밀번호 확인
                </Text>
                <Input 
                  variant="outline" 
                  size="xl"
                  borderColor={confirmPasswordFocused ? '$blue600' : '$gray300'}
                  borderWidth={confirmPasswordFocused ? 2 : 1}
                  bg="$gray50"
                >
                  <InputSlot pl="$4">
                    <InputIcon as={Check} color={confirmPasswordFocused ? "$blue600" : "$gray500"} />
                  </InputSlot>
                  <InputField
                    placeholder="비밀번호 확인"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => setConfirmPasswordFocused(false)}
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
                {confirmPassword && newPassword !== confirmPassword && (
                  <Text size="sm" color="$red500">
                    비밀번호가 일치하지 않습니다
                  </Text>
                )}
              </VStack>

              {/* 비밀번호 재설정 버튼 */}
              <Button
                size="xl"
                bg="$green600"
                borderRadius="$xl"
                onPress={handleResetPassword}
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
                    <Check size={20} color="white" />
                    <ButtonText fontSize="$md" fontWeight="$semibold">
                      비밀번호 변경하기
                    </ButtonText>
                  </HStack>
                )}
              </Button>

              {/* 안내 메시지 */}
              <Box 
                bg="$amber50" 
                p="$4" 
                borderRadius="$lg"
                borderWidth={1}
                borderColor="$amber200"
              >
                <VStack space="sm">
                  <Text size="sm" color="$amber800" fontWeight="$bold">
                    ⚠️ 주의사항
                  </Text>
                  <Text size="sm" color="$amber700" lineHeight="$lg">
                    • 토큰은 10분간만 유효합니다{'\n'}
                    • 비밀번호는 6자 이상이어야 합니다{'\n'}
                    • 토큰은 한 번만 사용할 수 있습니다
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

export default ResetPasswordScreen;


import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { 
  Text, 
  Button, 
  TextInput, 
  Card, 
  Title, 
  Paragraph,
  IconButton
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { currentApi, SignUpRequest } from '../services/api';
import { validateSignUpForm, SignUpFormData } from '../utils/validation';

interface SignUpScreenProps {
  navigation: any;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
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

  const handleSignUp = async () => {
    // 통합 유효성 검사
    const validation = validateSignUpForm(formData as SignUpFormData);
    if (!validation.isValid) {
      Alert.alert('알림', validation.message || '입력값을 확인해주세요.');
      return;
    }

    setIsLoading(true);
    
    try {
      // API 요청 데이터 준비
      const signUpData: SignUpRequest = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone?.trim() || undefined,
      };

      console.log('🔄 회원가입 API 호출 시작...');
      
      // 실제 API 호출
      const response = await currentApi.signUp(signUpData);
      
      if (response.success && response.data) {
        console.log('✅ 회원가입 성공:', response.data);
        
        Alert.alert(
          '🎉 회원가입 완료!', 
          `${response.data.name}님, 환영합니다!\n현장기록 앱에 성공적으로 가입되었습니다.`,
          [
            {
              text: '로그인하기',
              onPress: () => navigation.replace('Login')
            }
          ]
        );
      } else {
        console.error('❌ 회원가입 실패:', response.error);
        Alert.alert(
          '회원가입 실패',
          response.error || '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.'
        );
      }
    } catch (error) {
      console.error('❌ 회원가입 예외 오류:', error);
      Alert.alert(
        '오류 발생',
        '네트워크 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 헤더 */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <View style={styles.titleContainer}>
            <Text style={styles.emoji}>📝</Text>
            <Title style={styles.title}>회원가입</Title>
            <Paragraph style={styles.subtitle}>현장기록에 오신 것을 환영합니다</Paragraph>
          </View>
        </View>

        {/* 회원가입 폼 */}
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="이름 *"
              mode="outlined"
              placeholder="이름을 입력하세요"
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              style={styles.input}
            />

            <TextInput
              label="이메일 *"
              mode="outlined"
              placeholder="이메일을 입력하세요"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            <TextInput
              label="비밀번호 *"
              mode="outlined"
              placeholder="비밀번호를 입력하세요 (6자 이상)"
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              style={styles.input}
              right={
                <TextInput.Icon 
                  icon={showPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            <TextInput
              label="비밀번호 확인 *"
              mode="outlined"
              placeholder="비밀번호를 다시 입력하세요"
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData('confirmPassword', value)}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              style={styles.input}
              right={
                <TextInput.Icon 
                  icon={showConfirmPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
            />

            <TextInput
              label="회사명"
              mode="outlined"
              placeholder="회사명을 입력하세요 (선택사항)"
              value={formData.company}
              onChangeText={(value) => updateFormData('company', value)}
              style={styles.input}
            />

            <TextInput
              label="전화번호"
              mode="outlined"
              placeholder="전화번호를 입력하세요 (선택사항)"
              value={formData.phone}
              onChangeText={(value) => updateFormData('phone', value)}
              keyboardType="phone-pad"
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={handleSignUp}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
              labelStyle={styles.buttonText}
            >
              {isLoading ? '가입 중...' : '회원가입'}
            </Button>
          </Card.Content>
        </Card>

        {/* 로그인 링크 */}
        <View style={styles.loginLink}>
          <Text style={styles.loginLinkText}>이미 계정이 있으신가요?</Text>
          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            labelStyle={styles.loginLinkButton}
          >
            로그인하기
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: -8,
    marginBottom: 10,
  },
  titleContainer: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'NotoSansKR_700Bold',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'NotoSansKR_400Regular',
    color: '#666',
    textAlign: 'center',
  },
  card: {
    marginBottom: 20,
    elevation: 4,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  buttonText: {
    fontFamily: 'NotoSansKR_500Medium',
    fontSize: 16,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginLinkText: {
    fontFamily: 'NotoSansKR_400Regular',
    fontSize: 14,
    color: '#666',
  },
  loginLinkButton: {
    fontFamily: 'NotoSansKR_500Medium',
    fontSize: 14,
  },
});

export default SignUpScreen;

import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import {
  Text,
  Button,
  TextInput,
  Card,
  Title,
  Paragraph
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { currentApi, LoginRequest } from '../services/api';
import { validateEmail } from '../utils/validation';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        console.log('✅ 로그인 성공:', response.data.user);
        
        // TODO: 토큰 저장 (AsyncStorage 등)
        // await AsyncStorage.setItem('access_token', response.data.access_token);
        // await AsyncStorage.setItem('refresh_token', response.data.refresh_token);
        
        navigation.replace('Home');
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 로고 및 타이틀 */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🏗️</Text>
          <Title style={styles.title}>현장기록</Title>
        </View>

        {/* 로그인 폼 */}
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="이메일"
              mode="outlined"
              placeholder="이메일을 입력하세요"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            <TextInput
              label="비밀번호"
              mode="outlined"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
              labelStyle={styles.buttonText}
            >
              로그인
            </Button>

            <Button
              mode="outlined"
              onPress={handleSignUp}
              style={styles.button}
              labelStyle={styles.buttonText}
            >
              회원가입
            </Button>
          </Card.Content>
        </Card>

        {/* 테스트 계정 안내 */}
        <Card style={styles.testCard}>
          <Card.Content>
            <Text style={styles.testTitle}>테스트 계정</Text>
            <Text>이메일: test@fieldlog.com</Text>
            <Text>비밀번호: password123</Text>
          </Card.Content>
        </Card>
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
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
  testCard: {
    backgroundColor: '#E3F2FD',
  },
  testTitle: {
    fontFamily: 'NotoSansKR_500Medium',
    marginBottom: 8,
  },
});

export default LoginScreen;

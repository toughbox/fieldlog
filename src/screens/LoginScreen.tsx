import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { 
  Text, 
  Button, 
  TextInput, 
  Card, 
  Title, 
  Paragraph,
  Divider,
  Avatar
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    
    // 임시 로그인 로직 (실제로는 API 호출)
    setTimeout(() => {
      setIsLoading(false);
      if (email === 'test@fieldlog.com' && password === 'password123') {
        navigation.replace('Home');
      } else {
        Alert.alert('로그인 실패', '이메일 또는 비밀번호가 올바르지 않습니다.');
      }
    }, 1000);
  };

  const handleSignUp = () => {
    Alert.alert('회원가입', '회원가입 기능은 준비 중입니다.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* 로고 및 타이틀 */}
        <View style={styles.logoContainer}>
          <Avatar.Icon 
            size={80} 
            icon="construction" 
            style={styles.logo}
          />
          <Title style={styles.title}>현장기록</Title>
          <Paragraph style={styles.subtitle}>FieldLog</Paragraph>
        </View>

        {/* 로그인 폼 */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>이메일</Text>
              <TextInput
                mode="outlined"
                placeholder="이메일을 입력하세요"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>비밀번호</Text>
              <TextInput
                mode="outlined"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
              contentStyle={styles.buttonContent}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </Card.Content>
        </Card>

        {/* 구분선 */}
        <View style={styles.dividerContainer}>
          <Divider style={styles.divider} />
          <Text style={styles.dividerText}>또는</Text>
          <Divider style={styles.divider} />
        </View>

        {/* 회원가입 버튼 */}
        <Button
          mode="outlined"
          onPress={handleSignUp}
          style={styles.signupButton}
          contentStyle={styles.buttonContent}
        >
          회원가입
        </Button>

        {/* 테스트 계정 안내 */}
        <Card style={styles.testCard}>
          <Card.Content>
            <Text style={styles.testTitle}>테스트 계정</Text>
            <Text style={styles.testText}>이메일: test@fieldlog.com</Text>
            <Text style={styles.testText}>비밀번호: password123</Text>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    backgroundColor: '#2196F3',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    marginBottom: 20,
    elevation: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
  },
  loginButton: {
    marginTop: 8,
  },
  buttonContent: {
    height: 48,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 12,
  },
  signupButton: {
    marginBottom: 20,
  },
  testCard: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    borderWidth: 1,
  },
  testTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  testText: {
    fontSize: 12,
    color: '#1976D2',
    marginBottom: 4,
  },
});

export default LoginScreen;

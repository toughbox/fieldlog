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
      <ScrollView contentContainerStyle={styles.content}>
        {/* 로고 및 타이틀 */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🏗️</Text>
          <Title style={styles.title}>현장기록</Title>
          <Paragraph style={styles.subtitle}>FieldLog</Paragraph>
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

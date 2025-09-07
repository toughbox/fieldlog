import React, { useState } from 'react';
import { View, StyleSheet, Alert, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import {
  Text,
  Button,
  Card,
  Title,
  Paragraph,
  Surface
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

interface HomeScreenProps {
  navigation: any;
}

// 임시 데이터
const mockData = {
  todayStats: {
    pending: 5,
    inProgress: 3,
    completed: 12,
    urgent: 2
  },
  upcomingTasks: [
    {
      id: 1,
      title: '101동 전기하자',
      field: '건설현장',
      dueDate: '오늘',
      priority: 'high',
      status: 'pending'
    },
    {
      id: 2,
      title: '서버점검',
      field: '서버관리',
      dueDate: '내일',
      priority: 'medium',
      status: 'pending'
    }
  ],
  recentActivities: [
    {
      id: 1,
      title: '배송지연 이슈',
      time: '30분 전',
      type: 'created'
    },
    {
      id: 2,
      title: '안전점검 완료',
      time: '1시간 전',
      type: 'completed'
    }
  ]
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const { logout, user } = useAuth();

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '로그아웃', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.replace('Login');
            } catch (error) {
              console.error('❌ 로그아웃 오류:', error);
              Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'in_progress': return '#2196F3';
      case 'pending': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 헤더 */}
        <View style={styles.header}>
               <View>
                 <Title style={styles.headerTitle}>현장기록</Title>
                 <Paragraph style={styles.headerSubtitle}>
                   안녕하세요, {user?.name || '사용자'}님! 👋
                 </Paragraph>
               </View>
          <Button 
            mode="outlined" 
            onPress={handleLogout} 
            compact
            labelStyle={styles.buttonText}
          >
            로그아웃
          </Button>
        </View>

        <View style={styles.content}>
          {/* 오늘의 현황 */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>📊 오늘의 현황</Title>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Surface style={[styles.statCircle, { backgroundColor: '#FFF3E0' }]}>
                    <Text style={[styles.statNumber, { color: '#FF9800' }]}>
                      {mockData.todayStats.pending}
                    </Text>
                  </Surface>
                  <Text style={styles.statLabel}>대기중</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Surface style={[styles.statCircle, { backgroundColor: '#E3F2FD' }]}>
                    <Text style={[styles.statNumber, { color: '#2196F3' }]}>
                      {mockData.todayStats.inProgress}
                    </Text>
                  </Surface>
                  <Text style={styles.statLabel}>진행중</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Surface style={[styles.statCircle, { backgroundColor: '#E8F5E8' }]}>
                    <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
                      {mockData.todayStats.completed}
                    </Text>
                  </Surface>
                  <Text style={styles.statLabel}>완료</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Surface style={[styles.statCircle, { backgroundColor: '#FFEBEE' }]}>
                    <Text style={[styles.statNumber, { color: '#F44336' }]}>
                      {mockData.todayStats.urgent}
                    </Text>
                  </Surface>
                  <Text style={styles.statLabel}>긴급</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* 마감 임박 작업 */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>⚠️ 마감 임박</Title>
              {mockData.upcomingTasks.map((task) => (
                <Card key={task.id} style={styles.taskCard}>
                  <Card.Content>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskCategory}>{task.field}</Text>
                    <Text style={styles.taskDueDate}>{task.dueDate}</Text>
                  </Card.Content>
                </Card>
              ))}
            </Card.Content>
          </Card>

          {/* 빠른 액션 */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>빠른 작업</Title>
              <View style={styles.actionGrid}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={() => Alert.alert('알림', '새 기록 작성 기능 준비중')}
                >
                  <Text style={styles.actionIcon}>📝</Text>
                  <Text style={styles.primaryButtonText}>새 기록</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={() => navigation.navigate('CreateField')}
                >
                  <Text style={styles.actionIcon}>🏗️</Text>
                  <Text style={styles.secondaryButtonText}>새 현장</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={() => navigation.navigate('FieldList')}
                >
                  <Text style={styles.actionIcon}>📋</Text>
                  <Text style={styles.secondaryButtonText}>현장 관리</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={() => Alert.alert('알림', '일정 보기 기능 준비중')}
                >
                  <Text style={styles.actionIcon}>📅</Text>
                  <Text style={styles.secondaryButtonText}>일정 보기</Text>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>

      {/* 하단 네비게이션 */}
      <Surface style={styles.bottomNav}>
        <View style={styles.navContainer}>
          <Button mode="text" compact labelStyle={styles.navButtonText}>🏠 홈</Button>
          <Button mode="text" compact labelStyle={styles.navButtonText}>📂 기록</Button>
          <Button 
            mode="text" 
            compact 
            labelStyle={styles.navButtonText}
            onPress={() => navigation.navigate('FieldList')}
          >
            🏗️ 현장
          </Button>
          <Button mode="text" compact labelStyle={styles.navButtonText}>👤 내정보</Button>
        </View>
      </Surface>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'NotoSansKR_700Bold',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'NotoSansKR_400Regular',
    color: '#666',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'NotoSansKR_500Medium',
    letterSpacing: -0.2,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'NotoSansKR_400Regular',
    color: '#666',
  },
  taskCard: {
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  taskTitle: {
    fontSize: 14,
    fontFamily: 'NotoSansKR_500Medium',
    marginBottom: 4,
  },
  taskCategory: {
    fontSize: 12,
    fontFamily: 'NotoSansKR_400Regular',
    color: '#666',
    marginBottom: 4,
  },
  taskDueDate: {
    fontSize: 12,
    fontFamily: 'NotoSansKR_500Medium',
    color: '#FF9800',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    width: '48%',
    aspectRatio: 1.5,
    marginBottom: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'NotoSansKR_500Medium',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'NotoSansKR_500Medium',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    backgroundColor: 'white',
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  buttonText: {
    fontFamily: 'NotoSansKR_500Medium',
    fontSize: 16,
  },
  navButtonText: {
    fontFamily: 'NotoSansKR_400Regular',
    fontSize: 12,
  },
});

export default HomeScreen;

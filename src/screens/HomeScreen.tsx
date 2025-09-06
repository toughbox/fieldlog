import React, { useState } from 'react';
import { View, StyleSheet, Alert, RefreshControl, ScrollView } from 'react-native';
import {
  Text,
  Button,
  Card,
  Title,
  Paragraph,
  Divider,
  Avatar,
  Chip,
  Surface
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      category: '건설현장',
      dueDate: '오늘',
      priority: 'high',
      status: 'pending'
    },
    {
      id: 2,
      title: '서버점검',
      category: '서버관리',
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
          onPress: () => navigation.replace('Login')
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
            <Paragraph style={styles.headerSubtitle}>안녕하세요! 👋</Paragraph>
          </View>
          <Button
            mode="outlined"
            onPress={handleLogout}
            compact
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
              <View style={styles.cardHeader}>
                <Title style={styles.cardTitle}>⚠️ 마감 임박</Title>
                <Text style={styles.cardSubtitle}>24시간 이내</Text>
              </View>
              
              {mockData.upcomingTasks.map((task) => (
                <Card key={task.id} style={styles.taskCard}>
                  <Card.Content style={styles.taskContent}>
                    <View style={styles.taskInfo}>
                      <View style={styles.taskHeader}>
                        <View 
                          style={[
                            styles.priorityDot, 
                            { backgroundColor: getPriorityColor(task.priority) }
                          ]} 
                        />
                        <Text style={styles.taskTitle}>{task.title}</Text>
                      </View>
                      <Text style={styles.taskCategory}>{task.category}</Text>
                    </View>
                    <View style={styles.taskMeta}>
                      <Text 
                        style={[
                          styles.taskDueDate,
                          { color: task.dueDate === '오늘' ? '#F44336' : '#FF9800' }
                        ]}
                      >
                        {task.dueDate}
                      </Text>
                      <Chip 
                        mode="outlined" 
                        compact
                        textStyle={{ fontSize: 10 }}
                      >
                        대기중
                      </Chip>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </Card.Content>
          </Card>

          {/* 최근 활동 */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>📝 최근 활동</Title>
              
              {mockData.recentActivities.map((activity, index) => (
                <View key={activity.id}>
                  <View style={styles.activityItem}>
                    <View 
                      style={[
                        styles.activityDot,
                        { backgroundColor: activity.type === 'completed' ? '#4CAF50' : '#2196F3' }
                      ]}
                    />
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <Text style={styles.activityTime}>{activity.time}</Text>
                    </View>
                  </View>
                  {index < mockData.recentActivities.length - 1 && (
                    <Divider style={styles.activityDivider} />
                  )}
                </View>
              ))}
            </Card.Content>
          </Card>

          {/* 빠른 액션 버튼들 */}
          <View style={styles.quickActions}>
            <Title style={styles.cardTitle}>빠른 작업</Title>
            <View style={styles.actionButtons}>
              <Button 
                mode="contained" 
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
              >
                새 기록
              </Button>
              <Button 
                mode="outlined" 
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
              >
                카테고리
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 하단 네비게이션 (임시) */}
      <Surface style={styles.bottomNav}>
        <View style={styles.navContainer}>
          <Button mode="text" compact>🏠 홈</Button>
          <Button mode="text" compact>📂 기록</Button>
          <Button mode="text" compact>📋 카테고리</Button>
          <Button mode="text" compact>👤 내정보</Button>
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
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 100, // 하단 네비게이션 공간
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
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
    color: '#666',
  },
  taskCard: {
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  taskContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  taskCategory: {
    fontSize: 12,
    color: '#666',
  },
  taskMeta: {
    alignItems: 'flex-end',
  },
  taskDueDate: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
  activityDivider: {
    marginVertical: 8,
  },
  quickActions: {
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonContent: {
    height: 48,
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
});

export default HomeScreen;

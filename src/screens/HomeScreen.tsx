import React, { useState } from 'react';
import { RefreshControl, ScrollView, Alert, StatusBar } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  SafeAreaView,
  Heading,
  Badge,
  Pressable,
  Center,
  Divider,
  ButtonText,
  ButtonIcon
} from '@gluestack-ui/themed';
import { 
  Home, 
  FileText, 
  Settings, 
  User, 
  Plus, 
  BarChart3, 
  Calendar, 
  LogOut,
  Edit,
  Building,
  List
} from 'lucide-react-native';
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
    <SafeAreaView flex={1} bg="$coolGray50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={false} />
      
      {/* 헤더 */}
      <Box bg="white" px="$4" py="$3" shadowOpacity={0.1} shadowRadius={4} shadowOffset={{ width: 0, height: 2 }}>
        <HStack justifyContent="space-between" alignItems="center">
          <VStack>
            <Heading size="xl" color="$gray900">현장기록</Heading>
            <Text size="sm" color="$gray600">안녕하세요, {user?.name || '사용자'}님! 👋</Text>
          </VStack>
          <Button 
            size="sm" 
            variant="outline" 
            action="secondary"
            onPress={handleLogout}
          >
            <ButtonIcon as={LogOut} />
            <ButtonText>로그아웃</ButtonText>
          </Button>
        </HStack>
      </Box>
      
      <ScrollView
        flex={1}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        <VStack space="md" p="$4">
          {/* 오늘의 현황 */}
          <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8}>
            <VStack space="md">
              <HStack alignItems="center" space="sm">
                <BarChart3 size={20} color="#6366f1" />
                <Heading size="lg" color="$gray900">오늘의 현황</Heading>
              </HStack>
              
              <HStack justifyContent="space-between" space="sm">
                <VStack alignItems="center" flex={1}>
                  <Center 
                    w="$12" 
                    h="$12" 
                    bg="$orange100" 
                    borderRadius="$full"
                    mb="$2"
                  >
                    <Text size="lg" fontWeight="bold" color="$orange600">
                      {mockData.todayStats.pending}
                    </Text>
                  </Center>
                  <Text size="xs" color="$gray600">대기중</Text>
                </VStack>
                
                <VStack alignItems="center" flex={1}>
                  <Center 
                    w="$12" 
                    h="$12" 
                    bg="$blue100" 
                    borderRadius="$full"
                    mb="$2"
                  >
                    <Text size="lg" fontWeight="bold" color="$blue600">
                      {mockData.todayStats.inProgress}
                    </Text>
                  </Center>
                  <Text size="xs" color="$gray600">진행중</Text>
                </VStack>
                
                <VStack alignItems="center" flex={1}>
                  <Center 
                    w="$12" 
                    h="$12" 
                    bg="$green100" 
                    borderRadius="$full"
                    mb="$2"
                  >
                    <Text size="lg" fontWeight="bold" color="$green600">
                      {mockData.todayStats.completed}
                    </Text>
                  </Center>
                  <Text size="xs" color="$gray600">완료</Text>
                </VStack>
                
                <VStack alignItems="center" flex={1}>
                  <Center 
                    w="$12" 
                    h="$12" 
                    bg="$red100" 
                    borderRadius="$full"
                    mb="$2"
                  >
                    <Text size="lg" fontWeight="bold" color="$red600">
                      {mockData.todayStats.urgent}
                    </Text>
                  </Center>
                  <Text size="xs" color="$gray600">긴급</Text>
                </VStack>
              </HStack>
            </VStack>
          </Card>

          {/* 마감 임박 작업 */}
          <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8}>
            <VStack space="sm">
              <HStack alignItems="center" space="sm">
                <Calendar size={20} color="#f59e0b" />
                <Heading size="lg" color="$gray900">마감 임박</Heading>
              </HStack>
              
              {mockData.upcomingTasks.map((task) => (
                <Card key={task.id} bg="$orange50" p="$3" borderRadius="$md" borderLeftWidth={4} borderLeftColor="$orange500">
                  <VStack space="xs">
                    <Text fontWeight="semibold" color="$gray900">{task.title}</Text>
                    <HStack justifyContent="space-between" alignItems="center">
                      <Badge bg="$orange100" borderRadius="$sm">
                        <Text size="xs" color="$orange700">{task.field}</Text>
                      </Badge>
                      <Text size="xs" color="$orange600" fontWeight="medium">{task.dueDate}</Text>
                    </HStack>
                  </VStack>
                </Card>
              ))}
            </VStack>
          </Card>

          {/* 빠른 액션 */}
          <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8}>
            <VStack space="md">
              <HStack alignItems="center" space="sm">
                <Plus size={20} color="#6366f1" />
                <Heading size="lg" color="$gray900">빠른 작업</Heading>
              </HStack>
              
              <VStack space="sm">
                <HStack space="sm">
                  <Button 
                    flex={1}
                    size="lg" 
                    action="primary" 
                    onPress={() => Alert.alert('알림', '새 기록 작성 기능 준비중')}
                  >
                    <ButtonIcon as={Edit} />
                    <ButtonText>새 기록</ButtonText>
                  </Button>

                  <Button 
                    flex={1}
                    size="lg" 
                    variant="outline" 
                    action="secondary"
                    onPress={() => navigation.navigate('CreateField')}
                  >
                    <ButtonIcon as={Building} />
                    <ButtonText>새 현장</ButtonText>
                  </Button>
                </HStack>

                <HStack space="sm">
                  <Button 
                    flex={1}
                    size="lg" 
                    variant="outline" 
                    action="secondary"
                    onPress={() => navigation.navigate('FieldList')}
                  >
                    <ButtonIcon as={List} />
                    <ButtonText>현장 관리</ButtonText>
                  </Button>

                  <Button 
                    flex={1}
                    size="lg" 
                    variant="outline" 
                    action="secondary"
                    onPress={() => Alert.alert('알림', '일정 보기 기능 준비중')}
                  >
                    <ButtonIcon as={Calendar} />
                    <ButtonText>일정 보기</ButtonText>
                  </Button>
                </HStack>
              </VStack>
            </VStack>
          </Card>
        </VStack>
      </ScrollView>

      {/* 하단 네비게이션 */}
      <Box 
        bg="white" 
        px="$4" 
        py="$2" 
        shadowOpacity={0.1} 
        shadowRadius={8} 
        shadowOffset={{ width: 0, height: -2 }}
        borderTopWidth={1}
        borderTopColor="$gray200"
      >
        <HStack justifyContent="space-around" alignItems="center">
          <Pressable alignItems="center" p="$2" flex={1}>
            <Center mb="$1">
              <Home size={24} color="#6366f1" />
            </Center>
            <Text size="xs" color="$primary600" fontWeight="medium">홈</Text>
          </Pressable>
          
          <Pressable alignItems="center" p="$2" flex={1}>
            <Center mb="$1">
              <FileText size={24} color="#9ca3af" />
            </Center>
            <Text size="xs" color="$gray500">기록</Text>
          </Pressable>
          
          <Pressable 
            alignItems="center" 
            p="$2" 
            flex={1}
            onPress={() => navigation.navigate('FieldList')}
          >
            <Center mb="$1">
              <Building size={24} color="#9ca3af" />
            </Center>
            <Text size="xs" color="$gray500">현장</Text>
          </Pressable>
          
          <Pressable 
            alignItems="center" 
            p="$2" 
            flex={1}
            onPress={handleLogout}
          >
            <Center mb="$1">
              <LogOut size={24} color="#ef4444" />
            </Center>
            <Text size="xs" color="$red500">로그아웃</Text>
          </Pressable>
        </HStack>
      </Box>
    </SafeAreaView>
  );
};

export default HomeScreen;

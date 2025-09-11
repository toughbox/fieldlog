import React, { useState, useEffect, useCallback } from 'react';
import { RefreshControl, ScrollView, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
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
import { currentRecordApi } from '../services/api';
import { TokenService } from '../services/tokenService';

interface HomeScreenProps {
  navigation: any;
}

// 최근 활동 목 데이터 (나중에 실제 데이터로 교체 예정)
const mockData = {
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
  const [todayStats, setTodayStats] = useState({
    pending: 0,
    in_progress: 0,
    completed: 0,
    urgent: 0
  });
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { logout, user } = useAuth();

  const loadTodayStats = async () => {
    try {
      const accessToken = await TokenService.getAccessToken();
      if (!accessToken) return;

      // 모든 기록을 가져와서 상태별로 집계
      const response = await currentRecordApi.getRecords(accessToken, {
        page: 1,
        limit: 1000 // 충분히 큰 수로 모든 기록 가져오기
      });

      if (response.success && response.data) {
        const records = response.data.records;
        
        // 상태별 집계
        const stats = {
          pending: records.filter(r => r.status === 'pending').length,
          in_progress: records.filter(r => r.status === 'in_progress').length,
          completed: records.filter(r => r.status === 'completed').length,
          urgent: records.filter(r => r.priority >= 4).length // 우선순위 4,5가 긴급
        };
        
        setTodayStats(stats);
        
        // 마감 임박 기록들 필터링 (진행중이거나 대기중이면서 마감일이 7일 이내)
        const today = new Date();
        const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const upcoming = records
          .filter(record => 
            (record.status === 'pending' || record.status === 'in_progress') &&
            record.due_date &&
            new Date(record.due_date) <= sevenDaysLater
          )
          .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
          .slice(0, 5) // 최대 5개만
          .map(record => ({
            id: record.id,
            title: record.title,
            field: record.field_name || '현장',
            dueDate: formatDueDate(record.due_date!),
            priority: record.priority >= 4 ? 'high' : record.priority >= 3 ? 'medium' : 'low',
            status: record.status,
            recordData: record
          }));
          
        setUpcomingTasks(upcoming);
      }
    } catch (error) {
      console.error('❌ 통계 데이터 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 마감일 포맷팅 함수
  const formatDueDate = (dateString: string) => {
    const dueDate = new Date(dateString);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '내일';
    if (diffDays === -1) return '어제';
    if (diffDays < 0) return `${Math.abs(diffDays)}일 지남`;
    if (diffDays <= 7) return `${diffDays}일 후`;
    
    return dueDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  };

  useEffect(() => {
    loadTodayStats();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTodayStats();
    setRefreshing(false);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <StatusBar barStyle="dark-content" backgroundColor="white" translucent={false} />
      
      {/* 헤더 */}
      <Box bg="white" px="$4" py="$3" shadowOpacity={0.1} shadowRadius={4} shadowOffset={{ width: 0, height: 2 }}>
        <HStack justifyContent="space-between" alignItems="center">
          <VStack>
            <Heading size="xl" color="$gray900" fontFamily="NotoSansKR_700Bold">현장기록</Heading>
            <Text size="sm" color="$gray600" fontFamily="NotoSansKR_400Regular">안녕하세요, {user?.name || '사용자'}님! 👋</Text>
          </VStack>
          <Button 
            size="sm" 
            variant="outline" 
            action="secondary"
            onPress={handleLogout}
          >
            <ButtonIcon as={LogOut} />
            <ButtonText fontFamily="NotoSansKR_500Medium">로그아웃</ButtonText>
          </Button>
        </HStack>
      </Box>
      
      <ScrollView
        style={{ flex: 1 }}
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
                <Heading size="lg" color="$gray900" fontFamily="NotoSansKR_700Bold">오늘의 현황</Heading>
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
                      {todayStats.pending}
                    </Text>
                  </Center>
                  <Text size="xs" color="$gray600" fontFamily="NotoSansKR_400Regular">대기중</Text>
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
                      {todayStats.in_progress}
                    </Text>
                  </Center>
                  <Text size="xs" color="$gray600" fontFamily="NotoSansKR_400Regular">진행중</Text>
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
                      {todayStats.completed}
                    </Text>
                  </Center>
                  <Text size="xs" color="$gray600" fontFamily="NotoSansKR_400Regular">완료</Text>
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
                      {todayStats.urgent}
                    </Text>
                  </Center>
                  <Text size="xs" color="$gray600" fontFamily="NotoSansKR_400Regular">긴급</Text>
                </VStack>
              </HStack>
            </VStack>
          </Card>

          {/* 마감 임박 작업 */}
          <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8}>
            <VStack space="sm">
              <HStack alignItems="center" space="sm">
                <Calendar size={20} color="#f59e0b" />
                <Heading size="lg" color="$gray900" fontFamily="NotoSansKR_700Bold">마감 임박</Heading>
              </HStack>
              
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map((task) => (
                  <Pressable 
                    key={task.id} 
                    onPress={() => navigation.navigate('RecordDetail', { recordId: task.id })}
                  >
                    <HStack 
                      bg="$red100" 
                      p="$2" 
                      borderRadius="$sm" 
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <VStack flex={1} space="xs">
                        <Text size="sm" fontWeight="medium" color="$gray900" fontFamily="NotoSansKR_500Medium" numberOfLines={1}>
                          {task.title}
                        </Text>
                        <Text size="xs" color="$red600" fontFamily="NotoSansKR_400Regular">
                          {task.field}
                        </Text>
                      </VStack>
                      <Text size="xs" color="$red600" fontWeight="bold" fontFamily="NotoSansKR_500Medium">
                        {task.dueDate}
                      </Text>
                    </HStack>
                  </Pressable>
                ))
              ) : (
                <Text size="sm" color="$gray500" textAlign="center" fontFamily="NotoSansKR_400Regular" py="$3">
                  마감 임박한 작업이 없습니다
                </Text>
              )}
            </VStack>
          </Card>

          {/* 빠른 액션 */}
          <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8}>
            <VStack space="md">
              <HStack alignItems="center" space="sm">
                <Plus size={20} color="#6366f1" />
                <Heading size="lg" color="$gray900" fontFamily="NotoSansKR_700Bold">빠른 작업</Heading>
              </HStack>
              
              <VStack space="sm">
                <HStack space="sm">
                  <Button 
                    flex={1}
                    size="lg" 
                    variant="outline" 
                    action="secondary"
                    onPress={() => navigation.navigate('CreateField')}
                  >
                    <ButtonIcon as={Building} />
                    <ButtonText fontFamily="NotoSansKR_500Medium">새 현장</ButtonText>
                  </Button>

                  <Button 
                    flex={1}
                    size="lg" 
                    variant="outline" 
                    action="secondary"
                    onPress={() => navigation.navigate('FieldList')}
                  >
                    <ButtonIcon as={List} />
                    <ButtonText fontFamily="NotoSansKR_500Medium">현장 관리</ButtonText>
                  </Button>
                </HStack>

                <HStack space="sm">
                  <Button 
                    flex={1}
                    size="lg" 
                    action="primary" 
                    onPress={() => navigation.navigate('CreateRecord')}
                  >
                    <ButtonIcon as={Edit} />
                    <ButtonText fontFamily="NotoSansKR_500Medium">새 기록</ButtonText>
                  </Button>

                  <Button 
                    flex={1}
                    size="lg" 
                    variant="outline" 
                    action="secondary"
                    onPress={() => navigation.navigate('RecordsList')}
                  >
                    <ButtonIcon as={List} />
                    <ButtonText fontFamily="NotoSansKR_500Medium">기록 목록</ButtonText>
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
            <Text size="xs" color="$primary600" fontWeight="medium" fontFamily="NotoSansKR_400Regular">홈</Text>
          </Pressable>
          
          <Pressable alignItems="center" p="$2" flex={1}>
            <Center mb="$1">
              <List size={24} color="#9ca3af" />
            </Center>
            <Text size="xs" color="$gray500" fontFamily="NotoSansKR_400Regular">기록</Text>
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
            <Text size="xs" color="$gray500" fontFamily="NotoSansKR_400Regular">현장</Text>
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
            <Text size="xs" color="$red500" fontFamily="NotoSansKR_400Regular">로그아웃</Text>
          </Pressable>
        </HStack>
      </Box>
    </SafeAreaView>
  );
};

export default HomeScreen;

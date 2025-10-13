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
  List,
  FileText
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { currentRecordApi, currentFieldApi } from '../services/api';
import { TokenService } from '../services/tokenService';
import BottomNavigation from '../components/BottomNavigation';

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
          urgent: records.filter(r => r.priority >= 3).length // 우선순위 3이 긴급
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
            priority: record.priority >= 3 ? 'high' : record.priority >= 2 ? 'medium' : 'low',
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

  const checkFieldsAndNavigateToCreateRecord = async () => {
    try {
      const accessToken = await TokenService.getAccessToken();
      if (!accessToken) {
        Alert.alert('오류', '접근 권한이 없습니다.');
        return;
      }

      // 현장 목록 조회
      const response = await currentRecordApi.getRecords(accessToken, {
        page: 1,
        limit: 1 // 하나만 확인
      });

      // 현장 API로 직접 확인
      const fieldsResponse = await currentFieldApi.getFields(accessToken);
      
      if (!fieldsResponse.success || !fieldsResponse.data || fieldsResponse.data.length === 0) {
        Alert.alert(
          '현장이 없습니다',
          '기록을 작성하려면 먼저 현장을 생성해주세요.',
          [
            { text: '취소', style: 'cancel' },
            { 
              text: '현장 생성', 
              onPress: () => navigation.navigate('CreateField')
            }
          ]
        );
        return;
      }

      // 현장이 있으면 기록 작성 화면으로 이동
      navigation.navigate('CreateRecord');
    } catch (error) {
      console.error('❌ 현장 확인 오류:', error);
      Alert.alert('오류', '현장 정보를 확인하는 중 오류가 발생했습니다.');
    }
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      
      {/* 헤더 - 그라데이션 배경 */}
      <Box 
        bg="$blue600" 
        px="$6" 
        pt="$4"
        pb="$8"
        borderBottomLeftRadius="$3xl"
        borderBottomRightRadius="$3xl"
      >
        <HStack justifyContent="space-between" alignItems="center" mb="$4">
          <VStack flex={1}>
            <Heading size="2xl" color="$white" fontWeight="$bold">
              FieldLog
            </Heading>
            <Text size="md" color="$blue100" fontWeight="$medium" mt="$1">
              안녕하세요, {user?.name || '사용자'}님! 👋
            </Text>
          </VStack>
          <Pressable 
            onPress={handleLogout}
            p="$3"
            borderRadius="$lg"
            bg="rgba(255, 255, 255, 0.2)"
          >
            <LogOut size={20} color="#ffffff" />
          </Pressable>
        </HStack>

        {/* 오늘의 현황 - 헤더 안에 통합 */}
        <HStack justifyContent="space-between" space="xs" mt="$2">
          <VStack 
            alignItems="center" 
            flex={1}
            bg="rgba(255, 255, 255, 0.15)"
            p="$3"
            borderRadius="$xl"
          >
            <Text size="2xl" fontWeight="$bold" color="$white">
              {todayStats.pending}
            </Text>
            <Text size="xs" color="$blue100" mt="$1">대기중</Text>
          </VStack>
          
          <VStack 
            alignItems="center" 
            flex={1}
            bg="rgba(255, 255, 255, 0.15)"
            p="$3"
            borderRadius="$xl"
          >
            <Text size="2xl" fontWeight="$bold" color="$white">
              {todayStats.in_progress}
            </Text>
            <Text size="xs" color="$blue100" mt="$1">진행중</Text>
          </VStack>
          
          <VStack 
            alignItems="center" 
            flex={1}
            bg="rgba(255, 255, 255, 0.15)"
            p="$3"
            borderRadius="$xl"
          >
            <Text size="2xl" fontWeight="$bold" color="$white">
              {todayStats.completed}
            </Text>
            <Text size="xs" color="$blue100" mt="$1">완료</Text>
          </VStack>
          
          <VStack 
            alignItems="center" 
            flex={1}
            bg="rgba(255, 255, 255, 0.15)"
            p="$3"
            borderRadius="$xl"
          >
            <Text size="2xl" fontWeight="$bold" color="$white">
              {todayStats.urgent}
            </Text>
            <Text size="xs" color="$blue100" mt="$1">긴급</Text>
          </VStack>
        </HStack>
      </Box>
      
      <ScrollView
        style={{ flex: 1, backgroundColor: '#f9fafb' }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <VStack space="lg" p="$6" mt="$4">

          {/* 마감 임박 작업 */}
          <VStack space="md">
            <Heading size="xl" color="$gray900" fontWeight="$bold" px="$1">
              마감 임박 작업
            </Heading>
            
            {upcomingTasks.length > 0 ? (
              <VStack space="sm">
                {upcomingTasks.map((task) => (
                  <Pressable 
                    key={task.id} 
                    onPress={() => navigation.navigate('RecordDetail', { recordId: task.id })}
                  >
                    <Card
                      bg="$white"
                      p="$4"
                      borderRadius="$xl"
                      borderWidth={1}
                      borderColor="$gray200"
                    >
                      <VStack space="sm">
                        <HStack justifyContent="space-between" alignItems="flex-start">
                          <VStack flex={1} space="xs" pr="$3">
                            <Text size="md" fontWeight="$bold" color="$gray900" numberOfLines={1}>
                              {task.title}
                            </Text>
                            <HStack space="xs" alignItems="center" flexWrap="wrap">
                              <Badge
                                size="sm"
                                variant="solid"
                                bg="$blue600"
                                borderRadius="$md"
                              >
                                <Text size="xs" color="$white" fontWeight="$bold">
                                  {task.field}
                                </Text>
                              </Badge>
                              <Badge
                                size="sm"
                                variant="solid"
                                bg={task.priority === 'high' ? '$red600' : task.priority === 'medium' ? '$orange600' : '$green600'}
                                borderRadius="$md"
                              >
                                <Text size="xs" color="$white" fontWeight="$bold">
                                  {task.priority === 'high' ? '긴급' : task.priority === 'medium' ? '보통' : '낮음'}
                                </Text>
                              </Badge>
                            </HStack>
                          </VStack>
                          <VStack alignItems="flex-end" space="xs">
                            <Badge
                              size="sm"
                              variant="solid"
                              bg="$red600"
                              borderRadius="$md"
                              px="$3"
                            >
                              <Text size="xs" color="$white" fontWeight="$bold">
                                {task.dueDate}
                              </Text>
                            </Badge>
                          </VStack>
                        </HStack>
                      </VStack>
                    </Card>
                  </Pressable>
                ))}
              </VStack>
            ) : (
              <Card bg="$white" p="$8" borderRadius="$xl" alignItems="center">
                <Calendar size={40} color="#d1d5db" strokeWidth={1.5} />
                <Text size="sm" color="$gray500" textAlign="center" mt="$3">
                  마감 임박한 작업이 없습니다
                </Text>
              </Card>
            )}
          </VStack>

          {/* 빠른 작업 */}
          <VStack space="md">
            <Heading size="xl" color="$gray900" fontWeight="$bold" px="$1">
              빠른 작업
            </Heading>
            
            <VStack space="sm">
              {/* 새 현장 - 주요 액션 */}
              <Pressable onPress={() => navigation.navigate('CreateField')}>
                <Card
                  bg="$green600"
                  p="$5"
                  borderRadius="$xl"
                >
                  <HStack space="md" alignItems="center">
                    <Box bg="rgba(255, 255, 255, 0.2)" p="$3" borderRadius="$lg">
                      <Building size={24} color="#ffffff" strokeWidth={2.5} />
                    </Box>
                    <VStack flex={1}>
                      <Text size="lg" fontWeight="$bold" color="$white">
                        새 현장
                      </Text>
                      <Text size="sm" color="rgba(255, 255, 255, 0.7)">
                        새로운 현장을 등록하세요
                      </Text>
                    </VStack>
                  </HStack>
                </Card>
              </Pressable>

              {/* 새 기록 작성 - 주요 액션 */}
              <Pressable onPress={checkFieldsAndNavigateToCreateRecord}>
                <Card
                  bg="$blue600"
                  p="$5"
                  borderRadius="$xl"
                >
                  <HStack space="md" alignItems="center">
                    <Box bg="rgba(255, 255, 255, 0.2)" p="$3" borderRadius="$lg">
                      <Edit size={24} color="#ffffff" strokeWidth={2.5} />
                    </Box>
                    <VStack flex={1}>
                      <Text size="lg" fontWeight="$bold" color="$white">
                        새 기록 작성
                      </Text>
                      <Text size="sm" color="$blue100">
                        현장 기록을 빠르게 등록하세요
                      </Text>
                    </VStack>
                  </HStack>
                </Card>
              </Pressable>

              {/* 기타 액션 */}
              <HStack space="sm">
                <Pressable flex={1} onPress={() => navigation.navigate('FieldList')}>
                  <Card 
                    bg="$white" 
                    p="$4" 
                    borderRadius="$xl" 
                    borderWidth={1}
                    borderColor="$gray200"
                    alignItems="center"
                  >
                    <Box bg="$purple600" p="$3" borderRadius="$xl" mb="$2">
                      <Building size={24} color="#ffffff" strokeWidth={2.5} />
                    </Box>
                    <Text size="sm" fontWeight="$bold" color="$gray900">
                      현장 관리
                    </Text>
                  </Card>
                </Pressable>

                <Pressable flex={1} onPress={() => navigation.navigate('RecordsList')}>
                  <Card 
                    bg="$white" 
                    p="$4" 
                    borderRadius="$xl"
                    borderWidth={1}
                    borderColor="$gray200" 
                    alignItems="center"
                  >
                    <Box bg="$orange600" p="$3" borderRadius="$xl" mb="$2">
                      <FileText size={24} color="#ffffff" strokeWidth={2.5} />
                    </Box>
                    <Text size="sm" fontWeight="$bold" color="$gray900">
                      기록 목록
                    </Text>
                  </Card>
                </Pressable>
              </HStack>
            </VStack>
          </VStack>

          {/* 하단 여백 */}
          <Box h="$16" />
        </VStack>
      </ScrollView>

      {/* 하단 네비게이션 */}
      <BottomNavigation navigation={navigation} currentScreen="Home" />
    </SafeAreaView>
  );
};

export default HomeScreen;

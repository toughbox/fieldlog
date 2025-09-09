import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, ScrollView, StatusBar, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  InputField,
  Card,
  Heading,
  Pressable,
  ButtonText,
  ButtonIcon,
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
  Badge,
  Divider,
  Spinner,
  Center,
  FlatList
} from '@gluestack-ui/themed';
import { Plus, Search, Filter, MoreVertical, Calendar, AlertCircle, CheckCircle2, Clock, X } from 'lucide-react-native';
import { currentRecordApi, currentFieldApi, FieldRecord, Field, RecordsListResponse } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TokenService } from '../services/tokenService';
import { useFocusEffect } from '@react-navigation/native';

interface RecordsListScreenProps {
  navigation: any;
  route: any;
}

const STATUS_CONFIG = {
  pending: { label: '대기', color: '#F59E0B', icon: Clock },
  in_progress: { label: '진행중', color: '#3B82F6', icon: AlertCircle },
  completed: { label: '완료', color: '#10B981', icon: CheckCircle2 },
  cancelled: { label: '취소', color: '#EF4444', icon: X }
};

const PRIORITY_CONFIG = {
  1: { label: '낮음', color: '#10B981' },
  2: { label: '보통', color: '#3B82F6' },
  3: { label: '중간', color: '#F59E0B' },
  4: { label: '높음', color: '#EF4444' },
  5: { label: '긴급', color: '#DC2626' }
};

const RecordsListScreen: React.FC<RecordsListScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { preselectedFieldId } = route.params || {};
  const flatListRef = useRef<FlatList>(null);

  // 데이터 상태
  const [records, setRecords] = useState<FieldRecord[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_records: 0,
    limit: 20
  });

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(preselectedFieldId || null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // 화면 포커스시 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [])
  );

  // 필터 변경시 데이터 재로드
  useEffect(() => {
    if (!isLoading) {
      loadRecords(true);
      
      // 필터 변경 시 목록 맨 위로 스크롤
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [searchQuery, selectedFieldId, selectedStatus, selectedPriority]);

  const loadInitialData = async () => {
    setIsLoading(true);
    await Promise.all([
      loadFields(),
      loadRecords(true)
    ]);
    setIsLoading(false);
  };

  const loadFields = async () => {
    try {
      const accessToken = await TokenService.getAccessToken();
      if (!accessToken) return;

      const response = await currentFieldApi.getFields(accessToken);
      if (response.success && response.data) {
        setFields(response.data);
      }
    } catch (error) {
      console.error('현장 목록 로드 오류:', error);
    }
  };

  const loadRecords = async (reset: boolean = false, page: number = 1) => {
    try {
      const accessToken = await TokenService.getAccessToken();
      if (!accessToken) {
        Alert.alert('오류', '접근권한이 없습니다.');
        return;
      }

      const params = {
        page: page,
        limit: 20,
        ...(searchQuery && { search: searchQuery }),
        ...(selectedFieldId && { field_id: selectedFieldId }),
        ...(selectedStatus && { status: selectedStatus }),
        ...(selectedPriority && { priority: parseInt(selectedPriority) }),
        sort_by: 'created_at',
        sort_order: 'DESC'
      };

      const response = await currentRecordApi.getRecords(accessToken, params);
      
      if (response.success && response.data) {
        if (reset) {
          setRecords(response.data.records);
        } else {
          setRecords(prev => [...prev, ...response.data.records]);
        }
        setPagination(response.data.pagination);
      } else {
        Alert.alert('오류', response.error || '기록 목록을 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('기록 목록 로드 오류:', error);
      Alert.alert('오류', '기록 목록을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRecords(true);
    setIsRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || pagination.current_page >= pagination.total_pages) return;
    
    setIsLoadingMore(true);
    await loadRecords(false, pagination.current_page + 1);
    setIsLoadingMore(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedFieldId(null);
    setSelectedStatus('');
    setSelectedPriority('');
  };

  const getFieldName = (fieldId: number) => {
    const field = fields.find(f => f.id === fieldId);
    return field?.name || '알 수 없는 현장';
  };

  const getFieldColor = (fieldId: number) => {
    const field = fields.find(f => f.id === fieldId);
    return field?.color || '#6366F1';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (record: FieldRecord) => {
    if (!record.due_date || record.status === 'completed' || record.status === 'cancelled') {
      return false;
    }
    return new Date(record.due_date) < new Date();
  };

  const renderRecordItem = ({ item }: { item: FieldRecord }) => {
    const statusConfig = STATUS_CONFIG[item.status];
    const priorityConfig = PRIORITY_CONFIG[item.priority as keyof typeof PRIORITY_CONFIG];
    const StatusIcon = statusConfig.icon;
    const overdue = isOverdue(item);

    return (
      <Pressable
        onPress={() => navigation.navigate('RecordDetail', { recordId: item.id })}
        mb="$2"
      >
        <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={4}>
          <VStack space="sm">
            {/* 헤더 */}
            <HStack justifyContent="space-between" alignItems="flex-start">
              <VStack flex={1} space="xs">
                <HStack alignItems="center" space="xs">
                  <Box 
                    w="$3" 
                    h="$3" 
                    bg={getFieldColor(item.field_id)} 
                    borderRadius="$sm" 
                  />
                  <Text size="xs" color="$gray600">
                    {item.field_name || getFieldName(item.field_id)}
                  </Text>
                </HStack>
                <Text fontWeight="bold" color="$gray900" size="md">
                  {item.title}
                </Text>
              </VStack>
              
              <VStack alignItems="flex-end" space="xs">
                <Badge variant="solid" bg={priorityConfig.color}>
                  <Text color="white" size="xs">우선순위 {item.priority}</Text>
                </Badge>
                {overdue && (
                  <Badge variant="solid" bg="$red500">
                    <Text color="white" size="xs">지연</Text>
                  </Badge>
                )}
              </VStack>
            </HStack>

            {/* 설명 */}
            {item.description && (
              <Text color="$gray600" size="sm" numberOfLines={2}>
                {item.description}
              </Text>
            )}

            {/* 상태 및 정보 */}
            <HStack justifyContent="space-between" alignItems="center">
              <HStack alignItems="center" space="sm">
                <HStack alignItems="center" space="xs">
                  <StatusIcon size={16} color={statusConfig.color} />
                  <Text size="sm" color="$gray700">{statusConfig.label}</Text>
                </HStack>
                
                {item.due_date && (
                  <HStack alignItems="center" space="xs">
                    <Calendar size={14} color="#6366f1" />
                    <Text size="xs" color={overdue ? "$red600" : "$gray600"}>
                      {formatDate(item.due_date)}
                    </Text>
                  </HStack>
                )}
              </HStack>
              
              <Text size="xs" color="$gray500">
                {formatDate(item.created_at)}
              </Text>
            </HStack>

            {/* 사용자 정의 필드 */}
            {item.custom_data && Object.keys(item.custom_data).length > 0 && (
              <VStack space="xs">
                {Object.entries(item.custom_data).map(([key, value], index) => {
                  if (!value || !value.toString().trim()) return null;
                  
                  // field_schema에서 해당 key의 label 찾기
                  const fieldDef = item.field_schema?.fields.find(f => f.key === key);
                  const label = fieldDef?.label || key;
                  
                  return (
                    <HStack key={index} space="xs" alignItems="center">
                      <Text size="xs" color="$gray500" fontWeight="500" minWidth="$16">
                        {label}:
                      </Text>
                      <Text size="xs" color="$gray700" flex={1} numberOfLines={1}>
                        {value.toString()}
                      </Text>
                    </HStack>
                  );
                })}
              </VStack>
            )}

            {/* 태그 */}
            {item.tags && item.tags.length > 0 && (
              <HStack space="xs" flexWrap="wrap">
                {item.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" size="sm">
                    <Text size="xs">{tag}</Text>
                  </Badge>
                ))}
                {item.tags.length > 3 && (
                  <Badge variant="outline" size="sm">
                    <Text size="xs">+{item.tags.length - 3}</Text>
                  </Badge>
                )}
              </HStack>
            )}
          </VStack>
        </Card>
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <Center flex={1} py="$10">
      <VStack alignItems="center" space="md">
        <Text color="$gray500" size="lg">기록이 없습니다</Text>
        <Text color="$gray400" size="sm" textAlign="center">
          새로운 현장 기록을 작성해보세요
        </Text>
        <Button 
          action="primary" 
          onPress={() => navigation.navigate('CreateRecord')}
          mt="$4"
        >
          <ButtonIcon as={Plus} mr="$1" />
          <ButtonText>첫 번째 기록 작성</ButtonText>
        </Button>
      </VStack>
    </Center>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <Box py="$4" alignItems="center">
        <Spinner size="small" />
      </Box>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <StatusBar barStyle="dark-content" backgroundColor="white" translucent={false} />
      
      {/* 헤더 */}
      <Box bg="white" px="$4" py="$3" shadowOpacity={0.1} shadowRadius={4} shadowOffset={{ width: 0, height: 2 }}>
        <HStack justifyContent="space-between" alignItems="center">
          <Heading size="xl" color="$gray900">현장 기록</Heading>
          <HStack space="sm">
            <Button 
              variant="outline" 
              size="sm" 
              onPress={() => setShowFilters(!showFilters)}
            >
              <ButtonIcon as={Filter} />
            </Button>
            <Button 
              action="primary" 
              size="sm" 
              onPress={() => navigation.navigate('CreateRecord')}
            >
              <ButtonIcon as={Plus} />
            </Button>
          </HStack>
        </HStack>
      </Box>

      {/* 검색 및 필터 */}
      <Box bg="white" px="$4" pb="$3">
        <VStack space="sm">
          {/* 검색창 */}
          <Input>
            <ButtonIcon as={Search} ml="$3" color="$gray500" />
            <InputField
              placeholder="기록 검색..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </Input>

          {/* 필터 옵션 */}
          {showFilters && (
            <VStack space="sm">
              <HStack space="sm">
                <VStack flex={1} space="xs">
                  <Text size="sm" color="$gray600">현장</Text>
                  <Select
                    selectedValue={selectedFieldId?.toString() || ''}
                    onValueChange={(value) => setSelectedFieldId(value ? parseInt(value) : null)}
                  >
                    <SelectTrigger>
                      <SelectInput placeholder="전체" />
                      <SelectIcon />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectBackdrop />
                      <SelectContent>
                        <SelectDragIndicatorWrapper>
                          <SelectDragIndicator />
                        </SelectDragIndicatorWrapper>
                        <SelectItem label="전체" value="" />
                        {fields.map((field) => (
                          <SelectItem 
                            key={field.id} 
                            label={field.name} 
                            value={field.id.toString()} 
                          />
                        ))}
                      </SelectContent>
                    </SelectPortal>
                  </Select>
                </VStack>

                <VStack flex={1} space="xs">
                  <Text size="sm" color="$gray600">상태</Text>
                  <Select
                    selectedValue={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger>
                      <SelectInput placeholder="전체" />
                      <SelectIcon />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectBackdrop />
                      <SelectContent>
                        <SelectDragIndicatorWrapper>
                          <SelectDragIndicator />
                        </SelectDragIndicatorWrapper>
                        <SelectItem label="전체" value="" />
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                          <SelectItem 
                            key={key} 
                            label={config.label} 
                            value={key} 
                          />
                        ))}
                      </SelectContent>
                    </SelectPortal>
                  </Select>
                </VStack>
              </HStack>

              <HStack justifyContent="space-between" alignItems="center">
                <VStack flex={1} space="xs" mr="$2">
                  <Text size="sm" color="$gray600">우선순위</Text>
                  <Select
                    selectedValue={selectedPriority}
                    onValueChange={setSelectedPriority}
                  >
                    <SelectTrigger>
                      <SelectInput placeholder="전체" />
                      <SelectIcon />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectBackdrop />
                      <SelectContent>
                        <SelectDragIndicatorWrapper>
                          <SelectDragIndicator />
                        </SelectDragIndicatorWrapper>
                        <SelectItem label="전체" value="" />
                        {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                          <SelectItem 
                            key={key} 
                            label={`${key} (${config.label})`} 
                            value={key} 
                          />
                        ))}
                      </SelectContent>
                    </SelectPortal>
                  </Select>
                </VStack>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onPress={clearFilters}
                  mt="$5"
                >
                  <ButtonText>초기화</ButtonText>
                </Button>
              </HStack>
            </VStack>
          )}
        </VStack>
      </Box>

      {/* 통계 정보 */}
      <Box px="$4" py="$2">
        <Text size="sm" color="$gray600">
          총 {pagination.total_records}개의 기록
        </Text>
      </Box>

      {/* 기록 목록 */}
      {isLoading ? (
        <Center flex={1}>
          <Spinner size="large" />
          <Text mt="$2" color="$gray600">기록을 불러오는 중...</Text>
        </Center>
      ) : (
        <FlatList
          ref={flatListRef}
          data={records}
          renderItem={renderRecordItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ 
            padding: 16,
            paddingBottom: 100 
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default RecordsListScreen;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, ScrollView, StatusBar, RefreshControl, FlatList, ListRenderItem } from 'react-native';
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
} from '@gluestack-ui/themed';
import { Plus, Search, Filter, MoreVertical, Calendar, AlertCircle, CheckCircle2, Clock, X, Grid, List } from 'lucide-react-native';
import { currentRecordApi, currentFieldApi, FieldRecord, Field, RecordsListResponse } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TokenService } from '../services/tokenService';
import BottomNavigation from '../components/BottomNavigation';
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
  3: { label: '긴급', color: '#EF4444' }
};

interface SafeRecordsListResponse {
  success: boolean;
  data?: {
    records: FieldRecord[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_records: number;
      limit: number;
    };
  };
  error?: string;
}

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

  // 보기 모드 상태
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

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

      const response: SafeRecordsListResponse = await currentRecordApi.getRecords(accessToken, params);
      
      const recordsData = response.data?.records || [];
      const paginationData = response.data?.pagination || { 
        current_page: 1, 
        total_pages: 1, 
        total_records: 0, 
        limit: 20 
      };

      if (response.success) {
        if (reset) {
          setRecords(recordsData);
        } else {
          setRecords(prev => [...prev, ...recordsData]);
        }
        setPagination(paginationData);
      } else {
        Alert.alert('오류', response.error || '기록 목록을 불러올 수 없습니다.');
        setRecords([]);
      }
    } catch (error) {
      console.error('기록 목록 로드 오류:', error);
      Alert.alert('오류', '기록 목록을 불러오는 중 오류가 발생했습니다.');
      setRecords([]);
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

  const checkFieldsAndNavigateToCreateRecord = async () => {
    try {
      const accessToken = await TokenService.getAccessToken();
      if (!accessToken) {
        Alert.alert('오류', '접근 권한이 없습니다.');
        return;
      }

      // 현장 목록이 비어있는지 확인
      if (!fields || fields.length === 0) {
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

  const renderRecordItem: ListRenderItem<FieldRecord> = ({ item }) => {
    if (!item) return null;
    
    const statusConfig = STATUS_CONFIG[item.status];
    const priorityConfig = PRIORITY_CONFIG[item.priority as keyof typeof PRIORITY_CONFIG];
    const StatusIcon = statusConfig.icon;
    const overdue = isOverdue(item);

    // 카드형 렌더링
    const renderCardView = () => (
      <Pressable
        onPress={() => navigation.navigate('RecordDetail', { recordId: item.id })}
      >
        <Card
          bg="$white"
          p="$4"
          borderRadius="$xl"
          borderWidth={1}
          borderColor="$gray200"
        >
          <VStack space="sm">
            {/* 헤더 */}
            <HStack justifyContent="space-between" alignItems="flex-start">
              <VStack flex={1} space="xs">
                <Badge
                  size="sm"
                  variant="solid"
                  bg="$blue600"
                  borderRadius="$md"
                  alignSelf="flex-start"
                >
                  <Text size="xs" color="$white" fontWeight="$bold">
                    {item.field_name || getFieldName(item.field_id)}
                  </Text>
                </Badge>
                <Text fontWeight="$bold" color="$gray900" size="lg">
                  {item.title}
                </Text>
              </VStack>
              
              <VStack alignItems="flex-end" space="xs">
                <Badge 
                  variant="solid" 
                  bg={priorityConfig.color}
                  borderRadius="$md"
                  px="$3"
                >
                  <Text color="$white" size="xs" fontWeight="$bold">
                    {priorityConfig.label}
                  </Text>
                </Badge>
                {overdue && (
                  <Badge variant="solid" bg="$red600" borderRadius="$md" px="$3">
                    <Text color="$white" size="xs" fontWeight="$bold">지연</Text>
                  </Badge>
                )}
              </VStack>
            </HStack>

            {/* 설명 */}
            {item.description && (
              <Text color="$gray600" size="md" numberOfLines={2} lineHeight="$lg">
                {item.description}
              </Text>
            )}

            <Divider bg="$gray200" />

            {/* 상태 및 정보 */}
            <HStack justifyContent="space-between" alignItems="center">
              <HStack alignItems="center" space="md">
                <Badge
                  size="sm"
                  variant="solid"
                  bg={statusConfig.color}
                  borderRadius="$md"
                >
                  <HStack alignItems="center" space="xs">
                    <StatusIcon size={14} color="#ffffff" strokeWidth={2.5} />
                    <Text size="xs" color="$white" fontWeight="$bold">
                      {statusConfig.label}
                    </Text>
                  </HStack>
                </Badge>
                
                {item.due_date && (
                  <HStack alignItems="center" space="xs">
                    <Calendar size={14} color={overdue ? "#ef4444" : "#6b7280"} />
                    <Text size="xs" color={overdue ? "$red600" : "$gray600"} fontWeight="$medium">
                      {formatDate(item.due_date)}
                    </Text>
                  </HStack>
                )}
              </HStack>
            </HStack>

            {/* 사용자 정의 필드 */}
            {item.custom_data && Object.keys(item.custom_data).length > 0 && (
              <VStack space="xs">
                {Object.entries(item.custom_data).map(([key, value]) => {
                  if (!value || !value.toString().trim()) return null;
                  
                  const fieldDef = item.field_schema?.fields.find(f => f.key === key);
                  const label = fieldDef?.label || key;
                  
                  return (
                    <HStack key={key} space="xs" alignItems="center">
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
                {item.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="solid" size="sm" bg="$purple600" borderRadius="$md">
                    <Text size="xs" color="$white" fontWeight="$bold">#{tag}</Text>
                  </Badge>
                ))}
                {item.tags.length > 3 && (
                  <Badge variant="solid" size="sm" bg="$purple600" borderRadius="$md">
                    <Text size="xs" color="$white" fontWeight="$bold">+{item.tags.length - 3}</Text>
                  </Badge>
                )}
              </HStack>
            )}
          </VStack>
        </Card>
      </Pressable>
    );

    // 목록형 렌더링
    const renderListView = () => (
      <Pressable
        onPress={() => navigation.navigate('RecordDetail', { recordId: item.id })}
        mb="$2"
      >
        <HStack 
          bg="white" 
          p="$3" 
          borderRadius="$lg" 
          alignItems="center" 
          space="sm"
        >
          <Box 
            w="$3" 
            h="$3" 
            bg={getFieldColor(item.field_id)} 
            borderRadius="$sm" 
          />
          <VStack flex={1} space="xs">
            <Text fontWeight="bold" color="$gray900" size="sm" numberOfLines={1}>
              {item.title}
            </Text>
            <HStack alignItems="center" space="sm">
              <Text size="xs" color="$gray600">
                {item.field_name || getFieldName(item.field_id)}
              </Text>
              <Text size="xs" color="$gray500">
                {formatDate(item.created_at)}
              </Text>
            </HStack>
          </VStack>
          <VStack alignItems="flex-end" space="xs">
            <Badge variant="solid" bg={priorityConfig.color} size="sm" borderRadius="$md">
              <Text color="$white" size="xs" fontWeight="$bold">{priorityConfig.label}</Text>
            </Badge>
            <Badge variant="solid" bg={statusConfig.color} size="sm" borderRadius="$md">
              <HStack alignItems="center" space="xs">
                <StatusIcon size={12} color="#ffffff" strokeWidth={2.5} />
                <Text size="xs" color="$white" fontWeight="$bold">{statusConfig.label}</Text>
              </HStack>
            </Badge>
          </VStack>
        </HStack>
      </Pressable>
    );

    return viewMode === 'card' ? renderCardView() : renderListView();
  };

  const renderEmptyState = () => (
    <Center flex={1} py="$20">
      <VStack alignItems="center" space="lg">
        <Box bg="$gray100" p="$6" borderRadius="$full">
          <Search size={48} color="#9ca3af" strokeWidth={1.5} />
        </Box>
        <VStack alignItems="center" space="sm">
          <Text color="$gray900" size="xl" fontWeight="$bold">
            기록이 없습니다
          </Text>
          <Text color="$gray500" size="md" textAlign="center" maxWidth="$64">
            새로운 현장 기록을 작성해보세요
          </Text>
        </VStack>
        <Button 
          size="lg"
          bg="$blue600"
          borderRadius="$xl"
          onPress={checkFieldsAndNavigateToCreateRecord}
          mt="$4"
          px="$6"
        >
          <ButtonIcon as={Plus} size="xl" mr="$2" />
          <ButtonText fontWeight="$semibold">첫 번째 기록 작성</ButtonText>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      
      {/* 헤더 - 그라데이션 배경 */}
      <Box 
        bg="$blue600" 
        px="$6" 
        pt="$4"
        pb="$6"
        borderBottomLeftRadius="$3xl"
        borderBottomRightRadius="$3xl"
      >
        <HStack justifyContent="space-between" alignItems="center" mb="$4">
          <Heading size="2xl" color="$white" fontWeight="$bold">
            현장 기록
          </Heading>
          <Pressable 
            onPress={checkFieldsAndNavigateToCreateRecord}
            p="$3"
            borderRadius="$full"
            bg="rgba(255, 255, 255, 0.2)"
          >
            <Plus size={24} color="#ffffff" strokeWidth={2.5} />
          </Pressable>
        </HStack>

        {/* 검색창 */}
        <Input
          variant="rounded"
          size="xl"
          bg="rgba(255, 255, 255, 0.9)"
          borderWidth={0}
        >
          <Box pl="$4" alignItems="center" justifyContent="center">
            <Search size={20} color="#6b7280" />
          </Box>
          <InputField
            placeholder="기록 검색..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            fontSize="$md"
            pl="$2"
          />
        </Input>

        {/* 필터 및 통계 */}
        <HStack justifyContent="space-between" alignItems="center" mt="$4">
          <Text size="sm" color="$blue100">
            총 {pagination.total_records}개의 기록
          </Text>
          <HStack space="sm">
            <Pressable 
              onPress={() => setShowFilters(!showFilters)}
              p="$2"
              borderRadius="$lg"
              bg={showFilters ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.15)"}
            >
              <Filter size={18} color="#ffffff" />
            </Pressable>
            <Pressable 
              onPress={() => setViewMode(viewMode === 'card' ? 'list' : 'card')}
              p="$2"
              borderRadius="$lg"
              bg="rgba(255, 255, 255, 0.15)"
            >
              {viewMode === 'card' ? 
                <List size={18} color="#ffffff" /> : 
                <Grid size={18} color="#ffffff" />
              }
            </Pressable>
          </HStack>
        </HStack>
      </Box>

      {/* 필터 옵션 */}
      {showFilters && (
        <Box bg="$gray50" px="$4" py="$4" borderBottomWidth={1} borderBottomColor="$gray200">
          <VStack space="md">
            <HStack space="sm">
              <VStack flex={1} space="xs">
                <Text size="sm" color="$gray700" fontWeight="$medium">현장</Text>
                <Select
                  selectedValue={selectedFieldId?.toString() || ''}
                  onValueChange={(value) => setSelectedFieldId(value ? parseInt(value) : null)}
                >
                  <SelectTrigger
                    size="md"
                    borderRadius="$lg"
                  >
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
                <Text size="sm" color="$gray700" fontWeight="$medium">상태</Text>
                <Select
                  selectedValue={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger
                    size="md"
                    borderRadius="$lg"
                  >
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

            <HStack space="sm" alignItems="flex-end">
              <VStack flex={1} space="xs">
                <Text size="sm" color="$gray700" fontWeight="$medium">우선순위</Text>
                <Select
                  selectedValue={selectedPriority}
                  onValueChange={setSelectedPriority}
                >
                  <SelectTrigger
                    size="md"
                    borderRadius="$lg"
                  >
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
                          label={`${config.label}`} 
                          value={key} 
                        />
                      ))}
                    </SelectContent>
                  </SelectPortal>
                </Select>
              </VStack>

              <Button 
                size="md" 
                variant="outline"
                onPress={clearFilters}
                borderRadius="$lg"
                px="$4"
              >
                <ButtonText fontWeight="$medium">초기화</ButtonText>
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}

      {/* 기록 목록 */}
      {isLoading ? (
        <Center flex={1}>
          <Spinner size="large" color="$blue600" />
          <Text mt="$4" color="$gray600" fontWeight="$medium">기록을 불러오는 중...</Text>
        </Center>
      ) : (
        <Box flex={1} bg="$gray50">
          <FlatList
            ref={flatListRef}
            data={records}
            renderItem={renderRecordItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ 
              padding: 16,
              paddingBottom: 100,
              gap: viewMode === 'list' ? 8 : 12
            }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#2563eb"
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        </Box>
      )}
      
      {/* 하단 네비게이션 */}
      <BottomNavigation navigation={navigation} currentScreen="RecordsList" />
    </SafeAreaView>
  );
};

export default RecordsListScreen;

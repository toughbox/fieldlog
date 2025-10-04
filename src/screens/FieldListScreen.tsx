import React, { useState, useEffect, useCallback } from 'react';
import { Alert, RefreshControl, FlatList, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
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
  Badge,
  Pressable,
  ButtonText,
  ButtonIcon,
  Fab,
  FabIcon,
  Divider,
  Center,
  Spinner
} from '@gluestack-ui/themed';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Search, 
  Building, 
  Construction, 
  Home, 
  Warehouse, 
  Factory 
} from 'lucide-react-native';
import { currentFieldApi, Field } from '../services/api';
import { currentRecordApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TokenService } from '../services/tokenService';
import BottomNavigation from '../components/BottomNavigation';

interface FieldListScreenProps {
  navigation: any;
}

const FieldListScreen: React.FC<FieldListScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [filteredFields, setFilteredFields] = useState<Field[]>([]);
  const [fieldRecordCounts, setFieldRecordCounts] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated'>('name');

  // 화면 포커스시 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      loadFields();
    }, [])
  );

  useEffect(() => {
    filterAndSortFields();
  }, [fields, searchQuery, sortBy]);

  const loadFields = async () => {
    try {
      const accessToken = await TokenService.getAccessToken();
      if (!accessToken) {
        Alert.alert('오류', '접근권한이 없습니다.');
        return;
      }

      const response = await currentFieldApi.getFields(accessToken);
      if (response.success && response.data) {
        setFields(response.data);
        // 현장 목록을 로드한 후 기록 수를 가져옴
        await loadFieldRecordCounts(response.data, accessToken);
      } else {
        Alert.alert('오류', response.message || '현장 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('현장 목록 로딩 오류:', error);
      Alert.alert('오류', '현장 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFieldRecordCounts = async (fieldsData: Field[], accessToken: string) => {
    try {
      const counts: Record<number, number> = {};
      
      // 각 현장별로 기록 수를 가져옴
      for (const field of fieldsData) {
        const response = await currentRecordApi.getRecords(accessToken, {
          field_id: field.id,
          limit: 1 // 카운트만 필요하므로 최소한으로
        });
        
        if (response.success && response.data) {
          counts[field.id] = response.data.pagination.total_records;
        } else {
          counts[field.id] = 0;
        }
      }
      
      setFieldRecordCounts(counts);
    } catch (error) {
      console.error('현장별 기록 수 로딩 오류:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFields();
    setRefreshing(false);
  };

  const filterAndSortFields = () => {
    let filtered = fields.filter(field =>
      field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (field.description && field.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredFields(filtered);
  };

  const handleFieldPress = (field: Field) => {
    // 현장 상세 화면으로 이동
    navigation.navigate('FieldDetail', { 
      fieldId: field.id, 
      field: field 
    });
  };

  const handleCreateField = () => {
    navigation.navigate('CreateField');
  };

  const getFieldStats = (field: Field) => {
    const count = fieldRecordCounts[field.id] || 0;
    return `${count}개 기록`;
  };

  const getFieldIcon = (iconName: string) => {
    switch (iconName) {
      case 'construction': return Construction;
      case 'building': return Building;
      case 'home': return Home;
      case 'warehouse': return Warehouse;
      case 'factory': return Factory;
      default: return Building;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderFieldItem = ({ item }: { item: Field }) => {
    return (
      <Pressable onPress={() => handleFieldPress(item)}>
        <Card
          bg="$white"
          p="$4"
          mb="$3"
          borderRadius="$xl"
          borderWidth={1}
          borderColor="$gray200"
        >
          <VStack space="sm">
            {/* 헤더 */}
            <HStack justifyContent="space-between" alignItems="flex-start">
              <HStack alignItems="center" space="sm" flex={1}>
                <Box
                  w="$12"
                  h="$12"
                  bg={item.color || '#6366f1'}
                  borderRadius="$xl"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Building size={24} color="#ffffff" strokeWidth={2.5} />
                </Box>
                <VStack flex={1} space="xs">
                  <Heading size="lg" color="$gray900" fontWeight="$bold">
                    {item.name}
                  </Heading>
                  <HStack alignItems="center" space="xs">
                    <Badge
                      size="sm"
                      variant="solid"
                      bg="$blue600"
                      borderRadius="$md"
                    >
                      <Text size="xs" color="$white" fontWeight="$bold">
                        {getFieldStats(item)}
                      </Text>
                    </Badge>
                  </HStack>
                </VStack>
              </HStack>
            </HStack>

            {/* 설명 */}
            {item.description && (
              <Text color="$gray600" size="md" numberOfLines={2} lineHeight="$lg">
                {item.description}
              </Text>
            )}

            <Divider bg="$gray200" />

            {/* 하단 정보 */}
            <HStack justifyContent="space-between" alignItems="center">
              <Text size="xs" color="$gray500">
                생성: {formatDate(item.created_at)}
              </Text>
              <Pressable
                onPress={() => handleFieldPress(item)}
                px="$3"
                py="$1.5"
                borderRadius="$md"
                bg="$blue600"
              >
                <Text size="xs" color="$white" fontWeight="$bold">
                  자세히 보기 →
                </Text>
              </Pressable>
            </HStack>
          </VStack>
        </Card>
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <Center flex={1} p="$8">
      <VStack alignItems="center" space="lg">
        <Box 
          w="$24" 
          h="$24" 
          bg="$blue50" 
          borderRadius="$full" 
          alignItems="center" 
          justifyContent="center"
        >
          <Building size={48} color="#2563eb" strokeWidth={2} />
        </Box>
        <VStack alignItems="center" space="sm">
          <Heading size="xl" color="$gray900" fontWeight="$bold">
            현장이 없습니다
          </Heading>
          <Text size="md" color="$gray600" textAlign="center" lineHeight="$lg">
            첫 번째 현장을 만들어{'\n'}기록 관리를 시작해보세요
          </Text>
        </VStack>
        <Button 
          bg="$blue600"
          size="lg"
          onPress={handleCreateField}
          borderRadius="$xl"
          px="$6"
        >
          <ButtonIcon as={Plus} mr="$2" />
          <ButtonText fontWeight="$bold">첫 현장 만들기</ButtonText>
        </Button>
      </VStack>
    </Center>
  );

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
            현장 관리
          </Heading>
          <Pressable
            onPress={handleCreateField}
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
            placeholder="현장 검색..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            fontSize="$md"
            pl="$2"
          />
        </Input>

        {/* 통계 */}
        {fields.length > 0 && (
          <HStack justifyContent="space-around" alignItems="center" mt="$4">
            <VStack alignItems="center">
              <Text size="2xl" fontWeight="$bold" color="$white">{fields.length}</Text>
              <Text size="sm" color="$blue100">전체 현장</Text>
            </VStack>
            <Box w="$px" h="$12" bg="rgba(255, 255, 255, 0.3)" />
            <VStack alignItems="center">
              <Text size="2xl" fontWeight="$bold" color="$white">{filteredFields.length}</Text>
              <Text size="sm" color="$blue100">검색 결과</Text>
            </VStack>
          </HStack>
        )}
      </Box>

      {/* 현장 목록 */}
      <Box flex={1} px="$4" pt="$4">
        {isLoading ? (
          <Center flex={1}>
            <Spinner size="large" color="$blue600" />
            <Text mt="$3" color="$gray600" size="md">로딩 중...</Text>
          </Center>
        ) : filteredFields.length > 0 ? (
          <FlatList
            data={filteredFields}
            renderItem={renderFieldItem}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        ) : (
          renderEmptyState()
        )}
      </Box>
      
      {/* 하단 네비게이션 */}
      <BottomNavigation navigation={navigation} currentScreen="FieldList" />
    </SafeAreaView>
  );
};

export default FieldListScreen;
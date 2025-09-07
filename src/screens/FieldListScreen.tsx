import React, { useState, useEffect } from 'react';
import { Alert, RefreshControl, FlatList, StatusBar } from 'react-native';
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
  SafeAreaView,
  ButtonText,
  ButtonIcon,
  Fab,
  FabIcon,
  Divider,
  Center,
  Spinner
} from '@gluestack-ui/themed';
import { ArrowLeft, Plus, Trash2, Search, MoreVertical, Building } from 'lucide-react-native';
import { currentFieldApi, Field } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TokenService } from '../services/tokenService';

interface FieldListScreenProps {
  navigation: any;
}

const FieldListScreen: React.FC<FieldListScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [filteredFields, setFilteredFields] = useState<Field[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated'>('name');

  useEffect(() => {
    loadFields();
  }, []);

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
    // 현장 상세 화면으로 이동 (추후 구현)
    Alert.alert('현장 선택', `${field.name} 현장을 선택했습니다.`);
  };

  const handleFieldOptions = (field: Field) => {
    Alert.alert(
      '현장 관리',
      `${field.name} 현장을 어떻게 하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { text: '편집', onPress: () => handleEditField(field) },
        { text: '삭제', style: 'destructive', onPress: () => handleDeleteField(field) }
      ]
    );
  };

  const handleEditField = (field: Field) => {
    // 편집 화면으로 이동 (추후 구현)
    Alert.alert('알림', '현장 편집 기능은 준비 중입니다.');
  };

  const handleDeleteField = async (field: Field) => {
    Alert.alert(
      '현장 삭제',
      `정말 "${field.name}" 현장을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const accessToken = await TokenService.getAccessToken();
              if (!accessToken) {
                Alert.alert('오류', '접근권한이 없습니다.');
                return;
              }

              const response = await currentFieldApi.deleteField(field.id, accessToken);
              if (response.success) {
                Alert.alert('성공', '현장이 삭제되었습니다.');
                loadFields(); // 목록 새로고침
              } else {
                Alert.alert('오류', response.message || '현장 삭제에 실패했습니다.');
              }
            } catch (error) {
              console.error('현장 삭제 오류:', error);
              Alert.alert('오류', '현장 삭제 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  const handleCreateField = () => {
    navigation.navigate('CreateField');
  };

  const getFieldStats = (field: Field) => {
    // 추후 실제 통계로 교체
    return `${Math.floor(Math.random() * 20)} 기록`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderFieldItem = ({ item }: { item: Field }) => (
    <Pressable onPress={() => handleFieldPress(item)} mb="$3">
      <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8}>
        <VStack space="sm">
          <HStack justifyContent="space-between" alignItems="center">
            <VStack space="xs" flex={1}>
              <HStack alignItems="center" space="sm">
                <Box w="$4" h="$4" borderRadius="$full" bg={item.color} />
                <Heading size="md" color="$gray900">{item.name}</Heading>
              </HStack>
              {item.description && (
                <Text size="sm" color="$gray600" numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              <HStack justifyContent="space-between" alignItems="center">
                <Badge bg="$blue100" borderRadius="$sm">
                  <Text size="xs" color="$blue700">
                    {getFieldStats(item)}
                  </Text>
                </Badge>
                <Text size="xs" color="$gray500">
                  생성: {formatDate(item.created_at)}
                </Text>
              </HStack>
            </VStack>
            
            <Button 
              variant="ghost" 
              size="sm"
              onPress={(e) => {
                e.stopPropagation();
                handleFieldOptions(item);
              }}
            >
              <ButtonIcon as={MoreVertical} />
            </Button>
          </HStack>
        </VStack>
      </Card>
    </Pressable>
  );

  const renderEmptyState = () => (
    <Center flex={1} p="$8">
      <VStack alignItems="center" space="lg">
        <Box w="$20" h="$20" bg="$gray100" borderRadius="$full" alignItems="center" justifyContent="center">
          <Building size={40} color="#9ca3af" />
        </Box>
        <VStack alignItems="center" space="sm">
          <Heading size="lg" color="$gray900">현장이 없습니다</Heading>
          <Text size="sm" color="$gray600" textAlign="center">
            첫 번째 현장을 만들어 기록 관리를 시작해보세요
          </Text>
        </VStack>
        <Button 
          action="primary"
          onPress={handleCreateField}
        >
          <ButtonIcon as={Plus} />
          <ButtonText>첫 현장 만들기</ButtonText>
        </Button>
      </VStack>
    </Center>
  );

  return (
    <SafeAreaView flex={1} bg="$coolGray50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={false} />
      {/* 헤더 */}
      <Box bg="white" px="$4" py="$3" shadowOpacity={0.1} shadowRadius={4} shadowOffset={{ width: 0, height: 2 }}>
        <HStack justifyContent="space-between" alignItems="center">
          <HStack alignItems="center" space="sm">
            <Button variant="ghost" size="sm" onPress={() => navigation.goBack()}>
              <ButtonIcon as={ArrowLeft} />
            </Button>
            <Heading size="xl" color="$gray900">현장 관리</Heading>
          </HStack>
        </HStack>
      </Box>

      {/* 검색바 */}
      <Box px="$4" py="$3" bg="white">
        <Input>
          <ButtonIcon as={Search} ml="$3" color="$gray400" />
          <InputField
            placeholder="현장 이름이나 설명으로 검색..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </Input>
      </Box>

      {/* 통계 */}
      {fields.length > 0 && (
        <Box bg="white" px="$4" py="$3" mb="$1">
          <HStack justifyContent="space-around" alignItems="center">
            <VStack alignItems="center">
              <Text size="2xl" fontWeight="bold" color="$primary600">{fields.length}</Text>
              <Text size="xs" color="$gray600">전체 현장</Text>
            </VStack>
            <Divider orientation="vertical" h="$10" />
            <VStack alignItems="center">
              <Text size="2xl" fontWeight="bold" color="$green600">{filteredFields.length}</Text>
              <Text size="xs" color="$gray600">검색 결과</Text>
            </VStack>
          </HStack>
        </Box>
      )}

      {/* 현장 목록 */}
      <Box flex={1} px="$4">
        {isLoading ? (
          <Center flex={1}>
            <Spinner size="large" color="$primary600" />
          </Center>
        ) : filteredFields.length > 0 ? (
          <FlatList
            data={filteredFields}
            renderItem={renderFieldItem}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        ) : (
          renderEmptyState()
        )}
      </Box>

      {/* FAB */}
      <Fab
        size="lg"
        placement="bottom right"
        onPress={handleCreateField}
        bg="$primary600"
        mb="$20"
        mr="$4"
      >
        <FabIcon as={Plus} color="white" />
      </Fab>
    </SafeAreaView>
  );
};

export default FieldListScreen;
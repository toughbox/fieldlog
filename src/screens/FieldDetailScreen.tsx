import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
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
  ArrowLeft, 
  Building, 
  Plus, 
  Edit, 
  Trash2,
  Calendar,
  Tag,
  FileText
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { currentRecordApi, currentFieldApi } from '../services/api';
import { TokenService } from '../services/tokenService';
import BottomNavigation from '../components/BottomNavigation';

interface FieldDetailScreenProps {
  navigation: any;
  route: {
    params: {
      fieldId: number;
      field: any;
    };
  };
}

interface Record {
  id: number;
  title: string;
  status: string;
  priority: number;
  due_date?: string;
  created_at: string;
  tags: string[];
}

const FieldDetailScreen: React.FC<FieldDetailScreenProps> = ({ navigation, route }) => {
  const { fieldId, field } = route.params;
  const { user } = useAuth();
  const [records, setRecords] = useState<Record[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 화면 포커스시 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [])
  );

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setIsLoading(true);
      const accessToken = await TokenService.getAccessToken();
      if (!accessToken) return;

      const response = await currentRecordApi.getRecords(accessToken, {
        field_id: fieldId,
        page: 1,
        limit: 1000
      });

      if (response.success) {
        setRecords(response.data.records);
      }
    } catch (error) {
      console.error('기록 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRecord = () => {
    navigation.navigate('CreateRecord', { preselectedFieldId: fieldId });
  };

  const handleRecordPress = (record: Record) => {
    navigation.navigate('RecordDetail', { recordId: record.id });
  };

  const handleEditField = () => {
    navigation.navigate('EditField', { 
      fieldId: fieldId, 
      field: field 
    });
  };

  const handleDeleteField = () => {
    Alert.alert(
      '현장 삭제',
      `${field.name} 현장을 삭제하시겠습니까?\n\n이 현장의 모든 기록도 함께 삭제됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const accessToken = await TokenService.getAccessToken();
              if (!accessToken) return;

              const response = await currentFieldApi.deleteField(fieldId, accessToken);
              if (response.success) {
                Alert.alert('성공', '현장이 삭제되었습니다.', [
                  { text: '확인', onPress: () => navigation.navigate('FieldList') }
                ]);
              } else {
                Alert.alert('오류', response.error || '현장 삭제에 실패했습니다.');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '$yellow500';
      case 'in_progress': return '$blue500';
      case 'completed': return '$green500';
      case 'cancelled': return '$red500';
      default: return '$gray500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기';
      case 'in_progress': return '진행중';
      case 'completed': return '완료';
      case 'cancelled': return '취소';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return '낮음';
      case 2: return '보통';
      case 3: return '긴급';
      default: return '낮음';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return '#10B981'; // 낮음 - 초록색
      case 2: return '#3B82F6'; // 보통 - 파란색
      case 3: return '#EF4444'; // 긴급 - 빨간색
      default: return '#6B7280'; // 기본값 - 회색
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderRecordItem = ({ item }: { item: Record }) => (
    <Pressable onPress={() => handleRecordPress(item)}>
      <Card 
        bg="white" 
        p="$4" 
        borderRadius="$xl"
        borderWidth={1}
        borderColor="$gray200"
      >
        <VStack space="sm">
          <HStack justifyContent="space-between" alignItems="center">
            <Heading size="md" color="$gray900" flex={1} numberOfLines={1}>
              {item.title}
            </Heading>
            <Badge bg={getStatusColor(item.status)} borderRadius="$sm">
              <Text size="xs" color="white">
                {getStatusText(item.status)}
              </Text>
            </Badge>
          </HStack>

          <HStack justifyContent="space-between" alignItems="center">
            <HStack space="sm">
              <Badge bg={getPriorityColor(item.priority)} borderRadius="$sm">
                <Text size="xs" color="white">
                  {getPriorityLabel(item.priority)}
                </Text>
              </Badge>
              {item.due_date && (
                <HStack alignItems="center" space="xs">
                  <Calendar size={12} color="#6b7280" />
                  <Text size="xs" color="$gray500">
                    {formatDate(item.due_date)}
                  </Text>
                </HStack>
              )}
            </HStack>
            <Text size="xs" color="$gray500">
              {formatDate(item.created_at)}
            </Text>
          </HStack>

          {item.tags && item.tags.length > 0 && (
            <HStack space="xs" flexWrap="wrap">
              {item.tags.map((tag) => (
                <Badge key={tag} bg="$gray100" borderRadius="$sm">
                  <Text size="xs" color="$gray600">
                    {tag}
                  </Text>
                </Badge>
              ))}
            </HStack>
          )}
        </VStack>
      </Card>
    </Pressable>
  );

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
          <FileText size={48} color="#2563eb" strokeWidth={2} />
        </Box>
        <VStack alignItems="center" space="sm">
          <Heading size="xl" color="$gray900" fontWeight="$bold">
            기록이 없습니다
          </Heading>
          <Text size="md" color="$gray600" textAlign="center" lineHeight="$lg">
            이 현장의 첫 번째 기록을{'\n'}작성해보세요
          </Text>
        </VStack>
        <Button 
          bg="$blue600"
          size="lg"
          borderRadius="$xl"
          onPress={handleCreateRecord}
          px="$6"
        >
          <ButtonIcon as={Plus} mr="$2" />
          <ButtonText fontWeight="$bold">기록 작성</ButtonText>
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
        <HStack justifyContent="space-between" alignItems="center">
          <HStack alignItems="center" space="md" flex={1}>
            <Pressable
              onPress={() => navigation.navigate('FieldList')}
              w="$10"
              h="$10"
              borderRadius="$full"
              bg="rgba(255, 255, 255, 0.2)"
              alignItems="center"
              justifyContent="center"
            >
              <ArrowLeft size={20} color="#ffffff" strokeWidth={2.5} />
            </Pressable>
            <VStack flex={1}>
              <Heading size="xl" color="$white" fontWeight="$bold">{field.name}</Heading>
              <Text size="sm" color="$blue100">현장 상세</Text>
            </VStack>
          </HStack>
          <HStack space="sm">
            <Pressable
              onPress={handleEditField}
              w="$10"
              h="$10"
              borderRadius="$full"
              bg="rgba(255, 255, 255, 0.2)"
              alignItems="center"
              justifyContent="center"
            >
              <Edit size={18} color="#ffffff" strokeWidth={2.5} />
            </Pressable>
            <Pressable
              onPress={handleDeleteField}
              w="$10"
              h="$10"
              borderRadius="$full"
              bg="rgba(239, 68, 68, 0.2)"
              alignItems="center"
              justifyContent="center"
            >
              <Trash2 size={18} color="#ffffff" strokeWidth={2.5} />
            </Pressable>
          </HStack>
        </HStack>
      </Box>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <VStack space="lg">
        {/* 현장 정보 */}
        <Card 
          bg="white" 
          p="$5" 
          borderRadius="$xl"
          borderWidth={1}
          borderColor="$gray200"
        >
          <VStack space="md">
            <HStack alignItems="center" space="sm">
              <Box w="$6" h="$6" borderRadius="$full" bg={field.color} />
              <VStack flex={1}>
                <Heading size="lg" color="$gray900">{field.name}</Heading>
                {field.description && (
                  <Text size="sm" color="$gray600">{field.description}</Text>
                )}
              </VStack>
            </HStack>
            
            <Divider />
            
            <HStack justifyContent="space-between" alignItems="center">
              <VStack alignItems="center">
                <Text size="lg" fontWeight="bold" color="$gray900">{records.length}</Text>
                <Text size="sm" color="$gray600">총 기록</Text>
              </VStack>
              <VStack alignItems="center">
                <Text size="lg" fontWeight="bold" color="$green500">
                  {records.filter(r => r.status === 'completed').length}
                </Text>
                <Text size="sm" color="$gray600">완료</Text>
              </VStack>
              <VStack alignItems="center">
                <Text size="lg" fontWeight="bold" color="$blue500">
                  {records.filter(r => r.status === 'in_progress').length}
                </Text>
                <Text size="sm" color="$gray600">진행중</Text>
              </VStack>
              <VStack alignItems="center">
                <Text size="lg" fontWeight="bold" color="$yellow500">
                  {records.filter(r => r.status === 'pending').length}
                </Text>
                <Text size="sm" color="$gray600">대기</Text>
              </VStack>
            </HStack>
          </VStack>
        </Card>

        {/* 액션 버튼 */}
        <Button 
          bg="$blue600" 
          size="xl" 
          borderRadius="$xl"
          onPress={handleCreateRecord}
        >
          <ButtonIcon as={Plus} mr="$2" />
          <ButtonText fontWeight="$bold">새 기록 작성</ButtonText>
        </Button>

        {/* 기록 목록 */}
        {records.length > 0 ? (
          <VStack space="md">
            <Heading size="xl" color="$gray900" fontWeight="$bold">기록 목록</Heading>
            {records.map((record) => (
              <Box key={record.id}>
                {renderRecordItem({ item: record })}
              </Box>
            ))}
          </VStack>
        ) : (
          renderEmptyState()
        )}
        </VStack>
      </ScrollView>
      
      {/* 하단 네비게이션 */}
      <BottomNavigation navigation={navigation} currentScreen="FieldDetail" />
    </SafeAreaView>
  );
};

export default FieldDetailScreen;

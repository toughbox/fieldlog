import React, { useState, useEffect, useCallback } from 'react';
import { Alert, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  Heading,
  Pressable,
  ButtonText,
  ButtonIcon,
  Badge,
  Divider,
  Spinner,
  Center,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter
} from '@gluestack-ui/themed';
import { 
  ArrowLeft, 
  Edit3, 
  MoreVertical, 
  Calendar, 
  MapPin, 
  Tag, 
  Clock,
  AlertCircle, 
  CheckCircle2, 
  X,
  Share,
  Trash2
} from 'lucide-react-native';
import ImageSlider from '../components/ImageSlider';
import { currentRecordApi, FieldRecord } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { TokenService } from '../services/tokenService';
import BottomNavigation from '../components/BottomNavigation';

interface RecordDetailScreenProps {
  navigation: any;
  route: any;
}

const STATUS_CONFIG = {
  pending: { label: '대기', color: '#F59E0B', bgColor: '#FEF3C7', icon: Clock },
  in_progress: { label: '진행중', color: '#3B82F6', bgColor: '#DBEAFE', icon: AlertCircle },
  completed: { label: '완료', color: '#10B981', bgColor: '#D1FAE5', icon: CheckCircle2 },
  cancelled: { label: '취소', color: '#EF4444', bgColor: '#FEE2E2', icon: X }
};

const PRIORITY_CONFIG = {
  1: { label: '낮음', color: '#10B981', bgColor: '#D1FAE5' },
  2: { label: '보통', color: '#3B82F6', bgColor: '#DBEAFE' },
  3: { label: '긴급', color: '#EF4444', bgColor: '#FEE2E2' }
};

const RecordDetailScreen: React.FC<RecordDetailScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { recordId } = route.params;

  const [record, setRecord] = useState<FieldRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // 화면 포커스시 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      loadRecord();
    }, [recordId])
  );

  const loadRecord = async () => {
    try {
      setIsLoading(true);
      const accessToken = await TokenService.getAccessToken();
      if (!accessToken) {
        Alert.alert('오류', '접근권한이 없습니다.');
        return;
      }

      const response = await currentRecordApi.getRecord(recordId, accessToken);
      
      if (response.success && response.data) {
        setRecord(response.data);
      } else {
        Alert.alert('오류', response.error || '기록을 불러올 수 없습니다.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('기록 상세 조회 오류:', error);
      Alert.alert('오류', '기록을 불러오는 중 오류가 발생했습니다.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!record || record.status === 'completed') return;

    try {
      setIsCompleting(true);
      const accessToken = await TokenService.getAccessToken();
      if (!accessToken) {
        Alert.alert('오류', '접근권한이 없습니다.');
        return;
      }

      const response = await currentRecordApi.updateRecord(record.id, {
        status: 'completed'
      }, accessToken);
      
      if (response.success) {
        // 로컬 상태 업데이트
        setRecord(prev => prev ? { ...prev, status: 'completed', completed_at: new Date().toISOString() } : null);
        Alert.alert('완료', '기록이 완료 처리되었습니다.');
      } else {
        Alert.alert('오류', response.error || '완료 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('완료 처리 오류:', error);
      Alert.alert('오류', '완료 처리 중 오류가 발생했습니다.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDelete = async () => {
    if (!record) return;

    try {
      setIsDeleting(true);
      const accessToken = await TokenService.getAccessToken();
      if (!accessToken) {
        Alert.alert('오류', '접근권한이 없습니다.');
        return;
      }

      const response = await currentRecordApi.deleteRecord(record.id, accessToken);
      
      if (response.success) {
        Alert.alert('성공', '기록이 삭제되었습니다.', [
          { text: '확인', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('오류', response.error || '기록 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('기록 삭제 오류:', error);
      Alert.alert('오류', '기록 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
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


  const renderCustomField = (key: string, value: any, index: number, isLast: boolean, fieldSchema: any) => {
    if (!value && value !== 0) return null;

    const fieldDef = fieldSchema?.fields?.find((f: any) => f.key === key);
    const label = fieldDef?.label || key;

    return (
      <VStack key={key} space="xs">
        <HStack space="sm" alignItems="flex-start" flexWrap="wrap">
          <Text size="sm" color="$gray600" fontWeight="500">
            {label}:
          </Text>
          <Text size="sm" color="$gray900" fontWeight="600" flex={1} flexShrink={1}>
            {value.toString()}
          </Text>
        </HStack>
        {!isLast && (
          <Divider bg="$gray200" opacity={0.5} />
        )}
      </VStack>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <StatusBar barStyle="dark-content" backgroundColor="white" translucent={false} />
        <Center flex={1}>
          <Spinner size="large" />
          <Text mt="$2" color="$gray600">기록을 불러오는 중...</Text>
        </Center>
      </SafeAreaView>
    );
  }

  if (!record) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <StatusBar barStyle="dark-content" backgroundColor="white" translucent={false} />
        <Center flex={1}>
          <Text color="$gray600">기록을 찾을 수 없습니다.</Text>
          <Button mt="$4" onPress={() => navigation.goBack()}>
            <ButtonText>돌아가기</ButtonText>
          </Button>
        </Center>
      </SafeAreaView>
    );
  }

  const statusConfig = STATUS_CONFIG[record.status];
  const priorityConfig = PRIORITY_CONFIG[record.priority as keyof typeof PRIORITY_CONFIG];
  const StatusIcon = statusConfig.icon;
  const overdue = isOverdue(record);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <StatusBar barStyle="dark-content" backgroundColor="white" translucent={false} />
      
      {/* 헤더 */}
      <Box bg="white" px="$4" py="$3" shadowOpacity={0.1} shadowRadius={4} shadowOffset={{ width: 0, height: 2 }}>
        <HStack justifyContent="space-between" alignItems="center">
          <HStack alignItems="center" space="sm" flex={1}>
            <Button variant="link" size="sm" onPress={() => navigation.goBack()}>
              <ButtonIcon as={ArrowLeft} />
            </Button>
            <Heading size="lg" color="$gray900" flex={1} numberOfLines={1}>
              기록 상세
            </Heading>
          </HStack>
          <HStack space="sm">
            <Button 
              variant="outline" 
              size="sm" 
              onPress={() => navigation.navigate('EditRecord', { recordId: record.id })}
            >
              <ButtonIcon as={Edit3} />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onPress={() => setShowDeleteModal(true)}
            >
              <ButtonIcon as={Trash2} color="$red500" />
            </Button>
          </HStack>
        </HStack>
      </Box>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <VStack space="md">
          {/* 기본 정보 카드 */}
          <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8}>
            <VStack space="md">
              {/* 현장 정보 */}
              <HStack alignItems="center" space="sm">
                <Box 
                  w="$4" 
                  h="$4" 
                  bg={record.field_color || '#6366F1'} 
                  borderRadius="$sm" 
                />
                <Text color="$gray600" size="sm">
                  {record.field_name || '알 수 없는 현장'}
                </Text>
              </HStack>

              {/* 제목 */}
              <Heading size="xl" color="$gray900">{record.title}</Heading>

              {/* 상태 및 우선순위 */}
              <HStack justifyContent="space-between" alignItems="center">
                <HStack space="sm" flexWrap="wrap" flex={1}>
                  <HStack 
                    alignItems="center" 
                    space="xs" 
                    bg={statusConfig.bgColor} 
                    px="$3" 
                    py="$1" 
                    borderRadius="$md"
                  >
                    <StatusIcon size={16} color={statusConfig.color} />
                    <Text size="sm" color={statusConfig.color} fontWeight="500">
                      {statusConfig.label}
                    </Text>
                  </HStack>

                  <Badge 
                    variant="solid" 
                    bg={priorityConfig.color}
                  >
                    <Text color="white" size="sm">{priorityConfig.label}</Text>
                  </Badge>

                  {overdue && (
                    <Badge variant="solid" bg="$red500">
                      <Text color="white" size="sm">지연</Text>
                    </Badge>
                  )}
                </HStack>

                {/* 완료 버튼 */}
                {record.status !== 'completed' && record.status !== 'cancelled' && (
                  <Button
                    size="sm"
                    action="primary"
                    bg="$red500"
                    onPress={handleComplete}
                    isDisabled={isCompleting}
                    ml="$2"
                  >
                    {isCompleting ? (
                      <Spinner color="white" size="small" />
                    ) : (
                      <>
                        <ButtonText size="sm">완료 처리</ButtonText>
                      </>
                    )}
                  </Button>
                )}
              </HStack>

              {/* 설명 */}
              {record.description && (
                <>
                  <Divider />
                  <VStack space="xs">
                    <Text size="sm" color="$gray600" fontWeight="500">설명</Text>
                    <Text color="$gray900">{record.description}</Text>
                  </VStack>
                </>
              )}
            </VStack>
          </Card>

          {/* 일정 정보 */}
          <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8}>
            <VStack space="sm">
              <HStack alignItems="center" space="sm">
                <Calendar size={20} color="#6366f1" />
                <Heading size="lg" color="$gray900">일정 정보</Heading>
              </HStack>

              <VStack space="xs">
                <HStack justifyContent="space-between" alignItems="center">
                  <Text color="$gray600" size="sm">생성일</Text>
                  <Text color="$gray900">{formatDate(record.created_at)}</Text>
                </HStack>

                {record.due_date && (
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text color="$gray600" size="sm">마감일</Text>
                    <Text color={overdue ? "$red600" : "$gray900"}>
                      {formatDate(record.due_date)}
                    </Text>
                  </HStack>
                )}

                {record.completed_at && (
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text color="$gray600" size="sm">완료일</Text>
                    <Text color="$green600">{formatDate(record.completed_at)}</Text>
                  </HStack>
                )}

                <HStack justifyContent="space-between" alignItems="center">
                  <Text color="$gray600" size="sm">최종 수정</Text>
                  <Text color="$gray900">{formatDate(record.updated_at)}</Text>
                </HStack>
              </VStack>
            </VStack>
          </Card>

          {/* 사용자 정의 필드 */}
          {record.custom_data && Object.keys(record.custom_data).length > 0 && (
            <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8}>
              <VStack space="md">
                <HStack alignItems="center" space="sm">
                  <Tag size={20} color="#6366f1" />
                  <Heading size="lg" color="$gray900">상세 정보</Heading>
                </HStack>

                <VStack space="sm">
                  {Object.entries(record.custom_data).map(([key, value], index, array) => (
                    <Box key={key}>
                      {renderCustomField(key, value, index, index === array.length - 1, record.field_schema)}
                    </Box>
                  ))}
                </VStack>
              </VStack>
            </Card>
          )}

          {/* 위치 정보 */}
          {record.location && (
            <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8}>
              <VStack space="md">
                <HStack alignItems="center" space="sm">
                  <MapPin size={20} color="#6366f1" />
                  <Heading size="lg" color="$gray900">위치 정보</Heading>
                </HStack>

                <VStack space="sm">
                  {record.location.address && (
                    <HStack justifyContent="space-between" alignItems="center">
                      <Text color="$gray600" size="sm">주소</Text>
                      <Text color="$gray900" flex={1} textAlign="right">
                        {record.location.address}
                      </Text>
                    </HStack>
                  )}
                  
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text color="$gray600" size="sm">좌표</Text>
                    <Text color="$gray900">
                      {record.location.latitude.toFixed(6)}, {record.location.longitude.toFixed(6)}
                    </Text>
                  </HStack>
                </VStack>
              </VStack>
            </Card>
          )}

          {/* 첨부 이미지 슬라이드 */}
          {record.attachment && record.attachment.length > 0 && (
            <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8}>
              <ImageSlider attachments={record.attachment} />
            </Card>
          )}

          {/* 태그 */}
          {record.tags && record.tags.length > 0 && (
            <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8}>
              <VStack space="md">
                <HStack alignItems="center" space="sm">
                  <Tag size={20} color="#6366f1" />
                  <Heading size="lg" color="$gray900">태그</Heading>
                </HStack>

                <HStack space="xs" flexWrap="wrap">
                  {record.tags.map((tag) => (
                    <Badge key={tag} variant="outline" mb="$1">
                      <Text size="sm">{tag}</Text>
                    </Badge>
                  ))}
                </HStack>
              </VStack>
            </Card>
          )}

          {/* 하단 여백 */}
          <Box h="$10" />
        </VStack>
      </ScrollView>

      {/* 삭제 확인 모달 */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Heading size="md">기록 삭제</Heading>
            <ModalCloseButton>
              <ButtonIcon as={X} />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <Text>이 기록을 삭제하시겠습니까?</Text>
            <Text color="$gray600" size="sm" mt="$2">
              삭제된 기록은 복구할 수 없습니다.
            </Text>
          </ModalBody>
          <ModalFooter>
            <HStack space="sm">
              <Button
                variant="outline"
                action="secondary"
                onPress={() => setShowDeleteModal(false)}
                flex={1}
              >
                <ButtonText>취소</ButtonText>
              </Button>
              <Button
                action="negative"
                onPress={handleDelete}
                isDisabled={isDeleting}
                flex={1}
              >
                {isDeleting ? (
                  <Spinner color="white" size="small" />
                ) : (
                  <ButtonText>삭제</ButtonText>
                )}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* 하단 네비게이션 */}
      <BottomNavigation navigation={navigation} />
    </SafeAreaView>
  );
};

export default RecordDetailScreen;

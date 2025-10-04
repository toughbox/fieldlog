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
  // 완료 확인 모달 상태
  const [showCompleteModal, setShowCompleteModal] = useState(false);

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

    // 완료 확인 모달 열기
    setShowCompleteModal(true);
  };

  const confirmComplete = async () => {
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
      setShowCompleteModal(false);
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
        <Center flex={1}>
          <Spinner size="large" color="$blue600" />
          <Text mt="$3" color="$gray600" size="md" fontWeight="$medium">기록을 불러오는 중...</Text>
        </Center>
      </SafeAreaView>
    );
  }

  if (!record) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
        <Center flex={1}>
          <Box 
            w="$24" 
            h="$24" 
            bg="$gray100" 
            borderRadius="$full" 
            alignItems="center" 
            justifyContent="center"
            mb="$4"
          >
            <AlertCircle size={48} color="#6b7280" />
          </Box>
          <Text color="$gray900" size="lg" fontWeight="$bold" mb="$2">기록을 찾을 수 없습니다</Text>
          <Text color="$gray600" mb="$6">요청하신 기록이 존재하지 않습니다</Text>
          <Button 
            bg="$blue600" 
            size="lg"
            borderRadius="$xl"
            onPress={() => navigation.goBack()}
          >
            <ButtonText fontWeight="$bold">돌아가기</ButtonText>
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
              onPress={() => navigation.goBack()}
              p="$2"
              borderRadius="$full"
              bg="rgba(255, 255, 255, 0.2)"
            >
              <ArrowLeft size={20} color="#ffffff" strokeWidth={2.5} />
            </Pressable>
            <Heading size="xl" color="$white" fontWeight="$bold" flex={1} numberOfLines={1}>
              기록 상세
            </Heading>
          </HStack>
          <HStack space="sm">
            <Pressable
              onPress={() => navigation.navigate('EditRecord', { recordId: record.id })}
              p="$2"
              borderRadius="$full"
              bg="rgba(255, 255, 255, 0.2)"
            >
              <Edit3 size={18} color="#ffffff" strokeWidth={2.5} />
            </Pressable>
            <Pressable
              onPress={() => setShowDeleteModal(true)}
              p="$2"
              borderRadius="$full"
              bg="rgba(239, 68, 68, 0.2)"
            >
              <Trash2 size={18} color="#ffffff" strokeWidth={2.5} />
            </Pressable>
          </HStack>
        </HStack>
      </Box>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <VStack space="lg">
          {/* 기본 정보 카드 */}
          <Card 
            bg="white" 
            p="$5" 
            borderRadius="$xl"
            borderWidth={1}
            borderColor="$gray200"
          >
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

                {/* 완료 버튼 제거 */}
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
          <Card 
            bg="white" 
            p="$5" 
            borderRadius="$xl"
            borderWidth={1}
            borderColor="$gray200"
          >
            <VStack space="lg">
              <HStack alignItems="center" space="sm">
                <Box
                  w="$10"
                  h="$10"
                  bg="$blue50"
                  borderRadius="$lg"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Calendar size={22} color="#2563eb" strokeWidth={2} />
                </Box>
                <Heading size="xl" color="$gray900" fontWeight="$bold">일정 정보</Heading>
              </HStack>

              <VStack space="sm">
                <VStack space="xs">
                  <HStack space="sm" alignItems="flex-start" flexWrap="wrap">
                    <Text size="sm" color="$gray600" fontWeight="500">
                      생성일:
                    </Text>
                    <Text size="sm" color="$gray900" fontWeight="600" flex={1} flexShrink={1}>
                      {formatDate(record.created_at)}
                    </Text>
                  </HStack>
                  <Divider bg="$gray200" opacity={0.5} />
                </VStack>

                {record.due_date && (
                  <VStack space="xs">
                    <HStack space="sm" alignItems="flex-start" flexWrap="wrap">
                      <Text size="sm" color="$gray600" fontWeight="500">
                        마감일:
                      </Text>
                      <Text size="sm" color={overdue ? "$red600" : "$gray900"} fontWeight="600" flex={1} flexShrink={1}>
                        {formatDate(record.due_date)}
                      </Text>
                    </HStack>
                    <Divider bg="$gray200" opacity={0.5} />
                  </VStack>
                )}

                {record.completed_at && (
                  <VStack space="xs">
                    <HStack space="sm" alignItems="flex-start" flexWrap="wrap">
                      <Text size="sm" color="$gray600" fontWeight="500">
                        완료일:
                      </Text>
                      <Text size="sm" color="$green600" fontWeight="600" flex={1} flexShrink={1}>
                        {formatDate(record.completed_at)}
                      </Text>
                    </HStack>
                  </VStack>
                )}
              </VStack>
            </VStack>
          </Card>

          {/* 사용자 정의 필드 */}
          {record.custom_data && Object.keys(record.custom_data).length > 0 && (
            <Card 
              bg="white" 
              p="$5" 
              borderRadius="$xl"
              borderWidth={1}
              borderColor="$gray200"
            >
              <VStack space="lg">
                <HStack alignItems="center" space="sm">
                  <Box
                    w="$10"
                    h="$10"
                    bg="$blue50"
                    borderRadius="$lg"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Tag size={22} color="#2563eb" strokeWidth={2} />
                  </Box>
                  <Heading size="xl" color="$gray900" fontWeight="$bold">상세 정보</Heading>
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

          {/* 완료 처리 버튼 */}
          {record.status !== 'completed' && record.status !== 'cancelled' && (
            <Button
              bg="$green600"
              onPress={handleComplete}
              isDisabled={isCompleting}
              size="xl"
              borderRadius="$xl"
            >
              {isCompleting ? (
                <Spinner color="white" size="small" />
              ) : (
                <>
                  <ButtonIcon as={CheckCircle2} mr="$2" />
                  <ButtonText fontWeight="$bold">완료 처리</ButtonText>
                </>
              )}
            </Button>
          )}

          {/* 위치 정보 */}
          {record.location && (
            <Card 
              bg="white" 
              p="$5" 
              borderRadius="$xl"
              borderWidth={1}
              borderColor="$gray200"
            >
              <VStack space="lg">
                <HStack alignItems="center" space="sm">
                  <Box
                    w="$10"
                    h="$10"
                    bg="$blue50"
                    borderRadius="$lg"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <MapPin size={22} color="#2563eb" strokeWidth={2} />
                  </Box>
                  <Heading size="xl" color="$gray900" fontWeight="$bold">위치 정보</Heading>
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
            <Card 
              bg="white" 
              p="$5" 
              borderRadius="$xl"
              borderWidth={1}
              borderColor="$gray200"
            >
              <ImageSlider attachments={record.attachment} />
            </Card>
          )}

          {/* 태그 */}
          {record.tags && record.tags.length > 0 && (
            <Card 
              bg="white" 
              p="$5" 
              borderRadius="$xl"
              borderWidth={1}
              borderColor="$gray200"
            >
              <VStack space="lg">
                <HStack alignItems="center" space="sm">
                  <Box
                    w="$10"
                    h="$10"
                    bg="$blue50"
                    borderRadius="$lg"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Tag size={22} color="#2563eb" strokeWidth={2} />
                  </Box>
                  <Heading size="xl" color="$gray900" fontWeight="$bold">태그</Heading>
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
            <HStack space="md" width="100%" justifyContent="space-between">
              <Pressable
                onPress={() => setShowDeleteModal(false)}
                flex={1}
                py="$2"
                px="$3"
                borderRadius="$md"
                borderWidth={1}
                borderColor="$gray300"
                bg="$white"
                alignItems="center"
                justifyContent="center"
              >
                <Text color="$gray700" fontWeight="$medium" size="sm">취소</Text>
              </Pressable>
              <Pressable
                onPress={handleDelete}
                disabled={isDeleting}
                flex={1}
                py="$2"
                px="$3"
                borderRadius="$md"
                bg="$red600"
                alignItems="center"
                justifyContent="center"
                opacity={isDeleting ? 0.5 : 1}
              >
                {isDeleting ? (
                  <Spinner color="white" size="small" />
                ) : (
                  <Text color="$white" fontWeight="$bold" size="sm">삭제</Text>
                )}
              </Pressable>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* 완료 확인 모달 */}
      <Modal isOpen={showCompleteModal} onClose={() => setShowCompleteModal(false)}>
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Heading size="md">기록 완료</Heading>
            <ModalCloseButton>
              <ButtonIcon as={X} />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <Text>이 기록을 완료 처리하시겠습니까?</Text>
            <Text color="$gray600" size="sm" mt="$2">
              완료 처리된 기록은 상태를 변경할 수 없습니다.
            </Text>
          </ModalBody>
          <ModalFooter>
            <HStack space="md" width="100%" justifyContent="space-between">
              <Pressable
                onPress={() => setShowCompleteModal(false)}
                flex={1}
                py="$2"
                px="$3"
                borderRadius="$md"
                borderWidth={1}
                borderColor="$gray300"
                bg="$white"
                alignItems="center"
                justifyContent="center"
              >
                <Text color="$gray700" fontWeight="$medium" size="sm">취소</Text>
              </Pressable>
              <Pressable
                onPress={confirmComplete}
                disabled={isCompleting}
                flex={1}
                py="$2"
                px="$3"
                borderRadius="$md"
                bg="$green600"
                alignItems="center"
                justifyContent="center"
                opacity={isCompleting ? 0.5 : 1}
              >
                {isCompleting ? (
                  <Spinner color="white" size="small" />
                ) : (
                  <Text color="$white" fontWeight="$bold" size="sm">완료</Text>
                )}
              </Pressable>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* 하단 네비게이션 */}
      <BottomNavigation navigation={navigation} currentScreen="RecordDetail" />
    </SafeAreaView>
  );
};

export default RecordDetailScreen;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, ScrollView, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  Spinner,
  Textarea,
  TextareaInput,
  Center
} from '@gluestack-ui/themed';
import { ArrowLeft, Tag, Calendar, Save, ChevronDown, Check } from 'lucide-react-native';
import { currentRecordApi, currentFieldApi, UpdateRecordRequest, Field, FieldRecord } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { TokenService } from '../services/tokenService';
import ImagePickerComponent from '../components/ImagePicker';
import { UploadedImage } from '../services/imageService';
import BottomNavigation from '../components/BottomNavigation';

interface EditRecordScreenProps {
  navigation: any;
  route: any;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: '대기', color: '#F59E0B' },
  { value: 'in_progress', label: '진행중', color: '#3B82F6' },
  { value: 'completed', label: '완료', color: '#10B981' },
  { value: 'cancelled', label: '취소', color: '#EF4444' }
];

const PRIORITY_OPTIONS = [
  { value: 1, label: '1 (낮음)', color: '#10B981' },
  { value: 2, label: '2 (보통)', color: '#3B82F6' },
  { value: 3, label: '3 (긴급)', color: '#EF4444' }
];

const EditRecordScreen: React.FC<EditRecordScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { recordId } = route.params;
  const scrollViewRef = useRef<ScrollView>(null);

  // 기본 정보
  const [record, setRecord] = useState<FieldRecord | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed' | 'cancelled'>('pending');
  const [priority, setPriority] = useState<number>(1);
  const [dueDate, setDueDate] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);

  // 사용자 정의 필드 데이터
  const [customData, setCustomData] = useState<Record<string, any>>({});

  // 데이터
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
    loadInitialData();
    }, [recordId])
  );

  // 선택된 현장이 변경될 때 해당 현장 정보 로드
  useEffect(() => {
    if (selectedFieldId && fields.length > 0) {
      const field = fields.find(f => f.id === selectedFieldId);
      setSelectedField(field || null);
      
      // 현장 선택 시 맨 위로 스크롤 (초기 로딩이 아닌 경우에만)
      if (!isLoading && record) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }, 100);
      }
    }
  }, [selectedFieldId, fields, isLoading, record]);

  // 날짜 변경 처리 함수
  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (date) {
      setSelectedDate(date);
      // YYYY-MM-DD 형식으로 변환
      const formattedDate = date.toISOString().split('T')[0];
      setDueDate(formattedDate);
    }
  };

  // 날짜 포맷팅 함수
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '날짜 선택';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const accessToken = await TokenService.getAccessToken();
      if (!accessToken) {
        Alert.alert('오류', '접근권한이 없습니다.');
        return;
      }

      // 병렬로 데이터 로드
      const [recordResponse, fieldsResponse] = await Promise.all([
        currentRecordApi.getRecord(recordId, accessToken),
        currentFieldApi.getFields(accessToken)
      ]);

      if (recordResponse.success && recordResponse.data) {
        const recordData = recordResponse.data;
        setRecord(recordData);
        setSelectedFieldId(recordData.field_id);
        setTitle(recordData.title);
        setDescription(recordData.description || '');
        setStatus(recordData.status);
        setPriority(recordData.priority);
        const dueDateString = recordData.due_date ? recordData.due_date.split('T')[0] : '';
        setDueDate(dueDateString);
        if (dueDateString) {
          setSelectedDate(new Date(dueDateString));
        }
        setTags(recordData.tags || []);
        setCustomData(recordData.custom_data || {});
        
        // 기존 이미지 정보 로드
        if (recordData.attachment && Array.isArray(recordData.attachment)) {
          const imageAttachments = recordData.attachment
            .filter(att => att.type === 'image')
            .map(att => ({
              fileName: att.name,
              url: att.url,
              size: att.size || 0
            }));
          setImages(imageAttachments);
        }
      } else {
        Alert.alert('오류', recordResponse.error || '기록을 불러올 수 없습니다.');
        navigation.goBack();
        return;
      }

      if (fieldsResponse.success && fieldsResponse.data) {
        setFields(fieldsResponse.data);
      } else {
        Alert.alert('오류', fieldsResponse.error || '현장 목록을 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      Alert.alert('오류', '데이터를 불러오는 중 오류가 발생했습니다.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const updateCustomField = (key: string, value: any) => {
    setCustomData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    if (!record) return;

    if (!selectedFieldId) {
      Alert.alert('알림', '현장을 선택해주세요.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('알림', '제목을 입력해주세요.');
      return;
    }

    // 필수 사용자 정의 필드 검증
    if (selectedField) {
      const requiredFields = selectedField.field_schema.fields.filter(f => f.required);
      const missingField = requiredFields.find(field => 
        !customData[field.key] || customData[field.key].toString().trim() === ''
      );
      
      if (missingField) {
        Alert.alert('알림', `${missingField.label}은(는) 필수 입력 항목입니다.`);
        return;
      }
    }

    try {
      setIsSaving(true);
      
      const accessToken = await TokenService.getAccessToken();
      if (!accessToken) {
        Alert.alert('오류', '접근권한이 없습니다.');
        return;
      }

      const updateRequest: UpdateRecordRequest = {
        field_id: selectedFieldId,
        title: title.trim(),
        description: description.trim() || undefined,
        status: status,
        priority: priority,
        due_date: dueDate || undefined,
        custom_data: customData,
        attachment: images.map(img => ({
          type: 'image',
          url: img.url,
          name: img.fileName,
          size: img.size
        })),
        tags: tags
      };

      const response = await currentRecordApi.updateRecord(record.id, updateRequest, accessToken);
      
      if (response.success) {
        Alert.alert('성공', '현장 기록이 성공적으로 수정되었습니다.', [
          { text: '확인', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('오류', response.error || '현장 기록 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('현장 기록 수정 오류:', error);
      Alert.alert('오류', '현장 기록 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderCustomField = (fieldDef: any) => {
    const { key, label, type, required, options, placeholder } = fieldDef;
    const value = customData[key] || '';

    switch (type) {
      case 'text':
        return (
          <VStack key={key} space="xs">
            <Text size="sm" color="$gray600">
              {label} {required && <Text color="$red500">*</Text>}
            </Text>
            <Input>
              <InputField
                placeholder={placeholder || `${label}을(를) 입력하세요`}
                value={value}
                onChangeText={(text) => updateCustomField(key, text)}
              />
            </Input>
          </VStack>
        );

      case 'number':
        return (
          <VStack key={key} space="xs">
            <Text size="sm" color="$gray600">
              {label} {required && <Text color="$red500">*</Text>}
            </Text>
            <Input>
              <InputField
                placeholder={placeholder || `${label}을(를) 입력하세요`}
                value={value.toString()}
                onChangeText={(text) => updateCustomField(key, text)}
                keyboardType="numeric"
              />
            </Input>
          </VStack>
        );

      case 'select':
        return (
          <VStack key={key} space="xs">
            <Text size="sm" color="$gray600">
              {label} {required && <Text color="$red500">*</Text>}
            </Text>
            <Select
              selectedValue={value}
              onValueChange={(itemValue) => updateCustomField(key, itemValue)}
            >
              <SelectTrigger>
                <SelectInput placeholder={`${label} 선택`} />
                <SelectIcon />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  {options?.map((option: string) => (
                    <SelectItem key={option} label={option} value={option} />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          </VStack>
        );

      case 'textarea':
        return (
          <VStack key={key} space="xs">
            <Text size="sm" color="$gray600">
              {label} {required && <Text color="$red500">*</Text>}
            </Text>
            <Textarea>
              <TextareaInput
                placeholder={placeholder || `${label}을(를) 입력하세요`}
                value={value}
                onChangeText={(text) => updateCustomField(key, text)}
              />
            </Textarea>
          </VStack>
        );

      case 'checkbox':
        return (
          <VStack key={key} space="xs">
            <HStack alignItems="center" justifyContent="space-between" py="$2">
              <HStack alignItems="center" space="sm" flex={1}>
                <Text size="sm" color="$gray600">
                  {label} {required && <Text color="$red500">*</Text>}
                </Text>
              </HStack>
              <Pressable
                onPress={() => updateCustomField(key, value === 'true' || value === true ? 'false' : 'true')}
                p="$2"
              >
                <HStack 
                  alignItems="center" 
                  justifyContent="center"
                  w="$8" 
                  h="$8" 
                  borderRadius="$md" 
                  borderWidth={2}
                  borderColor={value === 'true' || value === true ? "$blue600" : "$gray400"}
                  bg={value === 'true' || value === true ? "$blue600" : "$white"}
                >
                  {(value === 'true' || value === true) && (
                    <Check size={20} color="#ffffff" strokeWidth={3} />
                  )}
                </HStack>
              </Pressable>
            </HStack>
          </VStack>
        );

      default:
        return null;
    }
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <StatusBar barStyle="dark-content" backgroundColor="white" translucent={false} />
      
      {/* 헤더 */}
      <Box bg="white" px="$4" py="$3" shadowOpacity={0.1} shadowRadius={4} shadowOffset={{ width: 0, height: 2 }}>
        <HStack justifyContent="space-between" alignItems="center">
          <HStack alignItems="center" space="sm">
            <Button variant="link" size="sm" onPress={() => navigation.goBack()}>
              <ButtonIcon as={ArrowLeft} />
            </Button>
            <Heading size="xl" color="$gray900">기록 수정</Heading>
          </HStack>
        </HStack>
      </Box>

      <ScrollView ref={scrollViewRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <VStack space="md">
          {/* 현장 선택 */}
          <Card 
            bg="white" 
            p="$5" 
            borderRadius="$xl"
            borderWidth={1}
            borderColor="$gray200"
          >
            <VStack space="lg">
              <Heading size="xl" color="$gray900" fontWeight="$bold">현장 선택</Heading>
              
              <Select
                selectedValue={selectedFieldId?.toString() || ''}
                onValueChange={(value) => setSelectedFieldId(value ? parseInt(value) : null)}
              >
                <SelectTrigger>
                  <SelectInput 
                    placeholder="현장 선택"
                    value={selectedField ? selectedField.name : ''}
                  />
                  <SelectIcon />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
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

              {selectedField && (
                <Box bg="$gray50" p="$3" borderRadius="$md">
                  <HStack alignItems="center" space="sm">
                    <Box 
                      w="$4" 
                      h="$4" 
                      bg={selectedField.color} 
                      borderRadius="$sm" 
                    />
                    <Text fontWeight="bold" color="$gray900">{selectedField.name}</Text>
                  </HStack>
                  {selectedField.description && (
                    <Text size="sm" color="$gray600" mt="$2">
                      {selectedField.description}
                    </Text>
                  )}
                </Box>
              )}
            </VStack>
          </Card>

          {/* 기본 정보 */}
          <Card 
            bg="white" 
            p="$5" 
            borderRadius="$xl"
            borderWidth={1}
            borderColor="$gray200"
          >
            <VStack space="lg">
              <Heading size="xl" color="$gray900" fontWeight="$bold">기본 정보</Heading>
              
              <VStack space="xs">
                <Text size="sm" color="$gray600">제목 <Text color="$red500">*</Text></Text>
                <Input>
                  <InputField
                    placeholder="기록 제목을 입력하세요"
                    value={title}
                    onChangeText={setTitle}
                  />
                </Input>
              </VStack>

              <VStack space="xs">
                <Text size="sm" color="$gray600">설명</Text>
                <Textarea>
                  <TextareaInput
                    placeholder="상세 설명을 입력하세요"
                    value={description}
                    onChangeText={setDescription}
                    numberOfLines={3}
                  />
                </Textarea>
              </VStack>

              <HStack space="md">
                <VStack flex={1} space="xs">
                  <Text size="sm" color="$gray600">상태</Text>
                  <Select
                    selectedValue={status}
                    onValueChange={(value) => setStatus(value as any)}
                  >
                    <SelectTrigger>
                      <SelectInput 
                        placeholder="상태 선택"
                        value={STATUS_OPTIONS.find(option => option.value === status)?.label || ''}
                      />
                      <SelectIcon />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectBackdrop />
                      <SelectContent>
                        <SelectDragIndicatorWrapper>
                          <SelectDragIndicator />
                        </SelectDragIndicatorWrapper>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem 
                            key={option.value} 
                            label={option.label} 
                            value={option.value} 
                          />
                        ))}
                      </SelectContent>
                    </SelectPortal>
                  </Select>
                </VStack>

                <VStack flex={1} space="xs">
                  <Text size="sm" color="$gray600">우선순위</Text>
                  <Select
                    selectedValue={priority.toString()}
                    onValueChange={(value) => setPriority(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectInput 
                        placeholder="우선순위 선택"
                        value={PRIORITY_OPTIONS.find(option => option.value === priority)?.label || ''}
                      />
                      <SelectIcon />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectBackdrop />
                      <SelectContent>
                        <SelectDragIndicatorWrapper>
                          <SelectDragIndicator />
                        </SelectDragIndicatorWrapper>
                        {PRIORITY_OPTIONS.map((option) => (
                          <SelectItem 
                            key={option.value} 
                            label={option.label} 
                            value={option.value.toString()} 
                          />
                        ))}
                      </SelectContent>
                    </SelectPortal>
                  </Select>
                </VStack>
              </HStack>

              <VStack space="xs">
                <Text size="sm" color="$gray600">마감일</Text>
                <Pressable onPress={() => setShowDatePicker(true)}>
                  <Input isReadOnly={true}>
                  <InputField
                      placeholder="날짜 선택"
                      value={formatDisplayDate(dueDate)}
                      editable={false}
                    />
                  </Input>
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    minimumDate={new Date()}
                  />
                )}
              </VStack>
            </VStack>
          </Card>

          {/* 사용자 정의 필드 */}
          {selectedField && selectedField.field_schema.fields.length > 0 && (
            <Card 
              bg="white" 
              p="$5" 
              borderRadius="$xl"
              borderWidth={1}
              borderColor="$gray200"
            >
              <VStack space="lg">
                <Heading size="xl" color="$gray900" fontWeight="$bold">상세 정보</Heading>
                {selectedField.field_schema.fields.map(renderCustomField)}
              </VStack>
            </Card>
          )}

          {/* 태그 */}
          <Card 
            bg="white" 
            p="$5" 
            borderRadius="$xl"
            borderWidth={1}
            borderColor="$gray200"
          >
            <VStack space="lg">
              <Heading size="xl" color="$gray900" fontWeight="$bold">태그</Heading>
              
              <HStack space="sm">
                <Input flex={1}>
                  <InputField
                    placeholder="태그 추가"
                    value={tagInput}
                    onChangeText={setTagInput}
                    onSubmitEditing={addTag}
                  />
                </Input>
                <Button size="sm" onPress={addTag} isDisabled={!tagInput.trim()}>
                  <ButtonText>추가</ButtonText>
                </Button>
              </HStack>

              {tags.length > 0 && (
                <HStack space="xs" flexWrap="wrap">
                  {tags.map((tag) => (
                    <Pressable key={tag} onPress={() => removeTag(tag)}>
                      <Badge 
                        variant="solid" 
                        mb="$1" 
                        mr="$1"
                        bg="$purple600"
                        borderRadius="$md"
                      >
                        <Text color="$white" size="sm" fontWeight="$bold">#{tag} ×</Text>
                      </Badge>
                    </Pressable>
                  ))}
                </HStack>
              )}
            </VStack>
          </Card>

          {/* 사진 첨부 */}
          <Card 
            bg="white" 
            p="$5" 
            borderRadius="$xl"
            borderWidth={1}
            borderColor="$gray200"
          >
            <VStack space="lg">
              <Heading size="xl" color="$gray900" fontWeight="$bold">사진 첨부</Heading>
              
              <ImagePickerComponent
                images={images}
                onImagesChange={setImages}
                maxImages={10}
                recordId={record?.id}
              />
            </VStack>
          </Card>

          {/* 하단 버튼 */}
          <HStack space="md" mb="$10">
            <Pressable
              flex={1}
              py="$2.5"
              px="$3"
              borderRadius="$md"
              borderWidth={1}
              borderColor="$gray300"
              bg="$white"
              alignItems="center"
              justifyContent="center"
              onPress={() => navigation.goBack()}
            >
              <Text color="$gray700" fontWeight="$semibold" size="sm">취소</Text>
            </Pressable>
            <Pressable
              flex={1}
              py="$2.5"
              px="$3"
              borderRadius="$md"
              bg="$blue600"
              alignItems="center"
              justifyContent="center"
              onPress={handleSave}
              isDisabled={isSaving}
              opacity={isSaving ? 0.5 : 1}
            >
              {isSaving ? (
                <Spinner color="white" size="small" />
              ) : (
                <Text color="$white" fontWeight="$bold" size="sm">저장</Text>
              )}
            </Pressable>
          </HStack>
        </VStack>
      </ScrollView>
      
      {/* 하단 네비게이션 */}
      <BottomNavigation navigation={navigation} />
    </SafeAreaView>
  );
};

export default EditRecordScreen;

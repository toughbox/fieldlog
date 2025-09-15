import React, { useState, useEffect, useRef } from 'react';
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
  Divider,
  Spinner,
  Textarea,
  TextareaInput
} from '@gluestack-ui/themed';
import { ArrowLeft, Calendar, MapPin, Tag, Clock } from 'lucide-react-native';
import { currentRecordApi, currentFieldApi, CreateRecordRequest, Field, FieldSchema } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ImagePickerComponent from '../components/ImagePicker';
import { UploadedImage } from '../services/imageService';
import { TokenService } from '../services/tokenService';

interface CreateRecordScreenProps {
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
  { value: 3, label: '3 (중간)', color: '#F59E0B' },
  { value: 4, label: '4 (높음)', color: '#EF4444' },
  { value: 5, label: '5 (긴급)', color: '#DC2626' }
];

const CreateRecordScreen: React.FC<CreateRecordScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { preselectedFieldId } = route.params || {};
  const scrollViewRef = useRef<ScrollView>(null);

  // 기본 정보
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(preselectedFieldId || null);
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
  const [isLoading, setIsLoading] = useState(false);
  const [isFieldsLoading, setIsFieldsLoading] = useState(true);

  // 현장 목록 로드
  useEffect(() => {
    loadFields();
  }, []);

  // 선택된 현장이 변경될 때 해당 현장 정보 로드
  useEffect(() => {
    if (selectedFieldId) {
      const field = fields.find(f => f.id === selectedFieldId);
      if (field) {
        setSelectedField(field);
        // 사용자 정의 필드 초기화
        const initialCustomData: Record<string, any> = {};
        field.field_schema.fields.forEach(fieldDef => {
          initialCustomData[fieldDef.key] = '';
        });
        setCustomData(initialCustomData);
        
        // 현장 선택 시 맨 위로 스크롤
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }, 100);
      }
    } else {
      setSelectedField(null);
      setCustomData({});
    }
  }, [selectedFieldId, fields]);

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

  const loadFields = async () => {
    try {
      setIsFieldsLoading(true);
      const accessToken = await TokenService.getAccessToken();
      if (!accessToken) {
        Alert.alert('오류', '접근권한이 없습니다.');
        return;
      }

      const response = await currentFieldApi.getFields(accessToken);
      if (response.success && response.data) {
        setFields(response.data);
      } else {
        Alert.alert('오류', response.error || '현장 목록을 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('현장 목록 로드 오류:', error);
      Alert.alert('오류', '현장 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsFieldsLoading(false);
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

  const handleCreateRecord = async () => {
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
      setIsLoading(true);
      
      const accessToken = await TokenService.getAccessToken();
      if (!accessToken) {
        Alert.alert('오류', '접근권한이 없습니다.');
        return;
      }

      const createRequest: CreateRecordRequest = {
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

      const response = await currentRecordApi.createRecord(createRequest, accessToken);
      
      if (response.success) {
        Alert.alert('성공', '현장 기록이 성공적으로 생성되었습니다.', [
          { 
            text: '확인', 
            onPress: () => {
              // 현장 상세 화면으로 이동
              navigation.navigate('FieldDetail', { 
                fieldId: selectedFieldId, 
                field: selectedField 
              });
            }
          }
        ]);
      } else {
        Alert.alert('오류', response.error || '현장 기록 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('현장 기록 생성 오류:', error);
      Alert.alert('오류', '현장 기록 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
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
                  {options?.map((option: string, index: number) => (
                    <SelectItem key={index} label={option} value={option} />
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

      default:
        return null;
    }
  };

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
            <Heading size="xl" color="$gray900">새 기록 작성</Heading>
          </HStack>
        </HStack>
      </Box>

      <ScrollView ref={scrollViewRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <VStack space="md">
          {/* 현장 선택 */}
          <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8}>
            <VStack space="md">
              <Heading size="lg" color="$gray900">현장 선택</Heading>
              
              {isFieldsLoading ? (
                <Box flexDirection="row" alignItems="center" justifyContent="center" py="$4">
                  <Spinner size="small" />
                  <Text ml="$2" color="$gray600">현장 목록 로딩 중...</Text>
                </Box>
              ) : (
                <Select
                  selectedValue={selectedFieldId?.toString() || ''}
                  onValueChange={(value) => setSelectedFieldId(value ? parseInt(value) : null)}
                >
                  <SelectTrigger>
                    <SelectInput 
                      placeholder="현장을 선택하세요"
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
              )}

              {selectedField && (
                <Box bg="$blue50" p="$4" borderRadius="$md" borderWidth={2} borderColor="$blue200">
                  <VStack space="sm">
                    <HStack alignItems="center" space="sm">
                      <Box 
                        w="$5" 
                        h="$5" 
                        bg={selectedField.color} 
                        borderRadius="$md" 
                      />
                      <VStack flex={1}>
                        <Text fontWeight="bold" color="$gray900" size="md">{selectedField.name}</Text>
                        <Text size="sm" color="$blue700">선택된 현장</Text>
                      </VStack>
                      <Badge variant="solid" bg="$green500">
                        <Text color="white" size="xs">선택됨</Text>
                      </Badge>
                    </HStack>
                    {selectedField.description && (
                      <Text size="sm" color="$gray700" mt="$1">
                        {selectedField.description}
                      </Text>
                    )}
                    <Text size="xs" color="$blue600">
                      📝 이 현장의 사용자 정의 필드가 아래에 표시됩니다
                    </Text>
                  </VStack>
                </Box>
              )}
            </VStack>
          </Card>

          {/* 기본 정보 */}
          <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8}>
            <VStack space="md">
              <Heading size="lg" color="$gray900">기본 정보</Heading>
              
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
                      <SelectInput placeholder="상태 선택" />
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
                      <SelectInput placeholder="우선순위 선택" />
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
            <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8}>
              <VStack space="md">
                <Heading size="lg" color="$gray900">상세 정보</Heading>
                {selectedField.field_schema.fields.map(renderCustomField)}
              </VStack>
            </Card>
          )}

          {/* 태그 */}
          <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8}>
            <VStack space="md">
              <HStack alignItems="center" space="sm">
                <Tag size={20} color="#6366f1" />
                <Heading size="lg" color="$gray900">태그</Heading>
              </HStack>
              
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
                  {tags.map((tag, index) => (
                    <Pressable key={index} onPress={() => removeTag(tag)}>
                      <Badge 
                        variant="solid" 
                        mb="$1" 
                        mr="$1"
                        bg="$blue500"
                      >
                        <Text color="white" size="sm">{tag} ×</Text>
                      </Badge>
                    </Pressable>
                  ))}
                </HStack>
              )}
            </VStack>
          </Card>

          {/* 사진 첨부 */}
          <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8}>
            <VStack space="md">
              <HStack alignItems="center" space="sm">
                <Calendar size={20} color="#6366f1" />
                <Heading size="lg" color="$gray900">사진 첨부</Heading>
              </HStack>
              
              <ImagePickerComponent
                images={images}
                onImagesChange={setImages}
                maxImages={10}
              />
            </VStack>
          </Card>

          {/* 하단 버튼 */}
          <HStack space="md" mb="$10">
            <Button
              flex={1}
              variant="outline"
              onPress={() => navigation.goBack()}
            >
              <ButtonText>취소</ButtonText>
            </Button>
            <Button
              flex={1}
              action="primary"
              onPress={handleCreateRecord}
              isDisabled={isLoading}
            >
              {isLoading ? (
                <Spinner color="white" />
              ) : (
                <ButtonText>기록 생성</ButtonText>
              )}
            </Button>
          </HStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateRecordScreen;

import React, { useState } from 'react';
import { Alert, ScrollView, StatusBar } from 'react-native';
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
  Switch,
  Divider,
  Center,
  Spinner
} from '@gluestack-ui/themed';
import { ArrowLeft, Plus, Trash2, ChevronDown, Palette } from 'lucide-react-native';
import { currentFieldApi, CreateFieldRequest, FieldSchema } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TokenService } from '../services/tokenService';

interface CreateFieldScreenProps {
  navigation: any;
}

interface FieldDefinition {
  id: string;
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'checkbox';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

const FIELD_TYPES = [
  { value: 'text', label: '텍스트' },
  { value: 'number', label: '숫자' },
  { value: 'select', label: '선택' },
  { value: 'date', label: '날짜' },
  { value: 'textarea', label: '긴 텍스트' },
  { value: 'checkbox', label: '체크박스' }
];

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
  '#6C5CE7', '#A29BFE', '#FD79A8', '#E17055', '#00B894'
];

const ICONS = [
  'construction', 'server', 'truck', 'calendar', 'folder',
  'home', 'building', 'chart', 'clipboard', 'settings'
];

const TEMPLATES = [
  {
    name: '건설현장 하자관리',
    description: '아파트 건설현장 하자 관리용',
    color: '#FF6B6B',
    icon: '🏗️',
    fields: [
      { label: '동', type: 'text', required: true, placeholder: '예: 101동' },
      { label: '호수', type: 'text', required: true, placeholder: '예: 1001호' },
      { label: '하자유형', type: 'select', required: true, options: ['균열', '누수', '도장불량', '타일불량', '기타'] },
      { label: '심각도', type: 'select', required: true, options: ['높음', '보통', '낮음'] },
      { label: '담당자', type: 'text', required: false, placeholder: '담당자 이름' }
    ]
  },
  {
    name: '매장 점검',
    description: '매장 일일 점검 및 관리',
    color: '#4ECDC4',
    icon: '🏪',
    fields: [
      { label: '점검구역', type: 'select', required: true, options: ['입구', '매장내부', '창고', '화장실', '주방'] },
      { label: '점검항목', type: 'text', required: true, placeholder: '점검 항목' },
      { label: '상태', type: 'select', required: true, options: ['양호', '보통', '불량'] },
      { label: '특이사항', type: 'textarea', required: false, placeholder: '특이사항 기록' }
    ]
  }
];

const CreateFieldScreen: React.FC<CreateFieldScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);

  const addField = () => {
    const nextNumber = fields.length + 1;
    const newField: FieldDefinition = {
      id: Date.now().toString(),
      key: `attribute${nextNumber}`,
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      options: []
    };
    setFields([...fields, newField]);
  };

  const removeField = (fieldId: string) => {
    const updatedFields = fields.filter(field => field.id !== fieldId);
    // 키 재정렬
    const reindexedFields = updatedFields.map((field, index) => ({
      ...field,
      key: `attribute${index + 1}`
    }));
    setFields(reindexedFields);
  };

  const updateField = (fieldId: string, updates: Partial<FieldDefinition>) => {
    setFields(fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
  };

  const applyTemplate = (template: any) => {
    setName(template.name);
    setDescription(template.description);
    setSelectedColor(template.color);
    
    const templateFields = template.fields.map((field: any, index: number) => ({
      id: Date.now().toString() + index,
      key: `attribute${index + 1}`,
      label: field.label,
      type: field.type,
      required: field.required,
      placeholder: field.placeholder || '',
      options: field.options || []
    }));
    
    setFields(templateFields);
    setShowTemplates(false);
  };

  const handleCreateField = async () => {
    if (!name.trim()) {
      Alert.alert('알림', '현장 이름을 입력해주세요.');
      return;
    }

    if (fields.length === 0) {
      Alert.alert('알림', '최소 하나의 입력 필드를 추가해주세요.');
      return;
    }

    const invalidField = fields.find(field => !field.label.trim());
    if (invalidField) {
      Alert.alert('알림', '모든 필드의 라벨을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      
      const accessToken = await TokenService.getAccessToken();
      if (!accessToken) {
        Alert.alert('오류', '접근권한이 없습니다.');
        return;
      }

      const fieldSchema: FieldSchema = {
        fields: fields.map(field => ({
          key: field.key,
          label: field.label,
          type: field.type,
          required: field.required,
          placeholder: field.placeholder,
          options: field.options
        }))
      };

      const createRequest: CreateFieldRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        color: selectedColor,
        icon: selectedIcon,
        field_schema: fieldSchema
      };

      const response = await currentFieldApi.createField(createRequest, accessToken);
      
      if (response.success) {
        Alert.alert('성공', '현장이 성공적으로 생성되었습니다.', [
          { text: '확인', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('오류', response.message || '현장 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('현장 생성 오류:', error);
      Alert.alert('오류', '현장 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

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
            <Heading size="xl" color="$gray900">새 현장 만들기</Heading>
          </HStack>
        </HStack>
      </Box>

      <ScrollView flex={1} p="$4">
        {/* 템플릿 선택 */}
        {showTemplates && (
          <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8} mb="$4">
            <VStack space="md">
              <Heading size="lg" color="$gray900">템플릿 선택</Heading>
              <Text color="$gray600">자주 사용하는 현장 유형을 선택하거나 직접 만들어보세요</Text>
              
              {TEMPLATES.map((template, index) => (
                <Pressable
                  key={index}
                  onPress={() => applyTemplate(template)}
                  bg="$gray50"
                  p="$3"
                  borderRadius="$md"
                  borderLeftWidth={4}
                  borderLeftColor={template.color}
                >
                  <HStack space="sm" alignItems="center">
                    <Text fontSize="$2xl">{template.icon}</Text>
                    <VStack space="xs" flex={1}>
                      <Text fontWeight="bold" color="$gray900">{template.name}</Text>
                      <Text size="sm" color="$gray600">{template.description}</Text>
                    </VStack>
                    <Button size="sm" variant="outline">
                      <ButtonText>사용</ButtonText>
                    </Button>
                  </HStack>
                </Pressable>
              ))}

              <Button
                variant="ghost"
                onPress={() => setShowTemplates(false)}
              >
                <ButtonText>직접 만들기</ButtonText>
              </Button>
            </VStack>
          </Card>
        )}

        {/* 기본 정보 */}
        {!showTemplates && (
          <VStack space="md">
            <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8}>
              <VStack space="md">
                <Heading size="lg" color="$gray900">기본 정보</Heading>
                
                <VStack space="xs">
                  <Text size="sm" color="$gray600">현장 이름 *</Text>
                  <Input>
                    <InputField
                      placeholder="현장 이름을 입력하세요"
                      value={name}
                      onChangeText={setName}
                    />
                  </Input>
                </VStack>

                <VStack space="xs">
                  <Text size="sm" color="$gray600">설명</Text>
                  <Input>
                    <InputField
                      placeholder="현장에 대한 설명을 입력하세요"
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={3}
                    />
                  </Input>
                </VStack>
              </VStack>
            </Card>

            {/* 색상 선택 */}
            <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8}>
              <VStack space="md">
                <HStack alignItems="center" space="sm">
                  <Palette size={20} color="#6366f1" />
                  <Heading size="lg" color="$gray900">색상 선택</Heading>
                </HStack>
                <HStack space="sm" flexWrap="wrap">
                  {COLORS.map((color, index) => (
                    <Pressable
                      key={index}
                      onPress={() => setSelectedColor(color)}
                      w="$10"
                      h="$10"
                      bg={color}
                      borderRadius="$md"
                      borderWidth={selectedColor === color ? 3 : 0}
                      borderColor="$gray800"
                      m="$1"
                    />
                  ))}
                </HStack>
              </VStack>
            </Card>

            {/* 필드 설정 */}
            <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8}>
              <VStack space="md">
                <Heading size="lg" color="$gray900">입력 필드 설정</Heading>

                {fields.length === 0 ? (
                  <Text color="$gray600" textAlign="center" py="$4">
                    입력 필드를 추가해주세요. 각 기록에서 입력받을 정보들을 정의할 수 있습니다.
                  </Text>
                ) : (
                  <VStack space="sm">
                    {fields.map((field, index) => (
                      <FieldEditor
                        key={field.id}
                        field={field}
                        index={index}
                        onUpdate={(updates) => updateField(field.id, updates)}
                        onRemove={() => removeField(field.id)}
                      />
                    ))}
                  </VStack>
                )}

                {/* 필드 추가 버튼을 아래쪽으로 이동 */}
                <Button variant="outline" onPress={addField} mt="$2">
                  <ButtonIcon as={Plus} />
                  <ButtonText>필드 추가</ButtonText>
                </Button>
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
                onPress={handleCreateField}
                isDisabled={isLoading}
              >
                {isLoading ? (
                  <Spinner color="white" />
                ) : (
                  <ButtonText>현장 만들기</ButtonText>
                )}
              </Button>
            </HStack>
          </VStack>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

interface FieldEditorProps {
  field: FieldDefinition;
  index: number;
  onUpdate: (updates: Partial<FieldDefinition>) => void;
  onRemove: () => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({ field, index, onUpdate, onRemove }) => {
  const [optionText, setOptionText] = useState('');

  const addOption = () => {
    if (optionText.trim()) {
      const newOptions = [...(field.options || []), optionText.trim()];
      onUpdate({ options: newOptions });
      setOptionText('');
    }
  };

  const removeOption = (optionIndex: number) => {
    const newOptions = field.options?.filter((_, i) => i !== optionIndex) || [];
    onUpdate({ options: newOptions });
  };

  return (
    <Card bg="$gray50" p="$3" borderRadius="$md" borderWidth={1} borderColor="$gray200">
      <VStack space="sm">
        <HStack justifyContent="space-between" alignItems="center">
          <Text fontWeight="bold" color="$gray900">필드 {index + 1}</Text>
          <Button variant="ghost" size="sm" onPress={onRemove} bg="transparent">
            <ButtonIcon as={Trash2} color="$red500" />
          </Button>
        </HStack>


        <VStack space="xs">
          <Text size="sm" color="$gray600">라벨 (화면에 표시될 이름) *</Text>
          <Input>
            <InputField
              placeholder="예: 동, 하자유형, 담당자..."
              value={field.label}
              onChangeText={(text) => onUpdate({ label: text })}
            />
          </Input>
        </VStack>

        <VStack space="xs">
          <Text size="sm" color="$gray600">타입:</Text>
          <HStack space="xs" flexWrap="wrap">
            {FIELD_TYPES.map((type) => (
              <Pressable
                key={type.value}
                onPress={() => {
                  console.log(`타입 변경: ${field.type} -> ${type.value}`);
                  onUpdate({ type: type.value as any });
                }}
                bg={field.type === type.value ? "#6366F1" : "#F3F4F6"}
                p="$2"
                borderRadius="$sm"
                mb="$1"
                borderWidth={field.type === type.value ? 2 : 1}
                borderColor={field.type === type.value ? "#4F46E5" : "#D1D5DB"}
              >
                <Text 
                  size="xs" 
                  color={field.type === type.value ? "white" : "$gray700"}
                  fontWeight={field.type === type.value ? "bold" : "normal"}
                >
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </HStack>
        </VStack>

        <VStack space="xs">
          <Text size="sm" color="$gray600">플레이스홀더</Text>
          <Input>
            <InputField
              placeholder="입력 안내 문구 (선택사항)"
              value={field.placeholder}
              onChangeText={(text) => onUpdate({ placeholder: text })}
            />
          </Input>
        </VStack>

        <HStack justifyContent="space-between" alignItems="center">
          <Text size="sm" color="$gray600">필수 입력</Text>
          <Switch
            value={field.required}
            onValueChange={(value) => onUpdate({ required: value })}
          />
        </HStack>

        {field.type === 'select' && (
          <VStack space="sm">
            <Text size="sm" fontWeight="bold" color="$gray700">선택 옵션:</Text>
            
            <HStack space="sm">
              <Input flex={1}>
                <InputField
                  placeholder="옵션 추가"
                  value={optionText}
                  onChangeText={setOptionText}
                />
              </Input>
              <Button size="sm" onPress={addOption} isDisabled={!optionText.trim()}>
                <ButtonIcon as={Plus} />
              </Button>
            </HStack>

            <VStack space="xs">
              {field.options?.map((option, optionIndex) => (
                <HStack key={optionIndex} justifyContent="space-between" alignItems="center" bg="white" p="$2" borderRadius="$sm">
                  <Text size="sm" color="$gray800">{option}</Text>
                  <Button variant="ghost" size="sm" onPress={() => removeOption(optionIndex)} bg="transparent">
                    <ButtonIcon as={Trash2} size={16} color="$red500" />
                  </Button>
                </HStack>
              ))}
            </VStack>
          </VStack>
        )}
      </VStack>
    </Card>
  );
};

export default CreateFieldScreen;
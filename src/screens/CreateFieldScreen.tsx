import React, { useState } from 'react';
import { Alert, ScrollView, StatusBar } from 'react-native';
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
  Badge,
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
  Divider,
  Center,
  Spinner
} from '@gluestack-ui/themed';
import { ArrowLeft, Plus, Trash2, ChevronDown, Palette, CheckCircle2 } from 'lucide-react-native';
import { currentFieldApi, CreateFieldRequest, FieldSchema } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TokenService } from '../services/tokenService';
import BottomNavigation from '../components/BottomNavigation';

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


const CreateFieldScreen: React.FC<CreateFieldScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  // 화면 로딩 시 기본 필드 추가
  React.useEffect(() => {
    if (fields.length === 0) {
      addField();
    }
  }, []);

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


  const handleCreateField = async () => {
    if (!name.trim()) {
      Alert.alert('알림', '현장 이름을 입력해주세요.');
      return;
    }

    if (fields.length === 0) {
      Alert.alert('알림', '최소 하나의 입력 항목을 추가해주세요.');
      return;
    }

    const invalidField = fields.find(field => !field.label.trim());
    if (invalidField) {
      Alert.alert('알림', '모든 항목의 라벨을 입력해주세요.');
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
      console.error('오류 상세:', JSON.stringify(error, null, 2));
      Alert.alert('오류', `현장 생성 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
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
            <Heading size="xl" color="$white" fontWeight="$bold">
              새 현장 만들기
            </Heading>
          </HStack>
        </HStack>
      </Box>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* 기본 정보 */}
        <VStack space="lg">
            <Card 
              bg="white" 
              p="$5" 
              borderRadius="$xl" 
              borderWidth={1}
              borderColor="$gray200"
            >
              <VStack space="lg">
                <Heading size="xl" color="$gray900" fontWeight="$bold">기본 정보</Heading>
                
                <VStack space="md">
                  <VStack space="sm">
                    <Text size="md" color="$gray700" fontWeight="$medium">
                      현장 이름 <Text color="$red500">*</Text>
                    </Text>
                    <Input
                      size="xl"
                      borderRadius="$lg"
                      borderWidth={2}
                      borderColor="$gray300"
                      $focus-borderColor="$blue500"
                    >
                      <InputField
                        placeholder="예: 강남 아파트 A동"
                        value={name}
                        onChangeText={setName}
                        fontSize="$md"
                      />
                    </Input>
                  </VStack>

                  <VStack space="sm">
                    <Text size="md" color="$gray700" fontWeight="$medium">설명</Text>
                    <Input
                      size="xl"
                      borderRadius="$lg"
                      borderWidth={2}
                      borderColor="$gray300"
                      $focus-borderColor="$blue500"
                    >
                      <InputField
                        placeholder="현장에 대한 설명을 입력하세요"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                        fontSize="$md"
                      />
                    </Input>
                  </VStack>
                </VStack>
              </VStack>
            </Card>

            {/* 색상 선택 */}
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
                    <Palette size={22} color="#2563eb" strokeWidth={2} />
                  </Box>
                  <Heading size="xl" color="$gray900" fontWeight="$bold">색상 선택</Heading>
                </HStack>
                <VStack space="sm">
                  <Text size="sm" color="$gray600">
                    현장을 구분할 색상을 선택하세요
                  </Text>
                  <HStack space="md" flexWrap="wrap">
                    {COLORS.map((color) => (
                      <Pressable
                        key={color}
                        onPress={() => setSelectedColor(color)}
                        w="$12"
                        h="$12"
                        bg={color}
                        borderRadius="$xl"
                        borderWidth={selectedColor === color ? 4 : 2}
                        borderColor={selectedColor === color ? "$gray900" : "$gray200"}
                        m="$1"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {selectedColor === color && (
                          <CheckCircle2 size={20} color="#ffffff" strokeWidth={3} />
                        )}
                      </Pressable>
                    ))}
                  </HStack>
                </VStack>
              </VStack>
            </Card>

            {/* 필드 설정 */}
            <Card 
              bg="white" 
              p="$5" 
              borderRadius="$xl"
              borderWidth={1}
              borderColor="$gray200"
            >
              <VStack space="lg">
                <HStack alignItems="center" justifyContent="space-between">
                  <Heading size="xl" color="$gray900" fontWeight="$bold">입력 항목 설정</Heading>
                  <Badge size="md" variant="solid" bg="$blue100" borderRadius="$lg">
                    <Text color="$blue700" fontWeight="$bold">{fields.length}개</Text>
                  </Badge>
                </HStack>

                <Text size="sm" color="$gray600" lineHeight="$lg">
                  각 기록에서 입력받을 정보들을 정의할 수 있습니다.
                </Text>

                {fields.length === 0 ? (
                  <Box 
                    bg="$gray50" 
                    p="$6" 
                    borderRadius="$xl" 
                    borderWidth={2}
                    borderColor="$gray200"
                    borderStyle="dashed"
                  >
                    <VStack alignItems="center" space="md">
                      <Box
                        w="$16"
                        h="$16"
                        bg="$blue50"
                        borderRadius="$full"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Plus size={32} color="#2563eb" strokeWidth={2} />
                      </Box>
                      <Text color="$gray600" textAlign="center" size="md">
                        입력 항목을 추가해주세요
                      </Text>
                    </VStack>
                  </Box>
                ) : (
                  <VStack space="md">
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

                {/* 항목 추가 버튼 */}
                <Button 
                  variant="outline" 
                  onPress={addField} 
                  size="lg"
                  borderRadius="$xl"
                  borderWidth={2}
                  borderColor="$blue600"
                >
                  <ButtonIcon as={Plus} color="$blue600" mr="$2" />
                  <ButtonText color="$blue600" fontWeight="$bold">항목 추가</ButtonText>
                </Button>
              </VStack>
            </Card>

            {/* 하단 버튼 */}
            <HStack space="md">
              <Button
                flex={1}
                variant="outline"
                onPress={() => navigation.goBack()}
                size="xl"
                borderRadius="$xl"
                borderWidth={2}
              >
                <ButtonText fontWeight="$bold">취소</ButtonText>
              </Button>
              <Button
                flex={1}
                bg="$blue600"
                onPress={handleCreateField}
                isDisabled={isLoading}
                size="xl"
                borderRadius="$xl"
              >
                {isLoading ? (
                  <Spinner color="white" />
                ) : (
                  <ButtonText fontWeight="$bold">현장 만들기</ButtonText>
                )}
              </Button>
            </HStack>
          </VStack>
      </ScrollView>
      
      {/* 하단 네비게이션 */}
      <BottomNavigation navigation={navigation} />
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
    <Card 
      bg="$gray50" 
      p="$4" 
      borderRadius="$xl" 
      borderWidth={2} 
      borderColor="$gray300"
    >
      <VStack space="md">
        <HStack justifyContent="space-between" alignItems="center">
          <Badge size="md" variant="solid" bg="$blue600" borderRadius="$lg">
            <Text color="$white" fontWeight="$bold">항목 {index + 1}</Text>
          </Badge>
          <Pressable 
            onPress={onRemove}
            p="$2"
            borderRadius="$lg"
            bg="$red50"
          >
            <Trash2 size={18} color="#ef4444" strokeWidth={2} />
          </Pressable>
        </HStack>


        <VStack space="sm">
          <Text size="md" color="$gray700" fontWeight="$medium">
            라벨 (화면에 표시될 이름) <Text color="$red500">*</Text>
          </Text>
          <Input
            size="lg"
            borderRadius="$lg"
            borderWidth={2}
            borderColor="$gray300"
            bg="$white"
          >
            <InputField
              placeholder="예: 동, 하자유형, 담당자..."
              value={field.label}
              onChangeText={(text) => onUpdate({ label: text })}
            />
          </Input>
        </VStack>

        <VStack space="sm">
          <Text size="md" color="$gray700" fontWeight="$medium">입력 타입</Text>
          <HStack space="sm" flexWrap="wrap">
            {FIELD_TYPES.map((type) => (
              <Pressable
                key={type.value}
                onPress={() => {
                  console.log(`타입 변경: ${field.type} -> ${type.value}`);
                  onUpdate({ type: type.value as any });
                }}
                bg={field.type === type.value ? "$blue600" : "$white"}
                px="$3"
                py="$2"
                borderRadius="$lg"
                mb="$1"
                borderWidth={2}
                borderColor={field.type === type.value ? "$blue600" : "$gray300"}
              >
                <Text 
                  size="sm" 
                  color={field.type === type.value ? "$white" : "$gray700"}
                  fontWeight={field.type === type.value ? "$bold" : "$medium"}
                >
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </HStack>
        </VStack>

        <HStack justifyContent="space-between" alignItems="center" bg="$white" p="$3" borderRadius="$lg">
          <Text size="md" color="$gray700" fontWeight="$medium">필수 입력</Text>
          <Pressable
            onPress={() => onUpdate({ required: !field.required })}
            bg={field.required ? "$blue600" : "$gray300"}
            w="$12"
            h="$6"
            borderRadius="$full"
            alignItems="center"
            justifyContent="center"
          >
            <Box
              w="$5"
              h="$5"
              bg="white"
              borderRadius="$full"
              position="absolute"
              left={field.required ? "$6" : "$1"}
            />
          </Pressable>
        </HStack>

        {field.type === 'select' && (
          <VStack space="md" bg="$white" p="$3" borderRadius="$lg">
            <Text size="md" fontWeight="$bold" color="$gray900">선택 옵션</Text>
            
            <HStack space="sm">
              <Input 
                flex={1}
                size="lg"
                borderRadius="$lg"
                borderWidth={2}
                borderColor="$gray300"
              >
                <InputField
                  placeholder="옵션 추가..."
                  value={optionText}
                  onChangeText={setOptionText}
                />
              </Input>
              <Button 
                size="lg" 
                onPress={addOption} 
                isDisabled={!optionText.trim()}
                bg="$blue600"
                borderRadius="$lg"
              >
                <ButtonIcon as={Plus} />
              </Button>
            </HStack>

            <VStack space="xs">
              {field.options?.map((option, idx) => (
                <HStack 
                  key={option} 
                  justifyContent="space-between" 
                  alignItems="center" 
                  bg="$gray50" 
                  p="$3" 
                  borderRadius="$lg"
                  borderWidth={1}
                  borderColor="$gray200"
                >
                  <HStack alignItems="center" space="sm" flex={1}>
                    <Badge size="sm" variant="solid" bg="$blue100" borderRadius="$md">
                      <Text size="xs" color="$blue700" fontWeight="$bold">{idx + 1}</Text>
                    </Badge>
                    <Text size="sm" color="$gray900" fontWeight="$medium">{option}</Text>
                  </HStack>
                  <Pressable 
                    onPress={() => removeOption(field.options?.indexOf(option) || 0)}
                    p="$2"
                    borderRadius="$md"
                    bg="$red50"
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </Pressable>
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
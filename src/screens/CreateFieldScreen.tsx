import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import {
  Text,
  Button,
  TextInput,
  Card,
  Title,
  Paragraph,
  Chip,
  Surface,
  IconButton,
  Divider
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  'wrench', 'chart-line', 'clipboard', 'home', 'office-building',
  'factory', 'warehouse', 'map-marker', 'tools', 'shield-check'
];

const TEMPLATES = [
  {
    name: '건설현장 하자관리',
    description: '아파트/빌딩 건설현장 하자 관리',
    color: '#FF6B6B',
    icon: 'construction',
    fields: [
      { label: '동', type: 'text', required: true, placeholder: '예: 101동' },
      { label: '호수', type: 'text', required: true, placeholder: '예: 2001호' },
      { label: '위치', type: 'select', required: true, options: ['거실', '주방', '화장실', '침실1', '침실2', '베란다'] },
      { label: '하자유형', type: 'select', required: true, options: ['전기', '배관', '도배', '바닥', '창호', '기타'] },
      { label: '심각도', type: 'select', required: true, options: ['낮음', '보통', '높음', '긴급'] }
    ]
  },
  {
    name: '서버 점검',
    description: 'IT 인프라 서버 점검 및 관리',
    color: '#3B82F6',
    icon: 'server',
    fields: [
      { label: '서버명', type: 'text', required: true, placeholder: '예: WEB-01' },
      { label: '서버유형', type: 'select', required: true, options: ['웹서버', 'DB서버', '파일서버', '메일서버'] },
      { label: 'IP주소', type: 'text', required: false, placeholder: '예: 192.168.1.100' },
      { label: '점검유형', type: 'select', required: true, options: ['정기점검', '장애대응', '성능점검', '보안점검'] }
    ]
  },
  {
    name: '배송 관리',
    description: '택배 및 물류 배송 관리',
    color: '#10B981',
    icon: 'truck',
    fields: [
      { label: '송장번호', type: 'text', required: true, placeholder: '예: 1234567890' },
      { label: '배송유형', type: 'select', required: true, options: ['일반배송', '당일배송', '새벽배송', '픽업'] },
      { label: '수령인', type: 'text', required: true },
      { label: '연락처', type: 'text', required: true, placeholder: '010-0000-0000' },
      { label: '상품유형', type: 'select', required: false, options: ['일반', '냉장', '냉동', '깨지기쉬움'] }
    ]
  }
];

const CreateFieldScreen: React.FC<CreateFieldScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // 기본 정보
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  
  // 필드 정의
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [showTemplates, setShowTemplates] = useState(true);

  // 새 필드 추가 (키 자동 생성)
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

  // 필드 업데이트
  const updateField = (id: string, updates: Partial<FieldDefinition>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  // 필드 삭제 (키 재번호 매기기)
  const removeField = (id: string) => {
    const newFields = fields.filter(field => field.id !== id);
    // 키 재번호 매기기
    const reNumberedFields = newFields.map((field, index) => ({
      ...field,
      key: `attribute${index + 1}`
    }));
    setFields(reNumberedFields);
  };

  // 템플릿 적용 (키 자동 생성)
  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    setName(template.name);
    setDescription(template.description);
    setSelectedColor(template.color);
    setSelectedIcon(template.icon);
    
    const templateFields = template.fields.map((field, index) => ({
      id: Date.now().toString() + index,
      key: `attribute${index + 1}`,
      ...field
    }));
    
    setFields(templateFields);
    setShowTemplates(false);
  };

  // 현장 생성
  const handleCreateField = async () => {
    if (!name.trim()) {
      Alert.alert('오류', '현장명을 입력해주세요.');
      return;
    }

    if (fields.length === 0) {
      Alert.alert('오류', '최소 1개 이상의 필드를 추가해주세요.');
      return;
    }

    // 필드 유효성 검사
    for (const field of fields) {
      if (!field.label.trim()) {
        Alert.alert('오류', '모든 필드의 라벨을 입력해주세요.');
        return;
      }
      
      if (field.type === 'select' && (!field.options || field.options.length === 0)) {
        Alert.alert('오류', `"${field.label}" 필드의 선택 옵션을 추가해주세요.`);
        return;
      }
    }

    setIsLoading(true);

    try {
      // 토큰 가져오기
      const accessToken = await TokenService.getAccessToken();
      if (!accessToken) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      const fieldSchema: FieldSchema = {
        fields: fields.map(({ id, ...field }) => field)
      };

      const fieldData: CreateFieldRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        color: selectedColor,
        icon: selectedIcon,
        field_schema: fieldSchema
      };

      // API 호출 (실제 백엔드 또는 목킹 API)
      const result = await currentFieldApi.createField(fieldData, accessToken);

      if (result.success) {
        Alert.alert(
          '성공',
          '현장이 성공적으로 생성되었습니다!',
          [
            {
              text: '확인',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('오류', result.error || '현장 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('현장 생성 오류:', error);
      Alert.alert('오류', '현장 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 헤더 */}
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
          <Title style={styles.title}>새 현장 만들기</Title>
          <View style={styles.headerSpacer} />
        </View>

        {/* 템플릿 선택 */}
        {showTemplates && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>템플릿 선택</Title>
              <Paragraph>자주 사용하는 현장 유형을 선택하거나 직접 만들어보세요</Paragraph>
              
              {TEMPLATES.map((template, index) => (
                <Surface key={index} style={[styles.templateItem, { borderLeftColor: template.color }]}>
                  <View style={styles.templateContent}>
                    <View style={styles.templateHeader}>
                      <Text style={styles.templateIcon}>{template.icon}</Text>
                      <View style={styles.templateInfo}>
                        <Text style={styles.templateName}>{template.name}</Text>
                        <Text style={styles.templateDescription}>{template.description}</Text>
                      </View>
                    </View>
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => applyTemplate(template)}
                    >
                      사용
                    </Button>
                  </View>
                </Surface>
              ))}

              <Button
                mode="text"
                onPress={() => setShowTemplates(false)}
                style={styles.skipButton}
              >
                직접 만들기
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* 기본 정보 */}
        {!showTemplates && (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <Title>기본 정보</Title>
                
                <TextInput
                  label="현장명 *"
                  mode="outlined"
                  placeholder="현장명을 입력하세요"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                />

                <TextInput
                  label="설명"
                  mode="outlined"
                  placeholder="현장에 대한 설명을 입력하세요"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />
              </Card.Content>
            </Card>

            {/* 색상 선택 */}
            <Card style={styles.card}>
              <Card.Content>
                <Title>색상 선택</Title>
                <View style={styles.colorGrid}>
                  {COLORS.map((color, index) => (
                    <Button
                      key={index}
                      mode={selectedColor === color ? "contained" : "outlined"}
                      style={[styles.colorButton, { backgroundColor: selectedColor === color ? color : 'transparent', borderColor: color }]}
                      onPress={() => setSelectedColor(color)}
                    >
                      {selectedColor === color ? '✓' : ''}
                    </Button>
                  ))}
                </View>
              </Card.Content>
            </Card>

            {/* 아이콘 선택 */}
            <Card style={styles.card}>
              <Card.Content>
                <Title>아이콘 선택</Title>
                <View style={styles.iconGrid}>
                  {ICONS.map((icon, index) => (
                    <IconButton
                      key={index}
                      icon={icon}
                      mode={selectedIcon === icon ? "contained" : "outlined"}
                      iconColor={selectedIcon === icon ? selectedColor : undefined}
                      onPress={() => setSelectedIcon(icon)}
                      style={[styles.iconButton, selectedIcon === icon && { backgroundColor: selectedColor + '20' }]}
                    />
                  ))}
                </View>
              </Card.Content>
            </Card>

            {/* 필드 설정 */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <Title>입력 필드 설정</Title>
                  <Button mode="outlined" icon="plus" onPress={addField} compact>
                    필드 추가
                  </Button>
                </View>

                {fields.length === 0 ? (
                  <Paragraph style={styles.emptyMessage}>
                    입력 필드를 추가해주세요. 각 기록에서 입력받을 정보들을 정의할 수 있습니다.
                  </Paragraph>
                ) : (
                  fields.map((field, index) => (
                    <FieldEditor
                      key={field.id}
                      field={field}
                      index={index}
                      onUpdate={(updates) => updateField(field.id, updates)}
                      onRemove={() => removeField(field.id)}
                    />
                  ))
                )}
              </Card.Content>
            </Card>

            {/* 하단 버튼 */}
            <View style={styles.bottomButtons}>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.cancelButton}
              >
                취소
              </Button>
              <Button
                mode="contained"
                onPress={handleCreateField}
                loading={isLoading}
                disabled={isLoading}
                style={styles.createButton}
              >
                현장 만들기
              </Button>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// 필드 편집 컴포넌트
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
    <Surface style={styles.fieldEditor}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldNumber}>필드 {index + 1}</Text>
        <IconButton icon="delete" onPress={onRemove} />
      </View>

      {/* 자동 생성된 키 표시 */}
      <View style={styles.autoKeyDisplay}>
        <Text style={styles.autoKeyLabel}>🔑 자동 생성된 키:</Text>
        <Text style={styles.autoKeyValue}>{field.key}</Text>
      </View>

      <TextInput
        label="라벨 (화면에 표시될 이름) *"
        mode="outlined"
        placeholder="예: 동, 하자유형, 담당자..."
        value={field.label}
        onChangeText={(text) => onUpdate({ label: text })}
        style={styles.fieldInput}
      />

      <View style={styles.typeSelector}>
        <Text style={styles.typeLabel}>타입:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FIELD_TYPES.map((type) => (
            <Chip
              key={type.value}
              selected={field.type === type.value}
              onPress={() => onUpdate({ type: type.value as any })}
              style={styles.typeChip}
            >
              {type.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <TextInput
        label="플레이스홀더"
        mode="outlined"
        placeholder="입력 힌트 텍스트"
        value={field.placeholder || ''}
        onChangeText={(text) => onUpdate({ placeholder: text })}
        style={styles.fieldInput}
      />

      <View style={styles.requiredToggle}>
        <Text>필수 입력</Text>
        <Button
          mode={field.required ? "contained" : "outlined"}
          compact
          onPress={() => onUpdate({ required: !field.required })}
        >
          {field.required ? '필수' : '선택'}
        </Button>
      </View>

      {field.type === 'select' && (
        <View style={styles.optionsSection}>
          <Text style={styles.optionsLabel}>선택 옵션:</Text>
          
          <View style={styles.addOptionRow}>
            <TextInput
              mode="outlined"
              placeholder="옵션 추가"
              value={optionText}
              onChangeText={setOptionText}
              style={styles.optionInput}
            />
            <Button mode="outlined" onPress={addOption} compact>
              추가
            </Button>
          </View>

          <View style={styles.optionsList}>
            {field.options?.map((option, optionIndex) => (
              <View key={optionIndex} style={styles.optionItem}>
                <Text style={styles.optionText}>{option}</Text>
                <IconButton 
                  icon="close" 
                  size={16}
                  onPress={() => removeOption(optionIndex)} 
                />
              </View>
            ))}
          </View>
        </View>
      )}

      <Divider style={styles.fieldDivider} />
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  input: {
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  iconButton: {
    margin: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  fieldEditor: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 1,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  fieldInput: {
    marginBottom: 8,
  },
  typeSelector: {
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  typeChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  requiredToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionsSection: {
    marginTop: 8,
  },
  optionsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  addOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionInput: {
    flex: 1,
    marginRight: 8,
  },
  optionsList: {
    maxHeight: 120,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    flex: 1,
  },
  fieldDivider: {
    marginTop: 12,
  },
  templateItem: {
    marginBottom: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderRadius: 8,
    elevation: 1,
  },
  templateContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  templateIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: '#666',
  },
  skipButton: {
    marginTop: 16,
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 0.45,
  },
  createButton: {
    flex: 0.45,
  },
  autoKeyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  autoKeyLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  autoKeyValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
});

export default CreateFieldScreen;

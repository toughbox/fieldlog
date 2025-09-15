import React, { useState, useEffect } from 'react';
import { ScrollView, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  Heading,
  Input,
  InputField,
  Textarea,
  TextareaInput,
  ButtonText,
  ButtonIcon,
  Center,
  Spinner
} from '@gluestack-ui/themed';
import { 
  ArrowLeft, 
  Save, 
  Building,
  Palette,
  Type,
  FileText
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { currentFieldApi, Field } from '../services/api';
import { TokenService } from '../services/tokenService';

interface EditFieldScreenProps {
  navigation: any;
  route: {
    params: {
      fieldId: number;
      field: Field;
    };
  };
}

const FIELD_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
  '#10AC84', '#EE5A24', '#0984E3', '#6C5CE7', '#A29BFE',
  '#FD79A8', '#FDCB6E', '#E17055', '#00B894', '#74B9FF'
];

const FIELD_ICONS = [
  'construction', 'building', 'home', 'warehouse', 'factory',
  'office', 'school', 'hospital', 'store', 'apartment'
];

const EditFieldScreen: React.FC<EditFieldScreenProps> = ({ navigation, route }) => {
  const { fieldId, field } = route.params;
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 폼 상태
  const [name, setName] = useState(field.name);
  const [description, setDescription] = useState(field.description || '');
  const [color, setColor] = useState(field.color);
  const [icon, setIcon] = useState(field.icon);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('알림', '현장 이름을 입력해주세요.');
      return;
    }

    try {
      setIsSaving(true);
      const accessToken = await TokenService.getAccessToken();
      if (!accessToken) {
        Alert.alert('오류', '접근권한이 없습니다.');
        return;
      }

      const updateData = {
        name: name.trim(),
        description: description.trim() || undefined,
        color: color,
        icon: icon
      };

      const response = await currentFieldApi.updateField(fieldId, updateData, accessToken);
      
      if (response.success) {
        Alert.alert('성공', '현장 정보가 수정되었습니다.', [
          { 
            text: '확인', 
            onPress: () => navigation.navigate('FieldDetail', { 
              fieldId: fieldId, 
              field: { ...field, ...updateData }
            })
          }
        ]);
      } else {
        Alert.alert('오류', response.error || '현장 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('현장 수정 오류:', error);
      Alert.alert('오류', '현장 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderColorPicker = () => (
    <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8} mb="$4">
      <VStack space="md">
        <HStack alignItems="center" space="sm">
          <Palette size={20} color="#6366f1" />
          <Heading size="md" color="$gray900">현장 색상</Heading>
        </HStack>
        
        <Box flexDirection="row" flexWrap="wrap" gap="$2">
          {FIELD_COLORS.map((colorOption) => (
            <Button
              key={colorOption}
              size="sm"
              variant={color === colorOption ? "solid" : "outline"}
              bg={color === colorOption ? colorOption : "transparent"}
              borderColor={colorOption}
              onPress={() => setColor(colorOption)}
              style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 20,
                borderWidth: color === colorOption ? 3 : 1
              }}
            >
              {color === colorOption && (
                <ButtonIcon as={Save} size={16} color="white" />
              )}
            </Button>
          ))}
        </Box>
      </VStack>
    </Card>
  );

  const renderIconPicker = () => (
    <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8} mb="$4">
      <VStack space="md">
        <HStack alignItems="center" space="sm">
          <Building size={20} color="#6366f1" />
          <Heading size="md" color="$gray900">현장 아이콘</Heading>
        </HStack>
        
        <Box flexDirection="row" flexWrap="wrap" gap="$2">
          {FIELD_ICONS.map((iconOption) => (
            <Button
              key={iconOption}
              size="sm"
              variant={icon === iconOption ? "solid" : "outline"}
              action={icon === iconOption ? "primary" : "secondary"}
              onPress={() => setIcon(iconOption)}
              style={{ minWidth: 60 }}
            >
              <ButtonText fontSize={12}>
                {iconOption === 'construction' ? '건설' :
                 iconOption === 'building' ? '건물' :
                 iconOption === 'home' ? '집' :
                 iconOption === 'warehouse' ? '창고' :
                 iconOption === 'factory' ? '공장' :
                 iconOption === 'office' ? '사무실' :
                 iconOption === 'school' ? '학교' :
                 iconOption === 'hospital' ? '병원' :
                 iconOption === 'store' ? '상점' :
                 iconOption === 'apartment' ? '아파트' : iconOption}
              </ButtonText>
            </Button>
          ))}
        </Box>
      </VStack>
    </Card>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <StatusBar barStyle="dark-content" backgroundColor="white" translucent={false} />
      
      {/* 헤더 */}
      <Box bg="white" px="$4" py="$3" shadowOpacity={0.1} shadowRadius={4} shadowOffset={{ width: 0, height: 2 }}>
        <HStack justifyContent="space-between" alignItems="center">
          <HStack alignItems="center" space="sm">
            <Button variant="ghost" size="sm" onPress={() => navigation.goBack()}>
              <ButtonIcon as={ArrowLeft} />
            </Button>
            <VStack>
              <Heading size="lg" color="$gray900">현장 편집</Heading>
              <Text size="sm" color="$gray600">{field.name}</Text>
            </VStack>
          </HStack>
          <Button 
            action="primary" 
            size="sm"
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Spinner size="small" color="white" />
            ) : (
              <>
                <ButtonIcon as={Save} />
                <ButtonText>저장</ButtonText>
              </>
            )}
          </Button>
        </HStack>
      </Box>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* 기본 정보 */}
        <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8} mb="$4">
          <VStack space="md">
            <HStack alignItems="center" space="sm">
              <Type size={20} color="#6366f1" />
              <Heading size="md" color="$gray900">기본 정보</Heading>
            </HStack>
            
            <VStack space="sm">
              <Text size="sm" color="$gray700" fontWeight="medium">현장 이름 *</Text>
              <Input>
                <InputField
                  placeholder="현장 이름을 입력하세요"
                  value={name}
                  onChangeText={setName}
                  fontFamily="NotoSansKR_400Regular"
                />
              </Input>
            </VStack>

            <VStack space="sm">
              <Text size="sm" color="$gray700" fontWeight="medium">설명</Text>
              <Textarea>
                <TextareaInput
                  placeholder="현장에 대한 설명을 입력하세요 (선택사항)"
                  value={description}
                  onChangeText={setDescription}
                  fontFamily="NotoSansKR_400Regular"
                  multiline
                  numberOfLines={3}
                />
              </Textarea>
            </VStack>
          </VStack>
        </Card>

        {/* 색상 선택 */}
        {renderColorPicker()}

        {/* 아이콘 선택 */}
        {renderIconPicker()}

        {/* 미리보기 */}
        <Card bg="white" p="$4" borderRadius="$lg" shadowOpacity={0.1} shadowRadius={8} mb="$4">
          <VStack space="md">
            <HStack alignItems="center" space="sm">
              <FileText size={20} color="#6366f1" />
              <Heading size="md" color="$gray900">미리보기</Heading>
            </HStack>
            
            <Card bg="white" p="$4" borderRadius="$lg" borderWidth={1} borderColor="$gray200">
              <HStack alignItems="center" space="sm">
                <Box w="$6" h="$6" borderRadius="$full" bg={color} />
                <VStack flex={1}>
                  <Heading size="md" color="$gray900">{name || '현장 이름'}</Heading>
                  {description && (
                    <Text size="sm" color="$gray600" numberOfLines={2}>
                      {description}
                    </Text>
                  )}
                </VStack>
                <Box bg="$blue100" px="$2" py="$1" borderRadius="$sm">
                  <Text size="xs" color="$blue700" fontWeight="medium">
                    {icon === 'construction' ? '건설' :
                     icon === 'building' ? '건물' :
                     icon === 'home' ? '집' :
                     icon === 'warehouse' ? '창고' :
                     icon === 'factory' ? '공장' :
                     icon === 'office' ? '사무실' :
                     icon === 'school' ? '학교' :
                     icon === 'hospital' ? '병원' :
                     icon === 'store' ? '상점' :
                     icon === 'apartment' ? '아파트' : icon}
                  </Text>
                </Box>
              </HStack>
            </Card>
          </VStack>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditFieldScreen;

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
  Pressable,
  Center,
  Spinner
} from '@gluestack-ui/themed';
import { 
  ArrowLeft, 
  Save, 
  Palette,
  FileText,
  CheckCircle2
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { currentFieldApi, Field } from '../services/api';
import { TokenService } from '../services/tokenService';
import BottomNavigation from '../components/BottomNavigation';

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

const EditFieldScreen: React.FC<EditFieldScreenProps> = ({ navigation, route }) => {
  const { fieldId, field } = route.params;
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 폼 상태
  const [name, setName] = useState(field.name);
  const [description, setDescription] = useState(field.description || '');
  const [color, setColor] = useState(field.color);

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
        color: color
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
            {FIELD_COLORS.map((colorOption) => (
              <Pressable
                key={colorOption}
                onPress={() => setColor(colorOption)}
                w="$12"
                h="$12"
                bg={colorOption}
                borderRadius="$xl"
                borderWidth={color === colorOption ? 4 : 2}
                borderColor={color === colorOption ? "$gray900" : "$gray200"}
                m="$1"
                alignItems="center"
                justifyContent="center"
              >
                {color === colorOption && (
                  <CheckCircle2 size={20} color="#ffffff" strokeWidth={3} />
                )}
              </Pressable>
            ))}
          </HStack>
        </VStack>
      </VStack>
    </Card>
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
              onPress={() => navigation.goBack()}
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
              <Heading size="xl" color="$white" fontWeight="$bold">현장 편집</Heading>
              <Text size="sm" color="$blue100">{field.name}</Text>
            </VStack>
          </HStack>
          <Button 
            bg="$green600" 
            size="lg"
            borderRadius="$xl"
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Spinner size="small" color="white" />
            ) : (
              <>
                <ButtonIcon as={Save} mr="$2" />
                <ButtonText fontWeight="$bold">저장</ButtonText>
              </>
            )}
          </Button>
        </HStack>
      </Box>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <VStack space="lg">
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
          {renderColorPicker()}

          {/* 미리보기 */}
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
                  <FileText size={22} color="#2563eb" strokeWidth={2} />
                </Box>
                <Heading size="xl" color="$gray900" fontWeight="$bold">미리보기</Heading>
              </HStack>
              
              <Card bg="$gray50" p="$4" borderRadius="$xl" borderWidth={1} borderColor="$gray200">
                <HStack alignItems="center" space="sm">
                  <Box w="$8" h="$8" borderRadius="$full" bg={color} />
                  <VStack flex={1}>
                    <Heading size="lg" color="$gray900">{name || '현장 이름'}</Heading>
                    {description && (
                      <Text size="sm" color="$gray600" numberOfLines={2}>
                        {description}
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </Card>
            </VStack>
          </Card>
        </VStack>
      </ScrollView>
      
      {/* 하단 네비게이션 */}
      <BottomNavigation navigation={navigation} />
    </SafeAreaView>
  );
};

export default EditFieldScreen;

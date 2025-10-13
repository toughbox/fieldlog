import React, { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import {
  VStack,
  HStack,
  Text,
  Button,
  ButtonText,
  ButtonIcon,
  Card,
  Pressable,
  Image,
  Box,
  Center,
  Spinner
} from '@gluestack-ui/themed';
import { Camera, X, Plus } from 'lucide-react-native';
import { selectImages, uploadImages, deleteImage, ImageFile, UploadedImage, getImageUrl } from '../services/imageService';
import { TokenService } from '../services/tokenService';

interface ImagePickerProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  recordId?: string | number;
}

const ImagePickerComponent: React.FC<ImagePickerProps> = ({
  images,
  onImagesChange,
  maxImages = 10,
  recordId
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);

  const handleSelectImages = async () => {
    try {
      console.log('📸 이미지 선택 버튼 클릭됨');
      
      if (images.length >= maxImages) {
        Alert.alert('알림', `최대 ${maxImages}개의 이미지까지 첨부할 수 있습니다.`);
        return;
      }

      const remainingSlots = maxImages - images.length;
      console.log('📸 남은 슬롯:', remainingSlots);
      
      const selectedImages = await selectImages();
      console.log('📸 선택된 이미지 개수:', selectedImages.length);
      
      if (selectedImages.length === 0) {
        console.log('📸 선택된 이미지가 없음');
        return;
      }

      // 선택된 이미지가 남은 슬롯보다 많으면 제한
      const imagesToUpload = selectedImages.slice(0, remainingSlots);
      
      if (selectedImages.length > remainingSlots) {
        Alert.alert('알림', `${remainingSlots}개의 이미지만 업로드 가능합니다.`);
      }

      // recordId가 있는 경우에만 즉시 업로드
      if (recordId) {
        console.log('📸 기록 ID가 있음, 즉시 업로드');
        await uploadSelectedImages(imagesToUpload);
      } else {
        console.log('📸 기록 ID가 없음, 임시 저장');
        // recordId가 없으면 임시로 로컬 이미지로 저장 (나중에 업로드)
        const tempImages: UploadedImage[] = imagesToUpload.map((img, index) => ({
          fileName: `temp_${Date.now()}_${index}`,
          url: img.uri.startsWith('file://') ? img.uri : `file://${img.uri}`,
          size: img.size,
          tempFile: img // 임시 파일 정보 저장
        }));
        onImagesChange([...images, ...tempImages]);
      }
    } catch (error) {
      console.error('📸 이미지 선택 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      Alert.alert('오류', `이미지 선택 중 오류가 발생했습니다: ${errorMessage}`);
    }
  };

  const uploadSelectedImages = async (selectedImages: ImageFile[]) => {
    try {
      setIsUploading(true);
      setUploadingCount(selectedImages.length);

      const accessToken = await TokenService.getAccessToken();
      if (!accessToken) {
        Alert.alert('오류', '인증 토큰이 없습니다.');
        return;
      }

      const uploadedImages = await uploadImages(selectedImages, recordId!, accessToken);
      
      // 업로드된 이미지의 URL을 전체 URL로 변환
      const imagesWithFullUrls = uploadedImages.map(img => {
        let fullUrl = img.url;
        if (!fullUrl.startsWith('http')) {
          // 상대 경로인 경우 전체 URL로 변환
          const fileName = fullUrl.split('/').pop() || img.fileName;
          fullUrl = getImageUrl(fileName);
          console.log('🖼️ 업로드된 이미지 URL 변환:', { 
            fileName, 
            originalUrl: img.url, 
            fullUrl 
          });
        }
        return {
          ...img,
          url: fullUrl
        };
      });
      
      onImagesChange([...images, ...imagesWithFullUrls]);
      
      Alert.alert('성공', `${uploadedImages.length}개의 이미지가 업로드되었습니다.`);
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      Alert.alert('오류', '이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      setUploadingCount(0);
    }
  };

  const handleRemoveImage = async (imageToRemove: UploadedImage, index: number) => {
    try {
      // 임시 이미지가 아닌 경우에만 서버에서 삭제
      if (!imageToRemove.tempFile && recordId) {
        const accessToken = await TokenService.getAccessToken();
        if (accessToken) {
          await deleteImage(imageToRemove.fileName, accessToken);
        }
      }

      const updatedImages = images.filter((_, i) => i !== index);
      onImagesChange(updatedImages);
    } catch (error) {
      console.error('이미지 삭제 오류:', error);
      Alert.alert('오류', '이미지 삭제 중 오류가 발생했습니다.');
    }
  };

  const renderImageItem = (image: UploadedImage, index: number) => (
    <Box key={index} position="relative" m="$1">
      <Box w={80} h={80} borderRadius="$md" overflow="hidden">
        <Image
          source={{ uri: image.url }}
          alt={`첨부 이미지 ${index + 1}`}
          w="$full"
          h="$full"
        />
      </Box>
      <Pressable
        position="absolute"
        top="$1"
        right="$1"
        bg="$red500"
        borderRadius="$full"
        w={20}
        h={20}
        onPress={() => handleRemoveImage(image, index)}
      >
        <Center flex={1}>
          <X size={12} color="white" />
        </Center>
      </Pressable>
    </Box>
  );

  return (
    <VStack space="sm">
      <HStack justifyContent="space-between" alignItems="center">
        <Text size="sm" color="$gray600">
          사진 첨부 ({images.length}/{maxImages})
        </Text>
        {!isUploading && images.length < maxImages && (
          <Button size="sm" action="secondary" onPress={handleSelectImages}>
            <ButtonIcon as={Camera} size="sm" />
            <ButtonText>사진 선택</ButtonText>
          </Button>
        )}
      </HStack>

      {isUploading && (
        <Card bg="$blue50" p="$3" borderRadius="$md">
          <HStack space="sm" alignItems="center">
            <Spinner size="small" />
            <Text size="sm" color="$blue600">
              {uploadingCount}개 이미지 업로드 중...
            </Text>
          </HStack>
        </Card>
      )}

      {images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <HStack space="sm" p="$2">
            {images.map((image, index) => (
              <Box key={image.fileName || `image-${index}`}>
                {renderImageItem(image, index)}
              </Box>
            ))}
            {!isUploading && images.length < maxImages && (
              <Pressable onPress={handleSelectImages}>
                <Box
                  w={80}
                  h={80}
                  bg="$gray100"
                  borderRadius="$md"
                  borderWidth={2}
                  borderColor="$gray300"
                  borderStyle="dashed"
                >
                  <Center flex={1}>
                    <Plus size={24} color="#9ca3af" />
                  </Center>
                </Box>
              </Pressable>
            )}
          </HStack>
        </ScrollView>
      )}

      {images.length === 0 && !isUploading && (
        <Pressable onPress={handleSelectImages}>
          <Card bg="$gray50" p="$4" borderRadius="$md" borderWidth={2} borderColor="$gray200" borderStyle="dashed">
            <Center>
              <Camera size={32} color="#9ca3af" />
              <Text size="sm" color="$gray500" mt="$2">
                사진을 선택하여 첨부하세요
              </Text>
            </Center>
          </Card>
        </Pressable>
      )}
    </VStack>
  );
};

export default ImagePickerComponent;

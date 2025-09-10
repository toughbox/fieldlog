import React, { useState } from 'react';
import { Dimensions, FlatList, Image as RNImage } from 'react-native';
import Constants from 'expo-constants';
import {
  VStack,
  HStack,
  Text,
  Pressable,
  Image,
  Box,
  Center,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Button,
  ButtonText,
  ButtonIcon
} from '@gluestack-ui/themed';
import { X, Camera } from 'lucide-react-native';

// 이미지 URL 생성 함수
const getFullImageUrl = (url: string): string => {
  if (url.startsWith('http')) {
    return url; // 이미 전체 URL인 경우
  }
  // 상대 경로인 경우 백엔드 API를 통해 서빙
  const baseUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3030';
  return `${baseUrl}${url}`;
};

interface ImageSliderProps {
  attachments: Array<{
    name: string;
    url: string;
    type: string;
    size?: number;
  }>;
}

const { width: screenWidth } = Dimensions.get('window');
const imageWidth = screenWidth - 40; // 좌우 패딩 고려
const imageHeight = 280;

const ImageSlider: React.FC<ImageSliderProps> = ({ attachments }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());
  const [touchStartX, setTouchStartX] = useState(0);

  // 이미지 파일만 필터링
  const imageAttachments = attachments.filter(att => 
    att.type === 'image' || 
    att.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)
  );

  if (imageAttachments.length === 0) {
    return null;
  }

  const handleImagePress = (index: number) => {
    const imageUrl = getFullImageUrl(imageAttachments[index]?.url);
    console.log('🖼️ 이미지 클릭:', {
      index,
      fileName: imageAttachments[index]?.name,
      originalUrl: imageAttachments[index]?.url,
      fullUrl: imageUrl,
      imageLoadError: imageLoadErrors.has(index),
      totalImages: imageAttachments.length,
      allImages: imageAttachments.map((img, i) => ({ index: i, name: img.name, url: img.url }))
    });
    setSelectedImageIndex(index);
    setIsModalOpen(true);
  };

  const handleImageError = (index: number) => {
    console.log('❌ 이미지 로딩 오류:', {
      index,
      fileName: imageAttachments[index]?.name,
      url: getFullImageUrl(imageAttachments[index]?.url)
    });
    setImageLoadErrors(prev => new Set(prev).add(index));
    setLoadingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  const handleImageLoadStart = (index: number) => {
    console.log('🔄 이미지 로딩 시작:', {
      index,
      fileName: imageAttachments[index]?.name,
      url: getFullImageUrl(imageAttachments[index]?.url)
    });
    setLoadingImages(prev => new Set(prev).add(index));
  };

  const handleImageLoad = (index: number) => {
    console.log('✅ 이미지 로딩 성공:', {
      index,
      fileName: imageAttachments[index]?.name,
      url: getFullImageUrl(imageAttachments[index]?.url)
    });
    setLoadingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  const handlePreviousImage = () => {
    const newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : imageAttachments.length - 1;
    console.log('⬅️ 이전 이미지로 이동:', { from: selectedImageIndex, to: newIndex });
    setSelectedImageIndex(newIndex);
    // 로딩 상태 초기화
    setLoadingImages(new Set());
    setImageLoadErrors(new Set());
  };

  const handleNextImage = () => {
    const newIndex = selectedImageIndex < imageAttachments.length - 1 ? selectedImageIndex + 1 : 0;
    console.log('➡️ 다음 이미지로 이동:', { from: selectedImageIndex, to: newIndex });
    setSelectedImageIndex(newIndex);
    // 로딩 상태 초기화
    setLoadingImages(new Set());
    setImageLoadErrors(new Set());
  };

  // 스와이프 제스처 핸들러
  const handleTouchStart = (event: any) => {
    setTouchStartX(event.nativeEvent.pageX);
  };

  const handleTouchEnd = (event: any) => {
    const touchEndX = event.nativeEvent.pageX;
    const deltaX = touchStartX - touchEndX;
    const minSwipeDistance = 50; // 최소 스와이프 거리

    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // 왼쪽으로 스와이프 (다음 이미지)
        handleNextImage();
      } else {
        // 오른쪽으로 스와이프 (이전 이미지)
        handlePreviousImage();
      }
    }
  };

  const renderImageItem = ({ item, index }: { item: any; index: number }) => {
    const hasError = imageLoadErrors.has(index);
    const imageUrl = getFullImageUrl(item.url);
    
    return (
      <Pressable onPress={() => handleImagePress(index)}>
        <Box
          width={imageWidth}
          height={imageHeight}
          borderRadius="$lg"
          overflow="hidden"
          bg="$gray100"
          mr={index < imageAttachments.length - 1 ? "$3" : "$0"}
        >
          {hasError ? (
            <Center flex={1} bg="$gray200">
              <Text color="$gray500" textAlign="center">
                이미지 로딩 실패
              </Text>
            </Center>
          ) : (
            <RNImage
              source={{ uri: imageUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              onError={() => handleImageError(index)}
            />
          )}
        </Box>
      </Pressable>
    );
  };

  return (
    <>
      <VStack space="md">
        <HStack alignItems="center" space="sm">
          <Camera size={20} color="#6366f1" />
          <Text fontWeight="600" color="$gray900">
            첨부 이미지 ({imageAttachments.length}개)
          </Text>
        </HStack>

        <FlatList
          data={imageAttachments}
          renderItem={renderImageItem}
          keyExtractor={(item, index) => `${item.name}-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        />
      </VStack>

      {/* 이미지 확대 모달 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="full"
      >
        <ModalBackdrop />
        <ModalContent 
          bg="white" 
          w="$full" 
          h="$full" 
          m="$0" 
          p="$0"
        >
          {/* 닫기 버튼 */}
          <Box position="absolute" top="$12" right="$4" zIndex={10}>
            <Button
              variant="outline"
              bg="rgba(0,0,0,0.1)"
              borderColor="rgba(0,0,0,0.2)"
              borderRadius="$full"
              size="sm"
              onPress={() => setIsModalOpen(false)}
            >
              <ButtonIcon as={X} color="$gray700" />
            </Button>
          </Box>
          
          {/* 이미지 컨테이너 */}
          <Center 
            flex={1} 
            w="$full" 
            h="$full"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {imageLoadErrors.has(selectedImageIndex) ? (
              <VStack alignItems="center" space="md" p="$4">
                <Text color="$gray800" textAlign="center" fontSize={18}>
                  이미지를 불러올 수 없습니다
                </Text>
                <Text color="$gray600" textAlign="center" fontSize={14}>
                  {imageAttachments[selectedImageIndex]?.name}
                </Text>
                <Button 
                  variant="outline" 
                  borderColor="$gray300"
                  bg="$gray50"
                  onPress={() => {
                    setImageLoadErrors(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(selectedImageIndex);
                      return newSet;
                    });
                  }}
                >
                  <ButtonText color="$gray700">다시 시도</ButtonText>
                </Button>
              </VStack>
            ) : loadingImages.has(selectedImageIndex) ? (
              <VStack alignItems="center" space="md">
                <Text color="$gray800" fontSize={18}>이미지 로딩 중...</Text>
                <Text color="$gray600" fontSize={12}>
                  {imageAttachments[selectedImageIndex]?.name}
                </Text>
              </VStack>
            ) : (
              <Box position="relative">
                {(() => {
                  const currentImage = imageAttachments[selectedImageIndex];
                  if (!currentImage) {
                    return <Text color="$gray800">이미지를 찾을 수 없습니다</Text>;
                  }
                  
                  const imageUrl = getFullImageUrl(currentImage.url);
                  return (
                    <RNImage
                      key={`modal-image-${selectedImageIndex}`}
                      source={{ uri: imageUrl }}
                      style={{ 
                        width: screenWidth - 40, 
                        height: (screenWidth - 40) * 0.75,
                        borderRadius: 8
                      }}
                      resizeMode="contain"
                      onLoad={() => {
                        console.log('✅ 모달 이미지 로딩 완료:', selectedImageIndex);
                        setLoadingImages(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(selectedImageIndex);
                          return newSet;
                        });
                      }}
                      onError={(error) => {
                        console.log('❌ 모달 이미지 로딩 오류:', {
                          index: selectedImageIndex,
                          error,
                          url: imageUrl,
                          fileName: currentImage.name
                        });
                        setImageLoadErrors(prev => new Set(prev).add(selectedImageIndex));
                        setLoadingImages(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(selectedImageIndex);
                          return newSet;
                        });
                      }}
                    />
                  );
                })()}
                
              </Box>
            )}
          </Center>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ImageSlider;

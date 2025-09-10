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
import { X, ChevronLeft, ChevronRight, Camera } from 'lucide-react-native';

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
const imageHeight = 200;

const ImageSlider: React.FC<ImageSliderProps> = ({ attachments }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());

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
          bg="black" 
          w="$full" 
          h="$full" 
          m="$0" 
          p="$0"
          justifyContent="center"
          alignItems="center"
        >
          <ModalHeader p="$2" bg="transparent" position="absolute" top="$0" right="$0" zIndex={10}>
            <HStack justifyContent="flex-end" alignItems="center" width="$full">
              <ModalCloseButton bg="rgba(0,0,0,0.5)" borderRadius="$full">
                <ButtonIcon as={X} color="white" />
              </ModalCloseButton>
            </HStack>
          </ModalHeader>
          
          <ModalBody flex={1} p="$0">
            <Box flex={1} w="$full" h="$full" justifyContent="center" alignItems="center">
              {imageLoadErrors.has(selectedImageIndex) ? (
                <Center flex={1} bg="$gray800" w="$full" h="$full">
                  <VStack alignItems="center" space="md" p="$4">
                    <Text color="white" textAlign="center" fontSize={18}>
                      이미지를 불러올 수 없습니다
                    </Text>
                    <Text color="white" textAlign="center" fontSize={14} opacity={0.7}>
                      {imageAttachments[selectedImageIndex]?.name}
                    </Text>
                    <Text color="white" textAlign="center" fontSize={12} opacity={0.5}>
                      URL: {getFullImageUrl(imageAttachments[selectedImageIndex]?.url)}
                    </Text>
                    <Button 
                      variant="outline" 
                      borderColor="white"
                      onPress={() => {
                        setImageLoadErrors(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(selectedImageIndex);
                          return newSet;
                        });
                      }}
                    >
                      <ButtonText color="white">다시 시도</ButtonText>
                    </Button>
                  </VStack>
                </Center>
              ) : loadingImages.has(selectedImageIndex) ? (
                <Center flex={1} bg="$gray900" w="$full" h="$full">
                  <VStack alignItems="center" space="md">
                    <Text color="white" fontSize={18}>이미지 로딩 중...</Text>
                    <Text color="white" fontSize={12} opacity={0.7}>
                      {imageAttachments[selectedImageIndex]?.name}
                    </Text>
                  </VStack>
                </Center>
              ) : (
                <Box flex={1} w="$full" h="$full" justifyContent="center" alignItems="center">
                  {(() => {
                    const currentImage = imageAttachments[selectedImageIndex];
                    if (!currentImage) {
                      console.log('❌ 현재 이미지가 없음:', { selectedImageIndex, totalImages: imageAttachments.length });
                      return (
                        <Center flex={1}>
                          <Text color="white">이미지를 찾을 수 없습니다</Text>
                        </Center>
                      );
                    }
                    
                    const imageUrl = getFullImageUrl(currentImage.url);
                    console.log('🖼️ 모달에서 이미지 렌더링:', {
                      index: selectedImageIndex,
                      fileName: currentImage.name,
                      originalUrl: currentImage.url,
                      fullUrl: imageUrl
                    });
                    
                    return (
                      <RNImage
                        key={`modal-image-${selectedImageIndex}`}
                        source={{ uri: imageUrl }}
                        style={{ 
                          width: screenWidth - 40, 
                          height: (screenWidth - 40) * 0.75,
                          backgroundColor: 'transparent'
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
              
              {/* 이전/다음 버튼 */}
              {imageAttachments.length > 1 && (
                <>
                  <Button
                    position="absolute"
                    left="$4"
                    top="50%"
                    transform={[{ translateY: -20 }]}
                    variant="outline"
                    bg="rgba(0,0,0,0.5)"
                    borderColor="white"
                    onPress={handlePreviousImage}
                    zIndex={10}
                  >
                    <ButtonIcon as={ChevronLeft} color="white" />
                  </Button>
                  
                  <Button
                    position="absolute"
                    right="$4"
                    top="50%"
                    transform={[{ translateY: -20 }]}
                    variant="outline"
                    bg="rgba(0,0,0,0.5)"
                    borderColor="white"
                    onPress={handleNextImage}
                    zIndex={10}
                  >
                    <ButtonIcon as={ChevronRight} color="white" />
                  </Button>
                </>
              )}
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ImageSlider;

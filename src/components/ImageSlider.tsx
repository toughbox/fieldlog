import React, { useState } from 'react';
import { Dimensions, FlatList, Image as RNImage } from 'react-native';
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
  const baseUrl = 'http://192.168.206.171:3030';
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

  // 이미지 파일만 필터링
  const imageAttachments = attachments.filter(att => 
    att.type === 'image' || 
    att.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)
  );

  if (imageAttachments.length === 0) {
    return null;
  }

  const handleImagePress = (index: number) => {
    console.log('🖼️ 이미지 클릭:', {
      index,
      fileName: imageAttachments[index]?.name,
      originalUrl: imageAttachments[index]?.url,
      fullUrl: getFullImageUrl(imageAttachments[index]?.url)
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
  };

  const handlePreviousImage = () => {
    setSelectedImageIndex(prev => 
      prev > 0 ? prev - 1 : imageAttachments.length - 1
    );
  };

  const handleNextImage = () => {
    setSelectedImageIndex(prev => 
      prev < imageAttachments.length - 1 ? prev + 1 : 0
    );
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
        <ModalContent bg="black">
          <ModalHeader>
            <HStack justifyContent="flex-end" alignItems="center" width="$full">
              <ModalCloseButton>
                <ButtonIcon as={X} color="white" />
              </ModalCloseButton>
            </HStack>
          </ModalHeader>
          
          <ModalBody flex={1}>
            <Center flex={1} position="relative">
              {imageLoadErrors.has(selectedImageIndex) ? (
                <Center flex={1} bg="$gray800">
                  <VStack alignItems="center" space="md">
                    <Text color="white" textAlign="center" fontSize={18}>
                      이미지를 불러올 수 없습니다
                    </Text>
                    <Text color="white" textAlign="center" fontSize={14} opacity={0.7}>
                      {imageAttachments[selectedImageIndex]?.name}
                    </Text>
                    <Text color="white" textAlign="center" fontSize={12} opacity={0.5}>
                      URL: {getFullImageUrl(imageAttachments[selectedImageIndex]?.url)}
                    </Text>
                  </VStack>
                </Center>
              ) : (
                <RNImage
                  source={{ 
                    uri: getFullImageUrl(imageAttachments[selectedImageIndex]?.url),
                    cache: 'force-cache'
                  }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                  onError={() => {
                    console.log('❌ 팝업 이미지 로딩 오류:', {
                      url: getFullImageUrl(imageAttachments[selectedImageIndex]?.url),
                      fileName: imageAttachments[selectedImageIndex]?.name
                    });
                    handleImageError(selectedImageIndex);
                  }}
                  onLoad={() => {
                    console.log('✅ 팝업 이미지 로딩 성공:', {
                      url: getFullImageUrl(imageAttachments[selectedImageIndex]?.url),
                      fileName: imageAttachments[selectedImageIndex]?.name
                    });
                  }}
                />
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
                  >
                    <ButtonIcon as={ChevronRight} color="white" />
                  </Button>
                </>
              )}
            </Center>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ImageSlider;

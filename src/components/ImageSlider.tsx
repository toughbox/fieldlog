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

  // 이미지 파일만 필터링
  const imageAttachments = attachments.filter(att => 
    att.type === 'image' || 
    att.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)
  );

  if (imageAttachments.length === 0) {
    return null;
  }

  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index);
    setIsModalOpen(true);
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

  const renderImageItem = ({ item, index }: { item: any; index: number }) => (
    <Pressable onPress={() => handleImagePress(index)}>
      <Box
        width={imageWidth}
        height={imageHeight}
        borderRadius="$lg"
        overflow="hidden"
        bg="$gray100"
        mr={index < imageAttachments.length - 1 ? "$3" : "$0"}
      >
        <RNImage
          source={{ uri: item.url }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        <Box
          position="absolute"
          bottom="$2"
          left="$2"
          right="$2"
          bg="rgba(0,0,0,0.6)"
          borderRadius="$sm"
          p="$2"
        >
          <Text color="white" size="sm" numberOfLines={1}>
            {item.name}
          </Text>
        </Box>
      </Box>
    </Pressable>
  );

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
            <HStack justifyContent="space-between" alignItems="center" width="$full">
              <Text color="white" fontWeight="600">
                {imageAttachments[selectedImageIndex]?.name}
              </Text>
              <ModalCloseButton>
                <ButtonIcon as={X} color="white" />
              </ModalCloseButton>
            </HStack>
          </ModalHeader>
          
          <ModalBody flex={1}>
            <Center flex={1} position="relative">
              <RNImage
                source={{ uri: imageAttachments[selectedImageIndex]?.url }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
              
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

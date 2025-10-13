import React, { useState, useRef } from 'react';
import { Dimensions, FlatList, Image as RNImage, Animated as RNAnimated } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
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
  if (url.startsWith('http') || url.startsWith('file://')) {
    return url; // 이미 전체 URL이거나 로컬 파일인 경우
  }
  
  // api.ts와 동일한 설정 사용
  const API_HOST = process.env.EXPO_PUBLIC_API_HOST || 'toughdev.cafe24.com';
  const API_PORT = process.env.EXPO_PUBLIC_API_PORT || '3030';
  const baseUrl = `http://${API_HOST}:${API_PORT}`;
  const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
  
  console.log('🖼️ 이미지 URL 변환:', { 
    originalUrl: url, 
    API_HOST,
    API_PORT,
    baseUrl, 
    fullUrl 
  });
  
  return fullUrl;
};

interface ImageSliderProps {
  attachments: Array<{
    name: string;
    url: string;
    type: string;
    size?: number;
  }>;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const imageWidth = screenWidth - 40; // 좌우 패딩 고려
const imageHeight = 280;

// 확대/축소 가능한 이미지 컴포넌트
interface ZoomableImageProps {
  imageUrl: string;
  onClose: () => void;
  onLoadStart?: () => void;
  onLoad?: () => void;
  onError?: () => void;
}

const ZoomableImage: React.FC<ZoomableImageProps> = ({ 
  imageUrl, 
  onClose,
  onLoadStart,
  onLoad,
  onError 
}) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // 핀치 제스처
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newScale = savedScale.value * event.scale;
      scale.value = Math.max(1, Math.min(newScale, 5)); // 1배 ~ 5배
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  // 팬 제스처 (드래그)
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      
      // 경계 체크
      const maxTranslateX = (screenWidth * (scale.value - 1)) / 2;
      const maxTranslateY = (screenHeight * (scale.value - 1)) / 2;

      if (translateX.value > maxTranslateX) {
        translateX.value = withSpring(maxTranslateX);
        savedTranslateX.value = maxTranslateX;
      } else if (translateX.value < -maxTranslateX) {
        translateX.value = withSpring(-maxTranslateX);
        savedTranslateX.value = -maxTranslateX;
      }

      if (translateY.value > maxTranslateY) {
        translateY.value = withSpring(maxTranslateY);
        savedTranslateY.value = maxTranslateY;
      } else if (translateY.value < -maxTranslateY) {
        translateY.value = withSpring(-maxTranslateY);
        savedTranslateY.value = -maxTranslateY;
      }
    });

  // 더블 탭 제스처
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        // 축소
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // 확대
        scale.value = withSpring(2.5);
        savedScale.value = 2.5;
      }
    });

  // 제스처 합성
  const composedGesture = Gesture.Simultaneous(
    doubleTapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture)
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Animated.View style={[animatedStyle]}>
            <RNImage
              source={{ uri: imageUrl }}
              style={{
                width: screenWidth,
                height: screenHeight * 0.8,
              }}
              resizeMode="contain"
              onLoadStart={() => onLoadStart?.()}
              onLoad={() => onLoad?.()}
              onError={() => onError?.()}
            />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const ImageSlider: React.FC<ImageSliderProps> = ({ attachments }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());
  const [touchStartX, setTouchStartX] = useState(0);
  
  // 애니메이션 관련 상태
  const slideAnim = useRef(new RNAnimated.Value(0)).current;
  const fadeAnim = useRef(new RNAnimated.Value(1)).current;

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

  // 애니메이션과 함께 이미지 변경
  const animateImageChange = (newIndex: number, direction: 'left' | 'right') => {
    const slideDistance = screenWidth * 0.3; // 슬라이드 거리
    const slideValue = direction === 'left' ? -slideDistance : slideDistance;
    
    // 페이드 아웃과 슬라이드 아웃
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      RNAnimated.timing(slideAnim, {
        toValue: slideValue,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => {
      // 이미지 인덱스 변경
      setSelectedImageIndex(newIndex);
      setLoadingImages(new Set());
      setImageLoadErrors(new Set());
      
      // 애니메이션 값 초기화
      slideAnim.setValue(0);
      
      // 페이드 인과 슬라이드 인
      RNAnimated.parallel([
        RNAnimated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        RNAnimated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        })
      ]).start();
    });
  };

  const handlePreviousImage = () => {
    const newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : imageAttachments.length - 1;
    console.log('⬅️ 이전 이미지로 이동:', { from: selectedImageIndex, to: newIndex });
    animateImageChange(newIndex, 'right');
  };

  const handleNextImage = () => {
    const newIndex = selectedImageIndex < imageAttachments.length - 1 ? selectedImageIndex + 1 : 0;
    console.log('➡️ 다음 이미지로 이동:', { from: selectedImageIndex, to: newIndex });
    animateImageChange(newIndex, 'left');
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
              (() => {
                const currentImage = imageAttachments[selectedImageIndex];
                if (!currentImage) {
                  return <Text color="$gray800">이미지를 찾을 수 없습니다</Text>;
                }
                
                const imageUrl = getFullImageUrl(currentImage.url);
                return (
                  <ZoomableImage 
                    imageUrl={imageUrl}
                    onClose={() => setIsModalOpen(false)}
                    onLoadStart={() => {
                      console.log('🔄 줌 가능 이미지 로딩 시작:', selectedImageIndex);
                      setLoadingImages(prev => new Set(prev).add(selectedImageIndex));
                    }}
                    onLoad={() => {
                      console.log('✅ 줌 가능 이미지 로딩 완료:', selectedImageIndex);
                      setLoadingImages(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(selectedImageIndex);
                        return newSet;
                      });
                    }}
                    onError={() => {
                      console.log('❌ 줌 가능 이미지 로딩 오류:', selectedImageIndex);
                      setImageLoadErrors(prev => new Set(prev).add(selectedImageIndex));
                      setLoadingImages(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(selectedImageIndex);
                        return newSet;
                      });
                    }}
                  />
                );
              })()
            )}
          </Center>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ImageSlider;

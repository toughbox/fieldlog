import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

export interface ImageFile {
  uri: string;
  fileName: string;
  type: string;
  size: number;
  base64?: string;
}

export interface UploadedImage {
  fileName: string;
  url: string;
  size: number;
  tempFile?: ImageFile; // 임시 파일 정보
}

// 이미지 압축 및 리사이징 설정
const MAX_IMAGE_SIZE = 1200; // 최대 크기 (긴 쪽 기준, px)
const COMPRESS_QUALITY = 0.7; // 압축 품질 (70%)

// 이미지 압축 함수 (원본 비율 유지)
const compressImage = async (uri: string): Promise<{ uri: string; width: number; height: number }> => {
  try {
    console.log('🔄 이미지 압축 시작:', uri);
    
    // 이미지 리사이징 및 압축
    // width만 지정하면 비율을 유지하면서 자동으로 리사이징됨
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [
        { 
          resize: { 
            width: MAX_IMAGE_SIZE // 비율 유지하면서 width를 기준으로 리사이징
          } 
        }
      ],
      { 
        compress: COMPRESS_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG
      }
    );
    
    console.log('✅ 이미지 압축 완료 (비율 유지):', {
      originalUri: uri.substring(uri.length - 30), // URI 마지막 30자만 표시
      compressedUri: manipResult.uri.substring(manipResult.uri.length - 30),
      resultSize: `${manipResult.width}x${manipResult.height}`,
      aspectRatio: (manipResult.width / manipResult.height).toFixed(2)
    });
    
    return manipResult;
  } catch (error) {
    console.error('❌ 이미지 압축 오류:', error);
    // 압축 실패 시 원본 반환
    return { uri, width: 0, height: 0 };
  }
};

// 이미지 선택 함수
export const selectImages = async (maxCount: number = 10): Promise<ImageFile[]> => {
  try {
    console.log('📸 이미지 선택 시작, 최대:', maxCount);
    
    // 권한 요청
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      console.log('📸 갤러리 권한이 거부됨');
      throw new Error('갤러리 접근 권한이 필요합니다.');
    }

    console.log('📸 갤러리 권한 허용됨');
    
    // 이미지 선택
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1, // 선택 시에는 원본 품질로 (압축은 나중에 수동으로)
      selectionLimit: maxCount, // 동적으로 제한
    });

    console.log('📸 이미지 선택 결과:', result);

    if (result.canceled) {
      console.log('📸 이미지 선택 취소됨');
      return [];
    }

    if (result.assets && result.assets.length > 0) {
      console.log(`📸 ${result.assets.length}개 이미지 압축 처리 중...`);
      
      // 각 이미지를 압축 처리
      const imageFiles: ImageFile[] = await Promise.all(
        result.assets.map(async (asset, index) => {
          const originalSize = asset.fileSize || 0;
          console.log(`📸 [${index + 1}/${result.assets.length}] 원본 크기: ${(originalSize / 1024 / 1024).toFixed(2)}MB`);
          
          // 이미지 압축
          const compressed = await compressImage(asset.uri);
          
          // 압축된 파일의 실제 크기 가져오기
          let compressedSize = 0;
          try {
            const fileInfo = await FileSystem.getInfoAsync(compressed.uri);
            if (fileInfo.exists && 'size' in fileInfo) {
              compressedSize = fileInfo.size;
            }
          } catch (error) {
            console.warn('⚠️ 파일 크기 확인 실패, 추정값 사용:', error);
            compressedSize = Math.floor(originalSize * COMPRESS_QUALITY);
          }
          
          // 파일 이름 생성
          const fileName = asset.fileName 
            ? asset.fileName.replace(/\.[^/.]+$/, '.jpg') // 확장자를 jpg로 변경
            : `image_${Date.now()}_${index}.jpg`;
          
          const reductionPercent = originalSize > 0 
            ? Math.round((1 - compressedSize / originalSize) * 100)
            : 0;
          
          console.log(`📸 [${index + 1}/${result.assets.length}] 압축 완료: ${(compressedSize / 1024 / 1024).toFixed(2)}MB (${reductionPercent}% 절감)`);
          
          return {
            uri: compressed.uri,
            fileName: fileName,
            type: 'image/jpeg',
            size: compressedSize,
          };
        })
      );
      
      console.log(`📸 총 ${imageFiles.length}개 이미지 압축 완료`);
      return imageFiles;
    } else {
      console.log('📸 선택된 이미지 없음');
      return [];
    }
  } catch (error) {
    console.error('📸 이미지 선택 오류:', error);
    throw error;
  }
};

// MinIO 업로드 함수 (백엔드 API를 통해 처리)
export const uploadImages = async (
  images: ImageFile[], 
  recordId: string | number,
  accessToken: string
): Promise<UploadedImage[]> => {
  const uploadedImages: UploadedImage[] = [];
  
  for (const image of images) {
    try {
      console.log(`📸 이미지 업로드 시작: ${image.fileName}`);
      
      // FormData 생성 (React Native 방식)
      const formData = new FormData();
      formData.append('image', {
        uri: image.uri,
        type: image.type,
        name: image.fileName,
      } as any);
      formData.append('recordId', recordId.toString());
      
      console.log(`📸 FormData 생성됨:`, {
        uri: image.uri,
        type: image.type,
        name: image.fileName,
        recordId: recordId.toString()
      });
      
      // API URL 설정 (api.ts와 동일한 방식)
      const API_HOST = process.env.EXPO_PUBLIC_API_HOST || 'toughdev.cafe24.com';
      const API_PORT = process.env.EXPO_PUBLIC_API_PORT || '3030';
      const apiUrl = `http://${API_HOST}:${API_PORT}/api/upload/image`;
      console.log(`📸 업로드 URL: ${apiUrl}`);
      
      // 백엔드 API 호출
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          // Content-Type은 FormData가 자동으로 설정합니다
        },
        body: formData,
      });
      
      console.log(`📸 업로드 응답 상태: ${response.status}`);
      
      const result = await response.json();
      console.log(`📸 업로드 응답:`, result);
      
      if (response.ok && result.success) {
        uploadedImages.push({
          fileName: result.data.fileName,
          url: result.data.url,
          size: image.size,
        });
        console.log(`📸 이미지 업로드 성공: ${image.fileName}`);
      } else {
        throw new Error(result.error || '이미지 업로드 실패');
      }
    } catch (error) {
      console.error(`📸 이미지 업로드 오류 (${image.fileName}):`, error);
      throw error;
    }
  }
  
  return uploadedImages;
};

// 이미지 삭제 함수
export const deleteImage = async (
  fileName: string,
  accessToken: string
): Promise<boolean> => {
  try {
    // API URL 설정 (api.ts와 동일한 방식)
    const API_HOST = process.env.EXPO_PUBLIC_API_HOST || 'toughdev.cafe24.com';
    const API_PORT = process.env.EXPO_PUBLIC_API_PORT || '3030';
    const apiUrl = `http://${API_HOST}:${API_PORT}/api/upload/image/${fileName}`;
    
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    const result = await response.json();
    return response.ok && result.success;
  } catch (error) {
    console.error('이미지 삭제 오류:', error);
    return false;
  }
};

// 이미지 URL 생성 함수
export const getImageUrl = (fileName: string): string => {
  // API URL 설정 (api.ts와 동일한 방식)
  const API_HOST = process.env.EXPO_PUBLIC_API_HOST || 'toughdev.cafe24.com';
  const API_PORT = process.env.EXPO_PUBLIC_API_PORT || '3030';
  return `http://${API_HOST}:${API_PORT}/api/upload/image/${fileName}`;
};

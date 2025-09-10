import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';

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

// expo-image-picker는 함수 내에서 옵션을 직접 설정합니다

// 이미지 선택 함수
export const selectImages = async (): Promise<ImageFile[]> => {
  try {
    console.log('📸 이미지 선택 시작');
    
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
      quality: 0.8,
      selectionLimit: 10,
    });

    console.log('📸 이미지 선택 결과:', result);

    if (result.canceled) {
      console.log('📸 이미지 선택 취소됨');
      return [];
    }

    if (result.assets && result.assets.length > 0) {
      const imageFiles: ImageFile[] = result.assets.map(asset => {
        // 파일 확장자로부터 MIME 타입 결정
        const fileName = asset.fileName || `image_${Date.now()}.jpg`;
        const extension = fileName.split('.').pop()?.toLowerCase();
        let mimeType = 'image/jpeg'; // 기본값
        
        if (extension === 'png') mimeType = 'image/png';
        else if (extension === 'gif') mimeType = 'image/gif';
        else if (extension === 'webp') mimeType = 'image/webp';
        else if (extension === 'jpg' || extension === 'jpeg') mimeType = 'image/jpeg';
        
        return {
          uri: asset.uri,
          fileName: fileName,
          type: mimeType,
          size: asset.fileSize || 0,
        };
      });
      console.log('📸 선택된 이미지들:', imageFiles);
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
      
      // API URL 설정
      const baseUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3030';
      const apiUrl = `${baseUrl}/api/upload/image`;
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
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3030'}/api/upload/image/${fileName}`, {
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
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3030';
  return `${baseUrl}/api/upload/image/${fileName}`;
};

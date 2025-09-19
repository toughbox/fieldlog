import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserData {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

export class TokenService {
  private static ACCESS_TOKEN_KEY = 'access_token';
  private static REFRESH_TOKEN_KEY = 'refresh_token';
  private static USER_DATA_KEY = 'user_data';

  // 토큰 저장
  static async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      await AsyncStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      console.log('🔐 토큰 저장 성공');
    } catch (error) {
      console.error('❌ 토큰 저장 실패:', {
        errorName: error.name,
        errorMessage: error.message
      });
      throw error;
    }
  }

  // 액세스 토큰 가져오기
  static async getAccessToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(this.ACCESS_TOKEN_KEY);
      console.log('🔑 액세스 토큰 조회:', token ? '토큰 존재' : '토큰 없음');
      return token;
    } catch (error) {
      console.error('❌ 액세스 토큰 조회 실패:', {
        errorName: error.name,
        errorMessage: error.message
      });
      return null;
    }
  }

  // 리프레시 토큰 가져오기
  static async getRefreshToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(this.REFRESH_TOKEN_KEY);
      console.log('🔑 리프레시 토큰 조회:', token ? '토큰 존재' : '토큰 없음');
      return token;
    } catch (error) {
      console.error('❌ 리프레시 토큰 조회 실패:', {
        errorName: error.name,
        errorMessage: error.message
      });
      return null;
    }
  }

  // 토큰 삭제 (로그아웃 시)
  static async removeTokens(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.ACCESS_TOKEN_KEY);
      await AsyncStorage.removeItem(this.REFRESH_TOKEN_KEY);
      console.log('🔓 토큰 삭제 성공');
    } catch (error) {
      console.error('❌ 토큰 삭제 실패:', {
        errorName: error.name,
        errorMessage: error.message
      });
      throw error;
    }
  }

  // 토큰 유효성 확인
  static async isTokenValid(): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    const isValid = !!accessToken; // 간단한 유효성 검사 (실제로는 토큰 만료 검사 추가 필요)
    console.log('✅ 토큰 유효성:', isValid);
    return isValid;
  }

  // 인증 데이터 저장
  static async saveAuthData(
    accessToken: string, 
    refreshToken: string, 
    userData: UserData
  ): Promise<void> {
    try {
      await this.saveTokens(accessToken, refreshToken);
      
      // 사용자 데이터를 AsyncStorage에 저장
      await AsyncStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
      
      console.log('✅ 인증 데이터 저장 성공:', {
        userId: userData.id,
        userName: userData.name
      });
    } catch (error) {
      console.error('❌ 인증 데이터 저장 실패:', {
        errorName: error.name,
        errorMessage: error.message
      });
      throw error;
    }
  }

  // 사용자 데이터 가져오기
  static async getUserData(): Promise<UserData | null> {
    try {
      const userDataString = await AsyncStorage.getItem(this.USER_DATA_KEY);
      const userData = userDataString ? JSON.parse(userDataString) : null;
      
      console.log('🧑 사용자 데이터 조회:', {
        exists: !!userData,
        userId: userData?.id
      });

      return userData;
    } catch (error) {
      console.error('❌ 사용자 데이터 조회 실패:', {
        errorName: error.name,
        errorMessage: error.message
      });
      return null;
    }
  }

  // 인증 데이터 초기화
  static async clearAuthData(): Promise<void> {
    try {
      await this.removeTokens();
      await AsyncStorage.removeItem(this.USER_DATA_KEY);
      console.log('🔓 인증 데이터 초기화 완료');
    } catch (error) {
      console.error('❌ 인증 데이터 초기화 실패:', {
        errorName: error.name,
        errorMessage: error.message
      });
      throw error;
    }
  }

  // 로그인 상태 확인
  static async isLoggedIn(): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      const userData = await this.getUserData();
      
      const isLoggedIn = !!accessToken && !!userData;
      
      console.log('🔐 로그인 상태 확인:', {
        accessTokenExists: !!accessToken,
        userDataExists: !!userData,
        isLoggedIn
      });

      return isLoggedIn;
    } catch (error) {
      console.error('❌ 로그인 상태 확인 실패:', {
        errorName: error.name,
        errorMessage: error.message
      });
      return false;
    }
  }

  // 액세스 토큰 유효성 확인 (간단한 구현)
  static async isAccessTokenValid(): Promise<boolean> {
    return this.isTokenValid();
  }
}

export default TokenService;

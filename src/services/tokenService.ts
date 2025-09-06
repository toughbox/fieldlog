import AsyncStorage from '@react-native-async-storage/async-storage';

// 토큰 저장 키
const ACCESS_TOKEN_KEY = 'fieldlog_access_token';
const REFRESH_TOKEN_KEY = 'fieldlog_refresh_token';
const USER_DATA_KEY = 'fieldlog_user_data';

export interface UserData {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

export class TokenService {
  
  // 액세스 토큰 저장
  static async saveAccessToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
      console.log('✅ 액세스 토큰 저장 완료');
    } catch (error) {
      console.error('❌ 액세스 토큰 저장 실패:', error);
      throw error;
    }
  }

  // 리프레시 토큰 저장
  static async saveRefreshToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
      console.log('✅ 리프레시 토큰 저장 완료');
    } catch (error) {
      console.error('❌ 리프레시 토큰 저장 실패:', error);
      throw error;
    }
  }

  // 사용자 데이터 저장
  static async saveUserData(userData: UserData): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      console.log('✅ 사용자 데이터 저장 완료:', userData);
    } catch (error) {
      console.error('❌ 사용자 데이터 저장 실패:', error);
      throw error;
    }
  }

  // 모든 인증 정보 저장 (로그인 시 사용)
  static async saveAuthData(accessToken: string, refreshToken: string, userData: UserData): Promise<void> {
    try {
      await Promise.all([
        this.saveAccessToken(accessToken),
        this.saveRefreshToken(refreshToken),
        this.saveUserData(userData)
      ]);
      console.log('✅ 모든 인증 정보 저장 완료');
    } catch (error) {
      console.error('❌ 인증 정보 저장 실패:', error);
      throw error;
    }
  }

  // 액세스 토큰 불러오기
  static async getAccessToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      return token;
    } catch (error) {
      console.error('❌ 액세스 토큰 불러오기 실패:', error);
      return null;
    }
  }

  // 리프레시 토큰 불러오기
  static async getRefreshToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      return token;
    } catch (error) {
      console.error('❌ 리프레시 토큰 불러오기 실패:', error);
      return null;
    }
  }

  // 사용자 데이터 불러오기
  static async getUserData(): Promise<UserData | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('❌ 사용자 데이터 불러오기 실패:', error);
      return null;
    }
  }

  // 로그인 상태 확인
  static async isLoggedIn(): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      const userData = await this.getUserData();
      
      const isValid = !!(accessToken && userData);
      console.log('🔍 로그인 상태 확인:', isValid ? '로그인됨' : '로그아웃 상태');
      return isValid;
    } catch (error) {
      console.error('❌ 로그인 상태 확인 실패:', error);
      return false;
    }
  }

  // 모든 인증 정보 삭제 (로그아웃 시 사용)
  static async clearAuthData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
        AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
        AsyncStorage.removeItem(USER_DATA_KEY)
      ]);
      console.log('✅ 모든 인증 정보 삭제 완료 (로그아웃)');
    } catch (error) {
      console.error('❌ 인증 정보 삭제 실패:', error);
      throw error;
    }
  }

  // JWT 토큰 디코딩 (간단한 페이로드 추출)
  static decodeJWT(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch (error) {
      console.error('❌ JWT 토큰 디코딩 실패:', error);
      return null;
    }
  }

  // 토큰 만료 확인
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeJWT(token);
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = decoded.exp < currentTime;
      
      console.log('🕐 토큰 만료 확인:', isExpired ? '만료됨' : '유효함');
      return isExpired;
    } catch (error) {
      console.error('❌ 토큰 만료 확인 실패:', error);
      return true;
    }
  }

  // 액세스 토큰 유효성 확인
  static async isAccessTokenValid(): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      if (!token) return false;
      
      return !this.isTokenExpired(token);
    } catch (error) {
      console.error('❌ 액세스 토큰 유효성 확인 실패:', error);
      return false;
    }
  }
}

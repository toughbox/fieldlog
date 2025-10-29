import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { TokenService, UserData } from '../services/tokenService';
import { setUnauthorizedHandler, clearUnauthorizedHandler, currentNotificationApi, authApi } from '../services/api';
import { Alert, Platform } from 'react-native';
import * as NotificationService from '../services/notificationService';

interface AuthContextType {
  // 상태
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserData | null;
  
  // 메서드
  login: (accessToken: string, refreshToken: string, userData: UserData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);

  // 인증 상태 확인
  const checkAuthStatus = async () => {
    try {
      console.log('🔍 인증 상태 확인 시작 - 타임스탬프:', new Date().toISOString());
      setIsLoading(true);

      // 각 단계별 로깅 추가
      const isLoggedIn = await TokenService.isLoggedIn();
      console.log('1. isLoggedIn:', isLoggedIn);

      const isTokenValid = await TokenService.isAccessTokenValid();
      console.log('2. isTokenValid:', isTokenValid);

      const userData = await TokenService.getUserData();
      console.log('3. userData:', userData);

      if (isLoggedIn && isTokenValid && userData) {
        setUser(userData);
        setIsAuthenticated(true);
        console.log('✅ 자동 로그인 성공:', userData);
      } else {
        await handleInvalidAuth();
        console.log('❌ 인증 실패');
      }
    } catch (error) {
      console.error('❌ 인증 상태 확인 중 치명적 오류:', {
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });
      await handleInvalidAuth();
    } finally {
      console.log('인증 상태 확인 완료 - 로딩 상태 해제');
      setIsLoading(false);
    }
  };

  // 유효하지 않은 인증 상태 처리
  const handleInvalidAuth = async () => {
    console.log('🚫 유효하지 않은 인증 상태 - 로그아웃 처리');
    setIsAuthenticated(false);
    setUser(null);
    await TokenService.clearAuthData();
  };

  // 로그인
  const login = async (accessToken: string, refreshToken: string, userData: UserData) => {
    try {
      console.log('🔐 로그인 처리 중...');
      
      // 토큰과 사용자 데이터 저장
      await TokenService.saveAuthData(accessToken, refreshToken, userData);
      
      // 상태 업데이트
      setUser(userData);
      setIsAuthenticated(true);
      
      // 푸시 알림 초기화
      await initializePushNotifications(userData.id);
      
      console.log('✅ 로그인 완료:', userData.name);
    } catch (error) {
      console.error('❌ 로그인 처리 오류:', {
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  };

  // 푸시 알림 초기화
  const initializePushNotifications = async (userId: number) => {
    try {
      // 푸시 알림 권한 요청
      const hasPermission = await NotificationService.requestNotificationPermissions();
      
      if (hasPermission) {
        // FCM 토큰 가져오기
        const fcmToken = await NotificationService.getFCMToken();
        
        if (fcmToken) {
          // 서버에 토큰 등록
          try {
            const response = await currentNotificationApi.registerToken(
              userId,
              fcmToken,
              Platform.OS as 'ios' | 'android',
              {
                model: Platform.OS,
                version: Platform.Version,
              }
            );
            
            if (response.success) {
              console.log('✅ FCM 토큰이 서버에 등록되었습니다.');
            }
          } catch (apiError) {
            console.error('FCM 토큰 서버 등록 실패:', apiError);
            // 토큰 등록 실패해도 앱 사용에는 문제 없음
          }
        }
      }
    } catch (error) {
      console.error('푸시 알림 초기화 실패:', error);
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      console.log('🚪 로그아웃 처리 중...');
      
      // 서버에 로그아웃 요청 (세션 비활성화)
      try {
        const refreshToken = await TokenService.getRefreshToken();
        if (refreshToken) {
          const response = await authApi.logout(refreshToken);
          if (response.success) {
            console.log('✅ 서버 세션이 비활성화되었습니다.');
          }
        }
      } catch (apiError) {
        console.error('서버 로그아웃 실패:', apiError);
        // 서버 로그아웃 실패해도 로컬 로그아웃은 계속 진행
      }
      
      // 예약된 모든 로컬 알림 취소
      await NotificationService.cancelAllScheduledNotifications();
      
      // 서버에서 FCM 토큰 제거
      try {
        const fcmToken = await NotificationService.getFCMToken();
        if (fcmToken) {
          await currentNotificationApi.unregisterToken(fcmToken);
          console.log('✅ FCM 토큰이 서버에서 제거되었습니다.');
        }
      } catch (apiError) {
        console.error('FCM 토큰 서버 제거 실패:', apiError);
        // 토큰 제거 실패해도 로그아웃 계속 진행
      }
      
      // 저장된 인증 정보 삭제
      await TokenService.clearAuthData();
      
      // 상태 초기화
      setIsAuthenticated(false);
      setUser(null);
      
      console.log('✅ 로그아웃 완료');
    } catch (error) {
      console.error('❌ 로그아웃 처리 오류:', {
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  };

  // 앱 시작 시 인증 상태 확인 및 401/403 에러 핸들러 등록
  useEffect(() => {
    console.log('🌟 AuthProvider 마운트 - 인증 상태 확인 시작');
    checkAuthStatus();
    
    // 401/403 에러 발생 시 자동 로그아웃 처리
    setUnauthorizedHandler(() => {
      console.log('🔒 토큰 만료 또는 유효하지 않음 - 자동 로그아웃');
      Alert.alert(
        '세션 만료',
        '로그인 세션이 만료되었습니다. 다시 로그인해주세요.',
        [
          {
            text: '확인',
            onPress: () => logout()
          }
        ]
      );
    });
    
    // 컴포넌트 언마운트 시 핸들러 제거
    return () => {
      clearUnauthorizedHandler();
    };
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 커스텀 훅
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내에서 사용되어야 합니다.');
  }
  return context;
};

// 인증이 필요한 컴포넌트를 위한 HOC
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
      // 로딩 화면 (필요시 별도 컴포넌트로 분리)
      return null;
    }
    
    if (!isAuthenticated) {
      // 인증되지 않은 경우 (자동으로 로그인 화면으로 리디렉션됨)
      return null;
    }
    
    return <Component {...props} />;
  };
};

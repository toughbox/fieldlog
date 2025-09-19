import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { TokenService, UserData } from '../services/tokenService';

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
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack
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
      
      console.log('✅ 로그인 완료:', userData.name);
    } catch (error) {
      console.error('❌ 로그인 처리 오류:', {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      });
      throw error;
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      console.log('🚪 로그아웃 처리 중...');
      
      // 저장된 인증 정보 삭제
      await TokenService.clearAuthData();
      
      // 상태 초기화
      setIsAuthenticated(false);
      setUser(null);
      
      console.log('✅ 로그아웃 완료');
    } catch (error) {
      console.error('❌ 로그아웃 처리 오류:', {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      });
      throw error;
    }
  };

  // 앱 시작 시 인증 상태 확인
  useEffect(() => {
    console.log('🌟 AuthProvider 마운트 - 인증 상태 확인 시작');
    checkAuthStatus();
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

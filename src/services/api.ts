// API 기본 설정
const API_HOST = process.env.EXPO_PUBLIC_API_HOST || '192.168.0.19';
const API_PORT = process.env.EXPO_PUBLIC_API_PORT || '3030';

const API_BASE_URL = __DEV__ 
  ? `http://${API_HOST}:${API_PORT}/api`  // 개발 환경 (환경변수 사용)
  : 'https://your-production-api.com/api';  // 프로덕션 환경

// API 응답 타입 정의
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 사용자 관련 타입
export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface SignUpResponse {
  id: number;
  email: string;
  name: string;
  phone?: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: number;
    email: string;
    name: string;
    phone?: string;
  };
  access_token: string;
  refresh_token: string;
}

// 공통 fetch 함수
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    console.log(`🚀 API 요청: ${config.method || 'GET'} ${url}`);
    
    const response = await fetch(url, config);
    const result = await response.json();

    if (!response.ok) {
      console.error(`❌ API 오류 (${response.status}):`, result);
      return {
        success: false,
        error: result.message || result.error || `HTTP ${response.status}`,
      };
    }

    console.log('✅ API 성공:', result);
    return {
      success: true,
      data: result.data || result,
      message: result.message,
    };
  } catch (error) {
    console.error('❌ 네트워크 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.',
    };
  }
}

// 인증 관련 API
export const authApi = {
  // 회원가입
  signUp: async (userData: SignUpRequest): Promise<ApiResponse<SignUpResponse>> => {
    return apiRequest<SignUpResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // 로그인
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    return apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // 이메일 중복 확인
  checkEmail: async (email: string): Promise<ApiResponse<{ available: boolean }>> => {
    return apiRequest<{ available: boolean }>(`/auth/check-email?email=${encodeURIComponent(email)}`);
  },
};

// 개발 모드에서 API 목킹
export const mockApi = {
  // 목킹된 회원가입
  signUp: async (userData: SignUpRequest): Promise<ApiResponse<SignUpResponse>> => {
    console.log('🧪 목킹된 회원가입:', userData);
    
    // 실제 API 응답 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 이메일 중복 시뮬레이션
    if (userData.email === 'test@fieldlog.com') {
      return {
        success: false,
        error: '이미 사용 중인 이메일입니다.',
      };
    }

    const mockUser: SignUpResponse = {
      id: Math.floor(Math.random() * 1000) + 1,
      email: userData.email,
      name: userData.name,
      phone: userData.phone,
      company: userData.company,
      created_at: new Date().toISOString(),
    };

    return {
      success: true,
      data: mockUser,
      message: '회원가입이 완료되었습니다.',
    };
  },

  // 목킹된 로그인
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    console.log('🧪 목킹된 로그인:', credentials);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 테스트 계정 확인
    if (credentials.email === 'test@fieldlog.com' && credentials.password === 'password123') {
      const mockResponse: LoginResponse = {
        user: {
          id: 1,
          email: credentials.email,
          name: '테스트 사용자',
          phone: '010-1234-5678',
          company: '테스트 회사',
        },
        access_token: 'mock_access_token_' + Date.now(),
        refresh_token: 'mock_refresh_token_' + Date.now(),
      };

      return {
        success: true,
        data: mockResponse,
        message: '로그인 성공',
      };
    }

    return {
      success: false,
      error: '이메일 또는 비밀번호가 올바르지 않습니다.',
    };
  },

  // 목킹된 이메일 중복 확인
  checkEmail: async (email: string): Promise<ApiResponse<{ available: boolean }>> => {
    console.log('🧪 목킹된 이메일 확인:', email);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // test@fieldlog.com은 이미 사용 중으로 처리
    const available = email !== 'test@fieldlog.com';
    
    return {
      success: true,
      data: { available },
      message: available ? '사용 가능한 이메일입니다.' : '이미 사용 중인 이메일입니다.',
    };
  },
};

// 현재 사용할 API (실제 백엔드 연동)
export const currentApi = authApi;

// 백엔드 서버가 없을 때는 아래 주석을 해제하세요
// export const currentApi = __DEV__ ? mockApi : authApi;

// API 기본 설정
//const API_HOST = process.env.EXPO_PUBLIC_API_HOST || '192.168.0.19';
const API_HOST = process.env.EXPO_PUBLIC_API_HOST;
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
  company?: string;
}

export interface SignUpResponse {
  id: number;
  email: string;
  name: string;
  phone?: string;
  company?: string;
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
    company?: string;
  };
  access_token: string;
  refresh_token: string;
}

// 현장 관련 타입
export interface FieldSchema {
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'checkbox';
    required: boolean;
    placeholder?: string;
    options?: string[];
  }>;
}

export interface Field {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  color: string;
  icon: string;
  field_schema: FieldSchema;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateFieldRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  field_schema: FieldSchema;
  sort_order?: number;
}

export interface UpdateFieldRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  field_schema?: FieldSchema;
  is_active?: boolean;
  sort_order?: number;
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

// 현장 관리 API
export const fieldApi = {
  // 현장 목록 조회
  getFields: async (token: string): Promise<ApiResponse<Field[]>> => {
    return apiRequest<Field[]>('/fields', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // 현장 상세 조회
  getField: async (id: number, token: string): Promise<ApiResponse<Field>> => {
    return apiRequest<Field>(`/fields/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // 현장 생성
  createField: async (fieldData: CreateFieldRequest, token: string): Promise<ApiResponse<Field>> => {
    return apiRequest<Field>('/fields', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(fieldData),
    });
  },

  // 현장 수정
  updateField: async (id: number, fieldData: UpdateFieldRequest, token: string): Promise<ApiResponse<Field>> => {
    return apiRequest<Field>(`/fields/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(fieldData),
    });
  },

  // 현장 삭제
  deleteField: async (id: number, token: string): Promise<ApiResponse<void>> => {
    return apiRequest<void>(`/fields/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
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

// 현장 관리 목킹 API
export const mockFieldApi = {
  // 목킹된 현장 목록 조회
  getFields: async (token: string): Promise<ApiResponse<Field[]>> => {
    console.log('🧪 목킹된 현장 목록 조회:', token);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockFields: Field[] = [
      {
        id: 1,
        user_id: 1,
        name: '건설현장 하자관리',
        description: '아파트 건설현장 하자 관리용',
        color: '#FF6B6B',
        icon: 'construction',
        field_schema: {
          fields: [
            { key: 'building', label: '동', type: 'text', required: true, placeholder: '예: 101동' },
            { key: 'unit', label: '호수', type: 'text', required: true, placeholder: '예: 2001호' },
            { key: 'location', label: '위치', type: 'select', required: true, options: ['거실', '주방', '화장실', '침실1', '침실2', '베란다'] },
            { key: 'defect_type', label: '하자유형', type: 'select', required: true, options: ['전기', '배관', '도배', '바닥', '창호', '기타'] },
          ],
        },
        is_active: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 2,
        user_id: 1,
        name: '서버 점검',
        description: 'IT 인프라 서버 점검 및 관리',
        color: '#3B82F6',
        icon: 'server',
        field_schema: {
          fields: [
            { key: 'server_name', label: '서버명', type: 'text', required: true },
            { key: 'server_type', label: '서버 유형', type: 'select', required: true, options: ['웹서버', 'DB서버', '파일서버', '메일서버'] },
            { key: 'priority', label: '우선순위', type: 'select', required: true, options: ['낮음', '보통', '높음', '긴급'] },
          ],
        },
        is_active: true,
        sort_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    return {
      success: true,
      data: mockFields,
      message: '현장 목록을 성공적으로 조회했습니다.',
    };
  },

  // 목킹된 현장 상세 조회
  getField: async (id: number, token: string): Promise<ApiResponse<Field>> => {
    console.log('🧪 목킹된 현장 상세 조회:', id, token);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (id === 1) {
      const mockField: Field = {
        id: 1,
        user_id: 1,
        name: '건설현장 하자관리',
        description: '아파트 건설현장 하자 관리용',
        color: '#FF6B6B',
        icon: 'construction',
        field_schema: {
          fields: [
            { key: 'building', label: '동', type: 'text', required: true, placeholder: '예: 101동' },
            { key: 'unit', label: '호수', type: 'text', required: true, placeholder: '예: 2001호' },
            { key: 'location', label: '위치', type: 'select', required: true, options: ['거실', '주방', '화장실', '침실1', '침실2', '베란다'] },
            { key: 'defect_type', label: '하자유형', type: 'select', required: true, options: ['전기', '배관', '도배', '바닥', '창호', '기타'] },
          ],
        },
        is_active: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return {
        success: true,
        data: mockField,
        message: '현장 정보를 성공적으로 조회했습니다.',
      };
    }

    return {
      success: false,
      error: '현장을 찾을 수 없습니다.',
    };
  },

  // 목킹된 현장 생성
  createField: async (fieldData: CreateFieldRequest, token: string): Promise<ApiResponse<Field>> => {
    console.log('🧪 목킹된 현장 생성:', fieldData, token);
    
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const mockField: Field = {
      id: Math.floor(Math.random() * 1000) + 3,
      user_id: 1,
      name: fieldData.name,
      description: fieldData.description || '',
      color: fieldData.color || '#6366F1',
      icon: fieldData.icon || 'folder',
      field_schema: fieldData.field_schema,
      is_active: true,
      sort_order: fieldData.sort_order || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return {
      success: true,
      data: mockField,
      message: '현장이 성공적으로 생성되었습니다.',
    };
  },

  // 목킹된 현장 수정
  updateField: async (id: number, fieldData: UpdateFieldRequest, token: string): Promise<ApiResponse<Field>> => {
    console.log('🧪 목킹된 현장 수정:', id, fieldData, token);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockField: Field = {
      id: id,
      user_id: 1,
      name: fieldData.name || '수정된 현장',
      description: fieldData.description || '수정된 설명',
      color: fieldData.color || '#6366F1',
      icon: fieldData.icon || 'folder',
      field_schema: fieldData.field_schema || { fields: [] },
      is_active: fieldData.is_active !== undefined ? fieldData.is_active : true,
      sort_order: fieldData.sort_order || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return {
      success: true,
      data: mockField,
      message: '현장이 성공적으로 수정되었습니다.',
    };
  },

  // 목킹된 현장 삭제
  deleteField: async (id: number, token: string): Promise<ApiResponse<void>> => {
    console.log('🧪 목킹된 현장 삭제:', id, token);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      success: true,
      message: '현장이 성공적으로 삭제되었습니다.',
    };
  },
};

// 실제 백엔드 연동 사용
export const currentApi = authApi;
export const currentFieldApi = fieldApi;

// 백엔드 서버가 없을 때는 목킹 API 사용
// export const currentApi = __DEV__ ? mockApi : authApi;
// export const currentFieldApi = __DEV__ ? mockFieldApi : fieldApi;

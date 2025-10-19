// API 기본 URL 설정
const API_HOST = process.env.EXPO_PUBLIC_API_HOST || 'toughdev.cafe24.com';
const API_PORT = process.env.EXPO_PUBLIC_API_PORT || '3030';

// 테스트: 도메인 대신 IP 직접 사용
const API_BASE_URL = `http://${API_HOST}:${API_PORT}/api`;

console.warn('⚠️ API URL 테스트 모드:', API_BASE_URL);

console.log('🌐 API 설정:', {
  host: API_HOST,
  port: API_PORT,
  baseUrl: API_BASE_URL,
  env: {
    EXPO_PUBLIC_API_HOST: process.env.EXPO_PUBLIC_API_HOST,
    EXPO_PUBLIC_API_PORT: process.env.EXPO_PUBLIC_API_PORT
  }
});

// API 응답 타입 정의
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 401/403 에러 핸들러 (로그아웃 처리용)
let unauthorizedHandler: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: () => void) => {
  unauthorizedHandler = handler;
};

export const clearUnauthorizedHandler = () => {
  unauthorizedHandler = null;
};

// 사용자 관련 타입
export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
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

// 현장 기록 관련 타입
export interface FieldRecord {
  id: number;
  user_id: number;
  field_id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: number; // 1(낮음) ~ 5(높음)
  due_date?: string;
  completed_at?: string;
  custom_data: Record<string, any>;
  attachment: Array<{
    type: string;
    url: string;
    name: string;
    size?: number;
  }>;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  tags: string[];
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  // 조인된 필드 정보
  field_name?: string;
  field_color?: string;
  field_icon?: string;
  field_schema?: FieldSchema;
}

export interface CreateRecordRequest {
  field_id: number;
  title: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: number;
  due_date?: string;
  custom_data?: Record<string, any>;
  attachment?: Array<{
    type: string;
    url: string;
    name: string;
    size?: number;
  }>;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  tags?: string[];
}

export interface UpdateRecordRequest {
  field_id?: number;
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: number;
  due_date?: string;
  custom_data?: Record<string, any>;
  attachment?: Array<{
    type: string;
    url: string;
    name: string;
    size?: number;
  }>;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  tags?: string[];
}

export interface RecordsListResponse {
  records: FieldRecord[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_records: number;
    limit: number;
  };
}

export interface RecordStats {
  total_records: number;
  pending_count: number;
  in_progress_count: number;
  completed_count: number;
  cancelled_count: number;
  overdue_count: number;
  due_soon_count: number;
  avg_priority: string;
}

// 공통 fetch 함수
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log('🚀 API 요청 상세 정보:', {
      url,
      method: options.method || 'GET',
      headers: options.headers,
      body: options.body ? JSON.parse(options.body as string) : null
    });

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

    const response = await fetch(url, config);
    
    console.log('📡 API 응답 상세:', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      ok: response.ok
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`❌ API 오류 (${response.status}):`, {
        result,
        url,
        method: config.method || 'GET'
      });
      
      // 401 또는 403 에러 (인증 실패)인 경우 로그아웃 처리
      if ((response.status === 401 || response.status === 403) && unauthorizedHandler) {
        console.log('🚫 인증 실패 감지 - 로그아웃 처리 실행');
        unauthorizedHandler();
      }
      
      return {
        success: false,
        error: result.message || result.error || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      data: result.data || result,
      message: result.message,
    };
  } catch (error) {
    const err = error as Error;
    console.error('🌐 네트워크 오류 상세:', {
      errorName: err.name,
      errorMessage: err.message,
      errorStack: err.stack
    });
    return {
      success: false,
      error: err instanceof Error ? err.message : '네트워크 오류가 발생했습니다.',
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

  // 비밀번호 재설정 요청
  requestPasswordReset: async (email: string): Promise<ApiResponse<{ dev_token?: string }>> => {
    return apiRequest<{ dev_token?: string }>('/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // 재설정 토큰 확인
  verifyResetToken: async (email: string, token: string): Promise<ApiResponse<void>> => {
    return apiRequest<void>('/auth/verify-reset-token', {
      method: 'POST',
      body: JSON.stringify({ email, token }),
    });
  },

  // 비밀번호 재설정
  resetPassword: async (email: string, token: string, newPassword: string): Promise<ApiResponse<void>> => {
    return apiRequest<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, token, newPassword }),
    });
  },

  // 이메일 검증 요청 (회원가입 1단계)
  requestEmailVerification: async (userData: SignUpRequest): Promise<ApiResponse<{ dev_token?: string }>> => {
    return apiRequest<{ dev_token?: string }>('/auth/request-email-verification', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // 이메일 검증 토큰 확인 및 회원가입 완료 (회원가입 2단계)
  verifyEmailAndSignUp: async (email: string, token: string): Promise<ApiResponse<SignUpResponse>> => {
    return apiRequest<SignUpResponse>('/auth/verify-email-and-signup', {
      method: 'POST',
      body: JSON.stringify({ email, token }),
    });
  },
};

// 현장 기록 관리 API
export const recordApi = {
  // 현장 기록 목록 조회
  getRecords: async (
    token: string, 
    params?: {
      field_id?: number;
      status?: string;
      priority?: number;
      search?: string;
      page?: number;
      limit?: number;
      sort_by?: string;
      sort_order?: string;
    }
  ): Promise<ApiResponse<RecordsListResponse>> => {
    const queryParams = new URLSearchParams();
    if (params?.field_id) queryParams.append('field_id', params.field_id.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/records?${queryString}` : '/records';

    return apiRequest<RecordsListResponse>(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // 현장 기록 상세 조회
  getRecord: async (id: number, token: string): Promise<ApiResponse<FieldRecord>> => {
    return apiRequest<FieldRecord>(`/records/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // 현장 기록 생성
  createRecord: async (recordData: CreateRecordRequest, token: string): Promise<ApiResponse<FieldRecord>> => {
    return apiRequest<FieldRecord>('/records', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(recordData),
    });
  },

  // 현장 기록 수정
  updateRecord: async (id: number, recordData: UpdateRecordRequest, token: string): Promise<ApiResponse<FieldRecord>> => {
    return apiRequest<FieldRecord>(`/records/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(recordData),
    });
  },

  // 현장 기록 삭제
  deleteRecord: async (id: number, token: string): Promise<ApiResponse<void>> => {
    return apiRequest<void>(`/records/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // 현장 기록 통계 조회
  getRecordStats: async (token: string, field_id?: number): Promise<ApiResponse<RecordStats>> => {
    const endpoint = field_id ? `/records/stats/summary?field_id=${field_id}` : '/records/stats/summary';
    return apiRequest<RecordStats>(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
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
    
    // 저장된 현장 데이터를 로컬 스토리지에서 가져오기
    let mockFields: Field[] = [];
    
    // 실제 앱에서는 AsyncStorage나 다른 저장소에서 데이터를 가져와야 하지만
    // 여기서는 메모리에서 관리 (간단한 Mock용)
    if (typeof global !== 'undefined' && (global as any).mockFieldsData) {
      mockFields = (global as any).mockFieldsData;
    }

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
    
    // 기존 데이터 가져오기
    let existingFields: Field[] = [];
    if (typeof global !== 'undefined' && (global as any).mockFieldsData) {
      existingFields = (global as any).mockFieldsData;
    }
    
    const mockField: Field = {
      id: Math.floor(Math.random() * 10000) + Date.now(), // 고유한 ID 생성
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

    // 새 필드를 기존 데이터에 추가
    existingFields.push(mockField);
    
    // 글로벌 저장소에 저장
    if (typeof global !== 'undefined') {
      (global as any).mockFieldsData = existingFields;
    }

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
    
    // 기존 데이터에서 해당 현장 제거
    if (typeof global !== 'undefined' && (global as any).mockFieldsData) {
      const existingFields: Field[] = (global as any).mockFieldsData;
      const filteredFields = existingFields.filter(field => field.id !== id);
      (global as any).mockFieldsData = filteredFields;
    }
    
    return {
      success: true,
      message: '현장이 성공적으로 삭제되었습니다.',
    };
  },
};

// 현장 기록 목킹 API
export const mockRecordApi = {
  // 목킹된 현장 기록 목록 조회
  getRecords: async (
    token: string, 
    params?: {
      field_id?: number;
      status?: string;
      priority?: number;
      search?: string;
      page?: number;
      limit?: number;
      sort_by?: string;
      sort_order?: string;
    }
  ): Promise<ApiResponse<RecordsListResponse>> => {
    console.log('🧪 목킹된 현장 기록 목록 조회:', { token, params });
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 저장된 현장 기록 데이터를 메모리에서 가져오기
    let mockRecords: FieldRecord[] = [];
    if (typeof global !== 'undefined' && (global as any).mockRecordsData) {
      mockRecords = (global as any).mockRecordsData;
    }

    // 필터링 적용
    let filteredRecords = mockRecords;
    
    if (params?.field_id) {
      filteredRecords = filteredRecords.filter(r => r.field_id === params.field_id);
    }
    
    if (params?.status) {
      filteredRecords = filteredRecords.filter(r => r.status === params.status);
    }
    
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filteredRecords = filteredRecords.filter(r => 
        r.title.toLowerCase().includes(searchLower) || 
        r.description?.toLowerCase().includes(searchLower)
      );
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const total = filteredRecords.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

    return {
      success: true,
      data: {
        records: paginatedRecords,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_records: total,
          limit: limit
        }
      },
      message: '현장 기록 목록을 성공적으로 조회했습니다.'
    };
  },

  // 목킹된 현장 기록 상세 조회
  getRecord: async (id: number, token: string): Promise<ApiResponse<FieldRecord>> => {
    console.log('🧪 목킹된 현장 기록 상세 조회:', id, token);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (id === 1) {
      const mockRecord: FieldRecord = {
        id: 1,
        user_id: 1,
        field_id: 1,
        title: '101동 2001호 전기 하자',
        description: '거실 콘센트 작동 불가. 전기팀에서 확인 필요.',
        status: 'pending',
        priority: 3,
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        completed_at: undefined,
        custom_data: {
          building: '101동',
          unit: '2001호',
          location: '거실',
          defect_type: '전기'
        },
        attachment: [
          {
            type: 'image',
            url: '/mock/defect_photo_001.jpg',
            name: '하자사진1.jpg',
            size: 245760
          }
        ],
        location: {
          latitude: 37.5665,
          longitude: 126.9780,
          address: '서울시 중구 명동'
        },
        tags: ['긴급', '전기'],
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        field_name: '건설현장 하자관리',
        field_color: '#FF6B6B',
        field_icon: 'construction',
        field_schema: {
          fields: [
            { key: 'building', label: '동', type: 'text', required: true },
            { key: 'unit', label: '호수', type: 'text', required: true },
            { key: 'location', label: '위치', type: 'select', required: true, options: ['거실', '주방', '화장실', '침실1', '침실2', '베란다'] },
            { key: 'defect_type', label: '하자유형', type: 'select', required: true, options: ['전기', '배관', '도배', '바닥', '창호', '기타'] }
          ]
        }
      };

      return {
        success: true,
        data: mockRecord,
        message: '현장 기록을 성공적으로 조회했습니다.'
      };
    }

    return {
      success: false,
      error: '현장 기록을 찾을 수 없습니다.'
    };
  },

  // 목킹된 현장 기록 생성
  createRecord: async (recordData: CreateRecordRequest, token: string): Promise<ApiResponse<FieldRecord>> => {
    console.log('🧪 목킹된 현장 기록 생성:', recordData, token);
    
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // 현장 정보 찾기
    let fieldInfo = { name: '알 수 없는 현장', color: '#6366F1', icon: 'folder' };
    if (typeof global !== 'undefined' && (global as any).mockFieldsData) {
      const fields: Field[] = (global as any).mockFieldsData;
      const field = fields.find(f => f.id === recordData.field_id);
      if (field) {
        fieldInfo = { name: field.name, color: field.color, icon: field.icon };
      }
    }
    
    const mockRecord: FieldRecord = {
      id: Math.floor(Math.random() * 10000) + Date.now(), // 고유한 ID 생성
      user_id: 1,
      field_id: recordData.field_id,
      title: recordData.title,
      description: recordData.description || '',
      status: recordData.status || 'pending',
      priority: recordData.priority || 1,
      due_date: recordData.due_date || undefined,
      completed_at: recordData.status === 'completed' ? new Date().toISOString() : undefined,
      custom_data: recordData.custom_data || {},
      attachment: recordData.attachment || [],
      location: recordData.location || undefined,
      tags: recordData.tags || [],
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      field_name: fieldInfo.name,
      field_color: fieldInfo.color,
      field_icon: fieldInfo.icon
    };

    // 기존 기록에 추가
    let existingRecords: FieldRecord[] = [];
    if (typeof global !== 'undefined' && (global as any).mockRecordsData) {
      existingRecords = (global as any).mockRecordsData;
    }
    existingRecords.push(mockRecord);
    
    if (typeof global !== 'undefined') {
      (global as any).mockRecordsData = existingRecords;
    }

    return {
      success: true,
      data: mockRecord,
      message: '현장 기록이 성공적으로 생성되었습니다.'
    };
  },

  // 목킹된 현장 기록 수정
  updateRecord: async (id: number, recordData: UpdateRecordRequest, token: string): Promise<ApiResponse<FieldRecord>> => {
    console.log('🧪 목킹된 현장 기록 수정:', id, recordData, token);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockRecord: FieldRecord = {
      id: id,
      user_id: 1,
      field_id: recordData.field_id || 1,
      title: recordData.title || '수정된 기록',
      description: recordData.description || '수정된 설명',
      status: recordData.status || 'pending',
      priority: recordData.priority || 1,
      due_date: recordData.due_date || undefined,
      completed_at: recordData.status === 'completed' ? new Date().toISOString() : undefined,
      custom_data: recordData.custom_data || {},
      attachment: recordData.attachment || [],
      location: recordData.location || undefined,
      tags: recordData.tags || [],
      is_deleted: false,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1일 전
      updated_at: new Date().toISOString(),
      field_name: '건설현장 하자관리',
      field_color: '#FF6B6B',
      field_icon: 'construction'
    };

    return {
      success: true,
      data: mockRecord,
      message: '현장 기록이 성공적으로 수정되었습니다.'
    };
  },

  // 목킹된 현장 기록 삭제
  deleteRecord: async (id: number, token: string): Promise<ApiResponse<void>> => {
    console.log('🧪 목킹된 현장 기록 삭제:', id, token);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 기존 데이터에서 해당 기록 제거
    if (typeof global !== 'undefined' && (global as any).mockRecordsData) {
      const existingRecords: FieldRecord[] = (global as any).mockRecordsData;
      const filteredRecords = existingRecords.filter(record => record.id !== id);
      (global as any).mockRecordsData = filteredRecords;
    }
    
    return {
      success: true,
      message: '현장 기록이 성공적으로 삭제되었습니다.'
    };
  },

  // 목킹된 현장 기록 통계 조회
  getRecordStats: async (token: string, field_id?: number): Promise<ApiResponse<RecordStats>> => {
    console.log('🧪 목킹된 현장 기록 통계 조회:', { token, field_id });
    
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const mockStats: RecordStats = {
      total_records: 15,
      pending_count: 6,
      in_progress_count: 4,
      completed_count: 4,
      cancelled_count: 1,
      overdue_count: 2,
      due_soon_count: 3,
      avg_priority: '2.8'
    };

    return {
      success: true,
      data: mockStats,
      message: '현장 기록 통계를 성공적으로 조회했습니다.'
    };
  },
};

// 실제 백엔드 연동 사용
export const currentApi = authApi;
export const currentFieldApi = fieldApi;
export const currentRecordApi = recordApi;

// 백엔드 서버가 없을 때는 목킹 API 사용
// export const currentApi = __DEV__ ? mockApi : authApi;
// export const currentFieldApi = __DEV__ ? mockFieldApi : fieldApi;
// export const currentRecordApi = __DEV__ ? mockRecordApi : recordApi;

import Constants from 'expo-constants';

// API 기본 URL 설정
const API_HOST = Constants.expoConfig?.extra?.apiHost || 'toughdev.cafe24.com';
const API_PORT = Constants.expoConfig?.extra?.apiPort || '3030';
const API_BASE_URL = `http://${API_HOST}:${API_PORT}/api`;

console.log('🌐 API 설정:', {
  host: API_HOST,
  port: API_PORT,
  baseUrl: API_BASE_URL
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

// 실제 백엔드 연동 사용
export const currentApi = authApi;
export const currentFieldApi = fieldApi;
export const currentRecordApi = recordApi;


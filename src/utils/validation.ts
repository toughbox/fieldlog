// 유효성 검사 유틸리티 함수들

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 6) {
    return { isValid: false, message: '비밀번호는 6자 이상이어야 합니다.' };
  }
  if (!/(?=.*[a-zA-Z])/.test(password)) {
    return { isValid: false, message: '비밀번호에 영문자를 포함해주세요.' };
  }
  return { isValid: true };
};

export const validatePhone = (phone: string): boolean => {
  if (!phone) return true; // 선택사항이므로 빈 값은 허용
  const phoneRegex = /^[0-9-+().\s]+$/;
  return phoneRegex.test(phone);
};

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};

export interface SignUpFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  company?: string;
  phone?: string;
}

export const validateSignUpForm = (formData: SignUpFormData): { isValid: boolean; message?: string } => {
  if (!validateName(formData.name)) {
    return { isValid: false, message: '이름은 2자 이상 입력해주세요.' };
  }

  if (!validateEmail(formData.email)) {
    return { isValid: false, message: '올바른 이메일 형식을 입력해주세요.' };
  }

  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    return passwordValidation;
  }

  if (formData.password !== formData.confirmPassword) {
    return { isValid: false, message: '비밀번호가 일치하지 않습니다.' };
  }

  if (formData.phone && !validatePhone(formData.phone)) {
    return { isValid: false, message: '올바른 전화번호 형식을 입력해주세요.' };
  }

  return { isValid: true };
};

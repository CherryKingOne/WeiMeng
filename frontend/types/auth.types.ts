export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
}

export interface SignupRequest {
  email: string;
  password: string;
  username: string;
  captcha: string;
}

export interface CaptchaRequest {
  email: string;
  type: 'register' | 'reset_password';
}

export interface ResetPasswordRequest {
  email: string;
  newPassword: string;
  captcha: string;
}

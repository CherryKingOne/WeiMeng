export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: '密码长度至少8位' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: '密码需包含大写字母' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: '密码需包含小写字母' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '密码需包含数字' };
  }
  return { valid: true, message: '' };
}

export function validateUsername(username: string): { valid: boolean; message: string } {
  if (username.length < 3) {
    return { valid: false, message: '用户名长度至少3位' };
  }
  if (username.length > 20) {
    return { valid: false, message: '用户名长度不超过20位' };
  }
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
    return { valid: false, message: '用户名只能包含字母、数字、下划线和中文' };
  }
  return { valid: true, message: '' };
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

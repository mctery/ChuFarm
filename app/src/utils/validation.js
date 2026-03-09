const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_NUMBER = /\d/;

export function validateEmail(email) {
  if (!email) return "กรุณากรอกอีเมล";
  if (!EMAIL_RE.test(email)) return "รูปแบบอีเมลไม่ถูกต้อง";
  return "";
}

export function validatePassword(password) {
  if (!password) return "กรุณากรอกรหัสผ่าน";
  if (password.length < 8) return "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
  if (!HAS_UPPERCASE.test(password)) return "รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว";
  if (!HAS_NUMBER.test(password)) return "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว";
  return "";
}

export function validateRequired(value, fieldName) {
  if (!value || !value.trim()) return `กรุณากรอก${fieldName}`;
  return "";
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) return "กรุณายืนยันรหัสผ่าน";
  if (password !== confirmPassword) return "รหัสผ่านไม่ตรงกัน";
  return "";
}

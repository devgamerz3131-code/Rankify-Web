export type UserRole = 'student' | 'admin';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  cbseClass?: number; // 9, 10, 11, 12
  stream?: 'science' | 'commerce' | 'arts' | 'general';
  school?: string;
  targetExam?: string; // e.g. "CBSE Board 2027", "JEE 2027", "NEET 2027"
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface AuthModalState {
  isOpen: boolean;
  mode: 'login' | 'register' | 'forgot-password';
}

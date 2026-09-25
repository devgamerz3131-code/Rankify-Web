export type UserRole = 'student' | 'admin';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  cbseClass?: number; // legacy alias
  classNumber?: number; // 6 to 12
  board?: 'CBSE' | 'RBSE' | 'ICSE' | 'State Board';
  medium?: 'English' | 'Hindi';
  preferredLanguage?: 'English' | 'Hindi' | 'Hinglish';
  targetPercentage?: number;
  stream?: 'science' | 'commerce' | 'arts' | 'general';
  subjects?: string[];
  school?: string;
  targetExam?: string;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
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

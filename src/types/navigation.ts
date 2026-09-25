import { ComponentType } from 'react';

export type NavRoute = 'home' | 'study' | 'practice' | 'ask-ai' | 'progress' | 'profile';

export interface NavItem {
  id: NavRoute;
  label: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
  isAi?: boolean;
}

import { ComponentType } from 'react';

export type NavRoute = 'home' | 'command' | 'study' | 'practice' | 'progress' | 'profile' | 'ai' | 'settings' | 'admin' | 'mistakes' | 'readiness' | 'weakness' | 'replay' | 'brain' | 'revision' | 'ncert' | 'formula' | 'briefing';

export interface NavItem {
  id: NavRoute;
  label: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
}

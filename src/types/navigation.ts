import { ComponentType } from 'react';

export type NavRoute =
  | 'home'
  | 'study'
  | 'ai'
  | 'progress'
  | 'profile'
  | 'tools'
  | 'command'
  | 'practice'
  | 'settings'
  | 'admin'
  | 'mistakes'
  | 'readiness'
  | 'weakness'
  | 'replay'
  | 'brain'
  | 'revision'
  | 'ncert'
  | 'formula'
  | 'briefing'
  | 'halfyearly'
  | 'more';

export interface NavItem {
  id: NavRoute;
  label: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
}

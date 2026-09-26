export type AiViewMode = 'chat' | 'full' | 'sidebar_open';

export interface AiNavigationState {
  currentView: AiViewMode;
  isSidebarOpenMobile: boolean;
}

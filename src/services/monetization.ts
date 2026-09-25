/**
 * Rankify Monetization Architecture & Study Points Engine
 * Current Policy: App is 100% FREE for all students.
 * Architecture supports future non-intrusive rewards, points wallet, and tier capabilities without active payment UI.
 */

import { safeLocalStorage } from '@/utils/storage';

export type UserSubscriptionTier = 'free' | 'scholar_pro' | 'board_topper';

export interface StudyPointsWallet {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  history: PointTransaction[];
}

export interface PointTransaction {
  id: string;
  amount: number;
  type: 'earn' | 'spend';
  reason: string;
  timestamp: string;
}

export interface MonetizationCapabilities {
  tier: UserSubscriptionTier;
  isAdFree: boolean;
  canAccessPremiumThemes: boolean;
  canAccessDeepAINotes: boolean;
  canAccessAdvancedMockTests: boolean;
  dailyAIQueryLimit: number;
  studyPoints: StudyPointsWallet;
}

const STORAGE_KEY = 'rankify_monetization_state';

const DEFAULT_STATE: MonetizationCapabilities = {
  tier: 'free',
  isAdFree: true, // Currently 100% ad-free for all CBSE candidates
  canAccessPremiumThemes: true, // Freely accessible
  canAccessDeepAINotes: true, // Freely accessible
  canAccessAdvancedMockTests: true, // Freely accessible
  dailyAIQueryLimit: 150,
  studyPoints: {
    balance: 250, // Starting welcome study points
    totalEarned: 250,
    totalSpent: 0,
    history: [
      {
        id: 'tx_init',
        amount: 250,
        type: 'earn',
        reason: 'Welcome to Rankify CBSE Class 12 PCM Study OS',
        timestamp: new Date().toISOString(),
      },
    ],
  },
};

class MonetizationService {
  private static instance: MonetizationService;
  private state: MonetizationCapabilities;
  private listeners: Set<(state: MonetizationCapabilities) => void> = new Set();

  private constructor() {
    this.state = safeLocalStorage.getItem<MonetizationCapabilities>(
      STORAGE_KEY,
      DEFAULT_STATE
    );
  }

  public static getInstance(): MonetizationService {
    if (!MonetizationService.instance) {
      MonetizationService.instance = new MonetizationService();
    }
    return MonetizationService.instance;
  }

  public getState(): MonetizationCapabilities {
    return { ...this.state };
  }

  public earnStudyPoints(amount: number, reason: string): number {
    const newTx: PointTransaction = {
      id: `tx_${Date.now()}`,
      amount,
      type: 'earn',
      reason,
      timestamp: new Date().toISOString(),
    };

    this.state.studyPoints = {
      balance: this.state.studyPoints.balance + amount,
      totalEarned: this.state.studyPoints.totalEarned + amount,
      totalSpent: this.state.studyPoints.totalSpent,
      history: [newTx, ...this.state.studyPoints.history.slice(0, 49)],
    };

    this.saveAndNotify();
    return this.state.studyPoints.balance;
  }

  public spendStudyPoints(amount: number, reason: string): boolean {
    if (this.state.studyPoints.balance < amount) {
      return false;
    }

    const newTx: PointTransaction = {
      id: `tx_${Date.now()}`,
      amount,
      type: 'spend',
      reason,
      timestamp: new Date().toISOString(),
    };

    this.state.studyPoints = {
      balance: this.state.studyPoints.balance - amount,
      totalEarned: this.state.studyPoints.totalEarned,
      totalSpent: this.state.studyPoints.totalSpent + amount,
      history: [newTx, ...this.state.studyPoints.history.slice(0, 49)],
    };

    this.saveAndNotify();
    return true;
  }

  public getPointsBalance(): number {
    return this.state.studyPoints.balance;
  }

  public canAccessFeature(featureName: string): boolean {
    // Current policy: All features unlocked for CBSE Class 12 candidates
    return true;
  }

  public subscribe(listener: (state: MonetizationCapabilities) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private saveAndNotify() {
    safeLocalStorage.setItem(STORAGE_KEY, this.state);
    this.listeners.forEach((fn) => fn(this.state));
  }
}

export const monetizationService = MonetizationService.getInstance();

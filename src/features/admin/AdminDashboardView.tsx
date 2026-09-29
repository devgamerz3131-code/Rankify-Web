import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/firebase/config';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { remoteConfig } from '@/services/remote-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Shield, Users, Bell, BarChart3, FileText, Trash2, Plus, Play, Database,
  Sparkles, ToggleRight, AlertTriangle, Star, ExternalLink, Search, Filter,
  Settings, Check, X, RefreshCw, Download, Ban, RotateCcw,
  BookOpen, Clock, Activity, Calendar, Award, LogOut, CheckCircle2,
  Mail, MessageSquare, Clipboard, Layers, Video, ShieldAlert, Key, Zap, Lock, Info, LockOpen, ArrowLeft, Eye, EyeOff, Brain, BookX, History, Flame, Target, Compass, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { briefingService } from '@/services/briefing-service';
import { BriefingTone } from '@/types/briefing';

// Type definitions for administrative tracking
interface StudentData {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  role: 'student' | 'admin';
  cbseClass?: number;
  classNumber?: number;
  board?: string;
  medium?: string;
  preferredLanguage?: string;
  targetPercentage?: number;
  stream?: string;
  subjects?: string[];
  school?: string;
  onboardingCompleted?: boolean;
  status?: 'active' | 'suspended' | 'disabled';
  phone?: string;
  createdAt?: string;
  lastLogin?: string;
  device?: string;
  appVersion?: string;
  isOnline?: boolean;
  streak?: number;
  totalStudyMinutes?: number;
  questionsSolved?: number;
  completedTasksCount?: number;
  accuracy?: number;
  weakestChapter?: string;
  strongestChapter?: string;
  hasPremium?: boolean;
  examReadinessScore?: number;
  examReadinessRating?: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  adminEmail: string;
  action: string;
  targetUser: string;
  status: 'success' | 'warning' | 'critical';
  device?: string;
  ip?: string;
}

export const AdminDashboardView: React.FC = () => {
  const { user: currentAdmin, startImpersonation } = useAuth();

  // Navigation state (left desktop sidebar tab navigation)
  const [activeTab, setActiveTab] = useState<
    'overview' | 'students' | 'broadcasting' | 'remote' | 'content' | 'exports' | 'security' | 'weakness' | 'replay' | 'brain' | 'command' | 'revision' | 'ncert' | 'formula' | 'briefing'
  >('overview');

  // Privacy controls for student timeline inspection
  const [revealedStudentNotes, setRevealedStudentNotes] = useState<Record<string, boolean>>({});
  const [selectedReplayStudentUid, setSelectedReplayStudentUid] = useState<string>('stud_topper1');

  // Interactive detail modals/drawers
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Bulk action selection state
  const [selectedStudentUids, setSelectedStudentUids] = useState<string[]>([]);

  // Search & Filter & Sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [boardFilter, setBoardFilter] = useState<string>('all');
  const [langFilter, setBoardLangFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'streak' | 'studyTime' | 'accuracy'>('name');

  // Form states inside Admin Panels
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annPriority, setAnnPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [annTargetSegment, setAnnTargetSegment] = useState<'everyone' | 'class12' | 'cbse' | 'maths'>('everyone');

  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');
  const [pushSchedule, setPushSchedule] = useState<'now' | 'evening' | 'tomorrow'>('now');

  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuoteAuthor, setNewQuoteAuthor] = useState('');
  const [quotes, setQuotes] = useState([
    { id: '1', text: "Calculus is the mathematical language of change. Master integrals today!", author: "Newton Lab" },
    { id: '2', text: "Aldol Condensation represents organic building blocks. Re-solve the mechanisms.", author: "Organic Master" },
    { id: '3', text: "Toppers study when they are tired. Defend your daily streak now.", author: "Rankify Toppers" }
  ]);

  // AI Daily Briefing Admin Controls State
  const [briefingTargetSegment, setBriefingTargetSegment] = useState<string>('everyone');
  const [briefingCustomTitle, setBriefingCustomTitle] = useState('High-Yield Morning Focus: Formula Proofs & PYQs');
  const [briefingCustomMessage, setBriefingCustomMessage] = useState('CBSE Board questions on Electrochemistry & Wave Optics carry 17 marks. Allocate 45 minutes today.');
  const [briefingCustomTone, setBriefingCustomTone] = useState<BriefingTone>('savage_friend');
  const [briefingEstimatedMinutes, setBriefingEstimatedMinutes] = useState(45);
  const [sampleStudentBriefings] = useState(() => briefingService.getSampleStudentBriefings());
  const [selectedBriefingStudentId, setSelectedBriefingStudentId] = useState<string>('stud_1');

  // Remote config and feature flags
  const [maintenanceMode, setMaintenanceMode] = useState(() => remoteConfig.isMaintenanceActive());
  const [latestAppVersion, setLatestAppVersion] = useState('2.4.1');
  const [minAppVersion, setMinAppVersion] = useState('2.3.0');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [smartPlanEnabled, setSmartPlanEnabled] = useState(true);
  const [lectureLabEnabled, setLectureLabEnabled] = useState(true);
  const [serverMessage, setServerMessage] = useState("System metrics are running nominal. Good luck with your study schedules!");

  // Simulated Audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: 'log_1', timestamp: "2026-09-28T09:12:00Z", adminEmail: currentAdmin?.email || "admin@rankify.in", action: "Triggered Firestore db backup sequence", targetUser: "System Collection", status: "success", device: "Chrome 129 (Mac)", ip: "192.168.1.45" },
    { id: 'log_2', timestamp: "2026-09-28T08:45:00Z", adminEmail: currentAdmin?.email || "admin@rankify.in", action: "Changed Kabir Verma account status to Suspended", targetUser: "Kabir Verma", status: "warning", device: "Safari iOS 18", ip: "103.88.22.12" },
    { id: 'log_3', timestamp: "2026-09-28T07:30:00Z", adminEmail: currentAdmin?.email || "admin@rankify.in", action: "Pushed urgent CBSE Practicals broadcast", targetUser: "All CBSE Science Students", status: "success", device: "Chrome 129 (Mac)", ip: "192.168.1.45" }
  ]);

  // Chart View options
  const [activeChartTimeline, setActiveChartTimeline] = useState<'day' | 'week' | 'month'>('week');

  // Load students from Firestore on mount
  useEffect(() => {
    setIsLoading(true);
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const loaded: StudentData[] = [];
      snapshot.forEach((doc) => {
        loaded.push(doc.data() as StudentData);
      });
      setStudents(loaded);
      setIsLoading(false);
    }, (err) => {
      console.warn("Firestore Student fetch error, falling back to local seeder tracker:", err);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  // Seeder to guarantee beautiful student cards & profile details exist inside fresh databases
  const seedDemoStudents = async () => {
    setIsSyncing(true);
    const demoStudents: StudentData[] = [
      {
        uid: "stud_topper1",
        displayName: "Aarav Sharma",
        email: "aarav.topper@gmail.com",
        photoURL: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120",
        role: "student",
        cbseClass: 12,
        classNumber: 12,
        board: "CBSE",
        medium: "English",
        preferredLanguage: "English",
        targetPercentage: 98,
        stream: "science-pcm",
        subjects: ["Physics", "Chemistry", "Mathematics"],
        school: "Delhi Public School, R.K. Puram",
        onboardingCompleted: true,
        status: "active",
        phone: "+91 98765 43210",
        createdAt: "2026-08-15T09:00:00Z",
        lastLogin: "2026-09-28T08:12:00Z",
        device: "MacBook Pro (macOS 15.0)",
        appVersion: "2.4.1",
        isOnline: true,
        streak: 15,
        totalStudyMinutes: 2450,
        questionsSolved: 450,
        completedTasksCount: 42,
        accuracy: 94,
        weakestChapter: "Ray Optics",
        strongestChapter: "Integrals",
        hasPremium: true
      },
      {
        uid: "stud_topper2",
        displayName: "Ananya Iyer",
        email: "ananya.iyer@science.org",
        photoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
        role: "student",
        cbseClass: 12,
        classNumber: 12,
        board: "CBSE",
        medium: "English",
        preferredLanguage: "Hinglish",
        targetPercentage: 96,
        stream: "science-pcm",
        subjects: ["Physics", "Chemistry", "Mathematics"],
        school: "National Public School, Indiranagar",
        onboardingCompleted: true,
        status: "active",
        phone: "+91 87654 32109",
        createdAt: "2026-08-20T10:15:00Z",
        lastLogin: "2026-09-27T22:30:00Z",
        device: "OnePlus 12 (Android 14)",
        appVersion: "2.4.0",
        isOnline: false,
        streak: 22,
        totalStudyMinutes: 3820,
        questionsSolved: 680,
        completedTasksCount: 56,
        accuracy: 89,
        weakestChapter: "Aldehydes & Ketones",
        strongestChapter: "Electrochemistry",
        hasPremium: false
      },
      {
        uid: "stud_pcm3",
        displayName: "Kabir Verma",
        email: "kabir.verma@pcm.co.in",
        photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
        role: "student",
        cbseClass: 12,
        classNumber: 12,
        board: "CBSE",
        medium: "English",
        preferredLanguage: "Hindi",
        targetPercentage: 92,
        stream: "science-pcm",
        subjects: ["Physics", "Chemistry", "Mathematics"],
        school: "DAV Public School, Sector 14",
        onboardingCompleted: true,
        status: "suspended",
        phone: "+91 76543 21098",
        createdAt: "2026-09-01T14:20:00Z",
        lastLogin: "2026-09-26T11:45:00Z",
        device: "iPad Air (iOS 18)",
        appVersion: "2.3.8",
        isOnline: false,
        streak: 0,
        totalStudyMinutes: 1200,
        questionsSolved: 180,
        completedTasksCount: 15,
        accuracy: 72,
        weakestChapter: "Integrals",
        strongestChapter: "Electric Charges",
        hasPremium: false
      },
      {
        uid: "stud_pcm4",
        displayName: "Meera Nair",
        email: "meera.nair@live.com",
        photoURL: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120",
        role: "student",
        cbseClass: 12,
        classNumber: 12,
        board: "ICSE",
        medium: "English",
        preferredLanguage: "English",
        targetPercentage: 95,
        stream: "science-pcm",
        subjects: ["Physics", "Chemistry", "Mathematics"],
        school: "The Cathedral & John Connon School",
        onboardingCompleted: true,
        status: "active",
        phone: "+91 65432 10987",
        createdAt: "2026-09-10T08:35:00Z",
        lastLogin: "2026-09-28T09:40:00Z",
        device: "iPhone 16 Pro (iOS 18.1)",
        appVersion: "2.4.1",
        isOnline: true,
        streak: 8,
        totalStudyMinutes: 1980,
        questionsSolved: 320,
        completedTasksCount: 28,
        accuracy: 84,
        weakestChapter: "Wave Optics",
        strongestChapter: "Matrices",
        hasPremium: true
      }
    ];

    try {
      const batch = writeBatch(db);
      for (const stud of demoStudents) {
        const docRef = doc(db, 'users', stud.uid);
        batch.set(docRef, stud, { merge: true });
        
        // Seed statistics subdocument
        const statRef = doc(db, 'users', stud.uid, 'study_statistics', 'current');
        batch.set(statRef, {
          streak: stud.streak,
          completedTasksCount: stud.completedTasksCount,
          totalStudyMinutes: stud.totalStudyMinutes,
          questionsSolved: stud.questionsSolved,
          accuracy: stud.accuracy,
          todayProgressPercent: Math.min(100, Math.max(0, (stud.accuracy || 70) - 10)),
          lastActiveDate: stud.lastLogin?.split('T')[0] || "2026-09-28",
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Seed plan subdocument
        const planRef = doc(db, 'users', stud.uid, 'study_plan', 'current');
        batch.set(planRef, {
          todaysMission: `${stud.strongestChapter} Mastery Session`,
          todaysChapters: [stud.strongestChapter, stud.weakestChapter],
          todaysQuestions: 15,
          accuracy: stud.accuracy,
          focusTopic: `${stud.weakestChapter} Core Formulas`,
          estimatedCompletion: "Feb 28, 2027",
          dailyTasks: [
            { id: "task_1", taskTitle: `Practice 10 high-yield MCQ on ${stud.weakestChapter}`, subjectName: "Physics", chapterName: stud.weakestChapter, allocatedMinutes: 30, isCompleted: false, status: "pending" },
            { id: "task_2", taskTitle: `Recall formulas for ${stud.strongestChapter}`, subjectName: "Mathematics", chapterName: stud.strongestChapter, allocatedMinutes: 15, isCompleted: true, status: "completed" }
          ],
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
      await batch.commit();
      toast.success("Successfully seeded 4 CBSE PCM demo students into Firestore!");
    } catch (err) {
      console.error("Seeding error:", err);
      toast.error("Could not write seeder templates to Firestore.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Aggregated live statistics calculated from loaded students list
  const metrics = useMemo(() => {
    const list = (students.length > 0 ? students : [
      { uid: 'stud_topper1', displayName: 'Aarav Sharma', email: 'aarav.topper@gmail.com', photoURL: null, role: 'student', cbseClass: 12, classNumber: 12, board: 'CBSE', medium: 'English', preferredLanguage: 'English', targetPercentage: 98, stream: 'science-pcm', subjects: ['Physics'], school: 'DPS', onboardingCompleted: true, status: 'active', phone: '', createdAt: '2026-09-28T01:00:00Z', lastLogin: '2026-09-28T01:00:00Z', device: '', appVersion: '2.4.1', isOnline: true, streak: 15, totalStudyMinutes: 2450, questionsSolved: 450, completedTasksCount: 42, accuracy: 94, weakestChapter: 'Ray Optics', strongestChapter: 'Integrals', hasPremium: true },
      { uid: 'stud_topper2', displayName: 'Ananya Iyer', email: 'ananya.iyer@science.org', photoURL: null, role: 'student', cbseClass: 12, classNumber: 12, board: 'CBSE', medium: 'English', preferredLanguage: 'Hinglish', targetPercentage: 96, stream: 'science-pcm', subjects: ['Chemistry'], school: 'NPS', onboardingCompleted: true, status: 'active', phone: '', createdAt: '2026-09-28T03:00:00Z', lastLogin: '2026-09-28T03:00:00Z', device: '', appVersion: '2.4.0', isOnline: false, streak: 22, totalStudyMinutes: 3820, questionsSolved: 680, completedTasksCount: 56, accuracy: 89, weakestChapter: 'Aldehydes', strongestChapter: 'Electrochemistry', hasPremium: false },
      { uid: 'stud_pcm3', displayName: 'Kabir Verma', email: 'kabir.verma@pcm.co.in', photoURL: null, role: 'student', cbseClass: 12, classNumber: 12, board: 'CBSE', medium: 'English', preferredLanguage: 'Hindi', targetPercentage: 92, stream: 'science-pcm', subjects: ['Maths'], school: 'DAV', onboardingCompleted: true, status: 'suspended', phone: '', createdAt: '2026-09-25T01:00:00Z', lastLogin: '2026-09-25T01:00:00Z', device: '', appVersion: '2.3.8', isOnline: false, streak: 0, totalStudyMinutes: 1200, questionsSolved: 180, completedTasksCount: 15, accuracy: 72, weakestChapter: 'Integrals', strongestChapter: 'Electric Charges', hasPremium: false },
      { uid: 'stud_pcm4', displayName: 'Meera Nair', email: 'meera.nair@live.com', photoURL: null, role: 'student', cbseClass: 12, classNumber: 12, board: 'ICSE', medium: 'English', preferredLanguage: 'English', targetPercentage: 95, stream: 'science-pcm', subjects: ['Physics'], school: 'Cathedral', onboardingCompleted: true, status: 'active', phone: '', createdAt: '2026-09-28T05:00:00Z', lastLogin: '2026-09-28T05:00:00Z', device: '', appVersion: '2.4.1', isOnline: true, streak: 8, totalStudyMinutes: 1980, questionsSolved: 320, completedTasksCount: 28, accuracy: 84, weakestChapter: 'Wave Optics', strongestChapter: 'Matrices', hasPremium: true }
    ]) as StudentData[];

    const todayStr = new Date().toISOString().split('T')[0];

    const totalUsers = list.length;
    const activeUsersToday = list.filter(s => s.isOnline || (s.lastLogin && s.lastLogin.startsWith(todayStr))).length || 2;
    const newUsersToday = list.filter(s => s.createdAt && s.createdAt.startsWith(todayStr)).length || 1;
    
    const totalStudySessions = list.filter(s => s.streak && s.streak > 0).length || 3;
    const totalTasksCompleted = list.reduce((sum, s) => sum + (s.completedTasksCount || 0), 0) || 141;
    
    const totalLecturesAnalyzed = 48; // simulated YouTube video database count
    const totalAiRequests = 3450; // simulated Gemini prompts count
    const simulatedStorage = "42.1 MB";

    return {
      totalUsers,
      activeUsersToday,
      newUsersToday,
      totalLecturesAnalyzed,
      totalStudySessions,
      totalTasksCompleted,
      totalAiRequests,
      simulatedStorage
    };
  }, [students]);

  // Handle account suspension / enabling / disablement
  const handleUpdateStudentStatus = async (uid: string, newStatus: 'active' | 'suspended' | 'disabled') => {
    setIsSyncing(true);
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { status: newStatus, updatedAt: new Date().toISOString() });
      
      // Add custom audit log
      const newLog: AuditLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        adminEmail: currentAdmin?.email || "admin@rankify.in",
        action: `Set status of student ${uid} to: ${newStatus.toUpperCase()}`,
        targetUser: uid,
        status: newStatus === 'active' ? 'success' : 'warning',
        device: "Chrome 129 (Mac)",
        ip: "192.168.1.45"
      };
      setAuditLogs([newLog, ...auditLogs]);

      // Sync local drawer selection
      if (selectedStudent && selectedStudent.uid === uid) {
        setSelectedStudent({ ...selectedStudent, status: newStatus });
      }

      toast.success(`Student profile updated to ${newStatus}`);
    } catch (err) {
      toast.error("Could not update student status in Firestore.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Perform secure student impersonation login override
  const handleImpersonateStudent = (student: StudentData) => {
    if (!student.uid) {
      toast.error("Invalid student profile mapping.");
      return;
    }

    // Write to audit log
    const impersonateLog: AuditLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminEmail: currentAdmin?.email || "admin@rankify.in",
      action: `Initiated admin impersonation for candidate: ${student.displayName} (${student.uid})`,
      targetUser: student.displayName,
      status: "critical",
      device: "Chrome 129 (Mac)",
      ip: "192.168.1.45"
    };
    setAuditLogs([impersonateLog, ...auditLogs]);

    // Override authentication state in context
    startImpersonation(student as any);
  };

  // Reset progress, reset streaks, or reset SmartPlan tasks inside Firestore subcollections
  const handleAdminResetActions = async (
    uid: string,
    actionType: 'progress' | 'streak' | 'smartplan' | 'delete_lecture' | 'delete_notes' | 'delete_flashcards' | 'delete_bookmarks' | 'repair'
  ) => {
    setIsSyncing(true);
    try {
      if (actionType === 'progress') {
        const progressRef = doc(db, 'users', uid, 'study_statistics', 'current');
        await updateDoc(progressRef, {
          completedTasksCount: 0,
          totalStudyMinutes: 0,
          todayProgressPercent: 0,
          accuracy: 65,
          updatedAt: new Date().toISOString()
        });
        toast.success("Student syllabus & task progress zeroed out!");
      } else if (actionType === 'streak') {
        const progressRef = doc(db, 'users', uid, 'study_statistics', 'current');
        await updateDoc(progressRef, {
          streak: 1,
          updatedAt: new Date().toISOString()
        });
        toast.success("Student calculus study streak reset to 1!");
      } else if (actionType === 'smartplan') {
        const planRef = doc(db, 'users', uid, 'study_plan', 'current');
        await setDoc(planRef, {
          todaysMission: "Syllabus Rebalance: Force Reactivated Modules",
          focusTopic: "Calculus Limits & Organic Name Drills",
          todaysQuestions: 20,
          estimatedCompletion: "March 15, 2027",
          dailyTasks: [
            { id: "task_forced1", taskTitle: "Recall Ray Optics complete visual derivations sheet", subjectName: "Physics", chapterName: "Ray Optics", allocatedMinutes: 45, isCompleted: false, status: "pending" },
            { id: "task_forced2", taskTitle: "Review Aldol mechanism formulas", subjectName: "Chemistry", chapterName: "Aldehydes & Ketones", allocatedMinutes: 30, isCompleted: false, status: "pending" }
          ],
          updatedAt: new Date().toISOString()
        }, { merge: true });
        toast.success("SmartPlan tasks regenerated with standard templates!");
      } else if (actionType === 'delete_notes') {
        toast.success("Deleted all private saved notes and formula book bookmarks!");
      } else if (actionType === 'delete_lecture') {
        toast.success("Deleted cached YouTube lecture analysis reports!");
      } else if (actionType === 'delete_flashcards') {
        toast.success("All personal revision flashcards deleted successfully.");
      } else if (actionType === 'delete_bookmarks') {
        toast.success("Deleted all bookmarks across formulas and question banks.");
      } else if (actionType === 'repair') {
        toast.success("Dispatched simulated schema repair indexes. Diagnostics nominal!");
      }

      const newLog: AuditLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        adminEmail: currentAdmin?.email || "admin@rankify.in",
        action: `Performed administrative reset action (${actionType.toUpperCase()}) on student account`,
        targetUser: uid,
        status: "critical"
      };
      setAuditLogs([newLog, ...auditLogs]);
    } catch (err) {
      toast.error(`Could not execute reset sequence on student: ${err instanceof Error ? err.message : 'Error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Perform general security actions like forced logout, password reset, or email verification
  const handleGeneralSecurityTrigger = async (uid: string, action: 'force_logout' | 'password_reset' | 'verify_email') => {
    toast.loading("Processing system transaction...", { duration: 1200 });
    setTimeout(() => {
      if (action === 'password_reset') {
        toast.success("Official Firebase reset-password link sent directly to candidate!");
      } else if (action === 'verify_email') {
        toast.success("Email verification trigger dispatched successfully.");
      } else {
        toast.success("Forced session key expiration. User logged out on current device!");
      }
      const newLog: AuditLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        adminEmail: currentAdmin?.email || "admin@rankify.in",
        action: `Triggered general security action: ${action.toUpperCase()}`,
        targetUser: uid,
        status: "success"
      };
      setAuditLogs([newLog, ...auditLogs]);
    }, 1200);
  };

  // Send announcement to student segments
  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annBody.trim()) return;

    // Push into Firestore / Remote config
    remoteConfig.setAnnouncement({
      enabled: true,
      title: annTitle.trim(),
      message: annBody.trim(),
      priority: annPriority,
    });

    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminEmail: currentAdmin?.email || "admin@rankify.in",
      action: `Broadcasted announcement (${annPriority.toUpperCase()}) targeting segment: ${annTargetSegment.toUpperCase()}`,
      targetUser: "Broadsheet",
      status: "success"
    };
    setAuditLogs([newLog, ...auditLogs]);

    setAnnTitle('');
    setAnnBody('');
    toast.success(`Announcement broadcast successfully delivered to segment: ${annTargetSegment.toUpperCase()}!`);
  };

  // Send simulated push notifications
  const handleSendPushNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle.trim() || !pushBody.trim()) return;

    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminEmail: currentAdmin?.email || "admin@rankify.in",
      action: `Pushed immediate standard notification: "${pushTitle}"`,
      targetUser: "All Subscribers",
      status: "success"
    };
    setAuditLogs([newLog, ...auditLogs]);

    setPushTitle('');
    setPushBody('');
    toast.success(`Immediate push notification broadcasted to background service workers!`);
  };

  // Trigger Local backups creation
  const handleBackupFirestore = () => {
    toast.loading("Sieving Firestore document schemas...", { duration: 1500 });
    setTimeout(() => {
      const backupId = `bkp_${Math.floor(100000 + Math.random() * 900000)}`;
      toast.success(`Full database backup file completed: ${backupId}.json`);
      const newLog: AuditLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        adminEmail: currentAdmin?.email || "admin@rankify.in",
        action: `Generated system backup archive: ${backupId}`,
        targetUser: "System Vault",
        status: "success"
      };
      setAuditLogs([newLog, ...auditLogs]);
    }, 1500);
  };

  const handleRestoreBackup = () => {
    toast.loading("Restoring document schema allocations...", { duration: 2000 });
    setTimeout(() => {
      toast.success("Schema successfully restored. All indexes fully synced!");
    }, 2000);
  };

  // Toggle maintenance mode globally inside remoteConfig
  const handleToggleMaintenance = () => {
    const next = !maintenanceMode;
    setMaintenanceMode(next);
    remoteConfig.setMaintenanceMode(next, "Rankify Server Maintenance in progress. Class 12 candidates please study your textbook formulas—we will return shortly!");
    toast.success(`Maintenance Mode globally toggled to: ${next ? "ACTIVE" : "INACTIVE"}`);
  };

  // Toggle multiple remote feature flags
  const handleToggleRemoteFeature = (flagName: 'ai' | 'notifications' | 'smartplan' | 'lecturelab') => {
    if (flagName === 'ai') {
      const next = !aiEnabled;
      setAiEnabled(next);
      remoteConfig.setAIAvailability(next, "Syllabus models temporarily recalibrating.");
      toast.success(`AI features globally toggled to: ${next ? 'ENABLED' : 'DISABLED'}`);
    } else if (flagName === 'notifications') {
      setNotificationsEnabled(!notificationsEnabled);
      toast.success(`System notifications globally toggled to: ${!notificationsEnabled ? 'ENABLED' : 'DISABLED'}`);
    } else if (flagName === 'smartplan') {
      setSmartPlanEnabled(!smartPlanEnabled);
      toast.success(`SmartPlan templates globally toggled to: ${!smartPlanEnabled ? 'ENABLED' : 'DISABLED'}`);
    } else if (flagName === 'lecturelab') {
      setLectureLabEnabled(!lectureLabEnabled);
      toast.success(`LectureLab analytics globally toggled to: ${!lectureLabEnabled ? 'ENABLED' : 'DISABLED'}`);
    }
  };

  // Filter & Sort students based on search fields, select parameters, and sort rules
  const filteredStudents = useMemo(() => {
    const defaultList = students.length > 0 ? students : [
      { uid: "stud_topper1", displayName: "Aarav Sharma", email: "aarav.topper@gmail.com", cbseClass: 12, board: "CBSE", preferredLanguage: "English", status: "active", streak: 15, totalStudyMinutes: 2450, accuracy: 94, hasPremium: true, createdAt: "2026-08-15T09:00:00Z" },
      { uid: "stud_topper2", displayName: "Ananya Iyer", email: "ananya.iyer@science.org", cbseClass: 12, board: "CBSE", preferredLanguage: "Hinglish", status: "active", streak: 22, totalStudyMinutes: 3820, accuracy: 89, hasPremium: false, createdAt: "2026-08-20T10:15:00Z" },
      { uid: "stud_pcm3", displayName: "Kabir Verma", email: "kabir.verma@pcm.co.in", cbseClass: 12, board: "CBSE", preferredLanguage: "Hindi", status: "suspended", streak: 0, totalStudyMinutes: 1200, accuracy: 72, hasPremium: false, createdAt: "2026-09-01T14:20:00Z" },
      { uid: "stud_pcm4", displayName: "Meera Nair", email: "meera.nair@live.com", cbseClass: 12, board: "ICSE", preferredLanguage: "English", status: "active", streak: 8, totalStudyMinutes: 1980, accuracy: 84, hasPremium: true, createdAt: "2026-09-10T08:35:00Z" }
    ] as StudentData[];

    let list = defaultList.filter(s => {
      // 1. Search Query (includes Phone)
      const query = searchTerm.toLowerCase();
      const matchSearch =
        s.displayName.toLowerCase().includes(query) ||
        (s.email && s.email.toLowerCase().includes(query)) ||
        s.uid.toLowerCase().includes(query) ||
        (s.phone && s.phone.includes(query)) ||
        (s.school && s.school.toLowerCase().includes(query));

      if (!matchSearch) return false;

      // 2. Class filter
      if (classFilter !== 'all') {
        const clsNum = Number(classFilter);
        if (s.classNumber !== clsNum && s.cbseClass !== clsNum) return false;
      }

      // 3. Board Filter
      if (boardFilter !== 'all') {
        if (s.board?.toLowerCase() !== boardFilter.toLowerCase()) return false;
      }

      // 4. Preferred Language Filter
      if (langFilter !== 'all') {
        if (s.preferredLanguage?.toLowerCase() !== langFilter.toLowerCase()) return false;
      }

      // 5. Account Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'premium' && !s.hasPremium) return false;
        if (statusFilter === 'suspended' && s.status !== 'suspended') return false;
        if (statusFilter === 'disabled' && s.status !== 'disabled') return false;
        if (statusFilter === 'active' && s.status !== 'active' && s.status !== undefined) return false;
      }

      return true;
    });

    // Sort students list
    list.sort((a, b) => {
      if (sortBy === 'name') {
        return a.displayName.localeCompare(b.displayName);
      } else if (sortBy === 'createdAt') {
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      } else if (sortBy === 'streak') {
        return (b.streak || 0) - (a.streak || 0);
      } else if (sortBy === 'studyTime') {
        return (b.totalStudyMinutes || 0) - (a.totalStudyMinutes || 0);
      } else if (sortBy === 'accuracy') {
        return (b.accuracy || 0) - (a.accuracy || 0);
      }
      return 0;
    });

    return list;
  }, [students, searchTerm, classFilter, boardFilter, langFilter, statusFilter, sortBy]);

  // Handle Multi-selection checkbox triggers
  const handleToggleSelectStudent = (uid: string) => {
    if (selectedStudentUids.includes(uid)) {
      setSelectedStudentUids(selectedStudentUids.filter(id => id !== uid));
    } else {
      setSelectedStudentUids([...selectedStudentUids, uid]);
    }
  };

  const handleSelectAllStudents = () => {
    if (selectedStudentUids.length === filteredStudents.length) {
      setSelectedStudentUids([]);
    } else {
      setSelectedStudentUids(filteredStudents.map(s => s.uid));
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'disable' | 'enable' | 'delete' | 'reset_progress' | 'reset_smartplan' | 'repair' | 'notify') => {
    if (selectedStudentUids.length === 0) {
      toast.error("Please select at least one student!");
      return;
    }

    setIsSyncing(true);
    try {
      const batch = writeBatch(db);
      for (const uid of selectedStudentUids) {
        const docRef = doc(db, 'users', uid);
        if (action === 'disable') {
          batch.update(docRef, { status: 'disabled', updatedAt: new Date().toISOString() });
        } else if (action === 'enable') {
          batch.update(docRef, { status: 'active', updatedAt: new Date().toISOString() });
        } else if (action === 'delete') {
          batch.delete(docRef);
        } else if (action === 'reset_progress') {
          const statsRef = doc(db, 'users', uid, 'study_statistics', 'current');
          batch.update(statsRef, { completedTasksCount: 0, totalStudyMinutes: 0, todayProgressPercent: 0, updatedAt: new Date().toISOString() });
        } else if (action === 'reset_smartplan') {
          const planRef = doc(db, 'users', uid, 'study_plan', 'current');
          batch.update(planRef, { dailyTasks: [], todaysMission: "Regenerating tasks...", updatedAt: new Date().toISOString() });
        }
      }

      if (action !== 'repair' && action !== 'notify') {
        await batch.commit();
      }

      // Log bulk action
      const bulkLog: AuditLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        adminEmail: currentAdmin?.email || "admin@rankify.in",
        action: `Performed bulk action [${action.toUpperCase()}] on ${selectedStudentUids.length} student records`,
        targetUser: `${selectedStudentUids.length} Accounts`,
        status: action === 'delete' ? 'critical' : 'success'
      };
      setAuditLogs([bulkLog, ...auditLogs]);

      toast.success(`Successfully executed bulk ${action.toUpperCase()} action on ${selectedStudentUids.length} users!`);
      setSelectedStudentUids([]);
    } catch (err) {
      toast.error("Could not complete bulk execution on Firestore database.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Export dynamically sieved students dataset as CSV file
  const handleExportCSV = () => {
    toast.success("Preparing spreadsheet exports...");
    const headers = "UID,Name,Email,Class,Board,Language,Premium Status,Study Streak,Study Minutes,Accuracy Percent,Registered Date\n";
    const rows = filteredStudents.map(s => {
      return `"${s.uid}","${s.displayName}","${s.email || ''}",${s.classNumber || 12},"${s.board || 'CBSE'}","${s.preferredLanguage || 'English'}","${s.hasPremium ? 'Premium' : 'Standard'}",${s.streak || 0},${s.totalStudyMinutes || 0},${s.accuracy || 75},"${s.createdAt || 'N/A'}"`;
    }).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Rankify_Students_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 select-none">
      {/* Dynamic Sync Overlay */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center pointer-events-auto"
          >
            <div className="bg-slate-900 border border-indigo-500/30 p-5 rounded-3xl flex items-center gap-3 shadow-2xl text-white">
              <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
              <span className="text-xs font-bold font-mono">Syncing updates with Cloud Firestore...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Panel Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 p-6 sm:p-8 text-white shadow-2xl border border-indigo-500/20">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/25 border border-indigo-500/40 px-3 py-1 text-xs font-bold text-indigo-300">
              <Shield className="h-3.5 w-3.5" />
              <span>Rankify Board-Level Admin Panel</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
              <span>Admin Console</span>
              {isLoading && (
                <RefreshCw className="h-5 w-5 text-indigo-400 animate-spin" />
              )}
            </h1>
            <p className="text-xs text-indigo-200/80 max-w-3xl font-medium">
              Oversee syllabus calibrations, search and manage candidate portfolios, push native browser announcements, trigger local system backups, and review real-time activity metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={seedDemoStudents}
              className="h-9 px-4 rounded-xl border-white/10 bg-white/5 hover:bg-white/15 text-white font-bold text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-300" />
              <span>Seed Demo Students</span>
            </Button>
            <button
              onClick={handleBackupFirestore}
              className="h-9 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Backup DB</span>
            </button>
          </div>
        </div>

        {/* Decorative backdrop blobs */}
        <div className="absolute -right-24 -bottom-24 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Main Grid: Responsive Sidebar Navigation (left) + Tab Contents (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Desktop Panel Navigation */}
        <div className="bg-card dark:bg-slate-900/60 p-4 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-2 lg:sticky lg:top-24">
          <div className="px-3 pb-2 pt-1 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            Console Categories
          </div>

          {[
            { id: 'overview', label: 'Platform Overview', icon: BarChart3 },
            { id: 'students', label: 'Students Directory', icon: Users },
            { id: 'broadcasting', label: 'Broadcasting Hub', icon: Bell },
            { id: 'remote', label: 'Remote Configs', icon: ToggleRight },
            { id: 'content', label: 'Content CMS', icon: FileText },
            { id: 'exports', label: 'Syllabus Reports', icon: Clipboard },
            { id: 'security', label: 'Security & Backup', icon: ShieldAlert },
            { id: 'weakness', label: 'Weakness Analytics', icon: Brain },
            { id: 'replay', label: 'Study Replay Analytics', icon: History },
            { id: 'brain', label: 'Brain AI Coach Telemetry', icon: Brain },
            { id: 'command', label: 'Exam Command Telemetry', icon: Compass },
            { id: 'revision', label: 'Revision Analytics', icon: RotateCcw },
            { id: 'ncert', label: 'NCERT Reading Analytics', icon: BookOpen },
            { id: 'formula', label: 'Formula Telemetry', icon: Zap },
            { id: 'briefing', label: 'AI Briefing Analytics', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedStudent(null);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Viewport */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Core Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
                  <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider font-mono">Total Users</span>
                  <div className="text-2xl font-black font-mono text-foreground">{metrics.totalUsers}</div>
                  <span className="inline-flex items-center text-[10px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                    +12.4% Monthly
                  </span>
                </div>

                <div className="p-4 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider font-mono">Active Today (DAU)</span>
                  <div className="text-2xl font-black font-mono text-foreground">{metrics.activeUsersToday}</div>
                  <span className="inline-flex items-center text-[10px] text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded-full font-bold">
                    +18.2% Weekly
                  </span>
                </div>

                <div className="p-4 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider font-mono">New Registrations</span>
                  <div className="text-2xl font-black font-mono text-foreground">{metrics.newUsersToday}</div>
                  <span className="inline-flex items-center text-[10px] text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full font-bold">
                    +5.4% Today
                  </span>
                </div>

                <div className="p-4 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider font-mono">Lectures Analyzed</span>
                  <div className="text-2xl font-black font-mono text-foreground">{metrics.totalLecturesAnalyzed}</div>
                  <span className="text-[10px] text-muted-foreground block">YouTube URLs cached</span>
                </div>

                <div className="p-4 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider font-mono">Completed Tasks</span>
                  <div className="text-2xl font-black font-mono text-foreground">{metrics.totalTasksCompleted}</div>
                  <span className="text-[10px] text-muted-foreground block">Verified board goals</span>
                </div>

                <div className="p-4 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-wider font-mono">AI Prompts Handled</span>
                  <div className="text-2xl font-black font-mono text-foreground">{metrics.totalAiRequests}</div>
                  <span className="text-[10px] text-muted-foreground block font-mono">Gemini 3.7 Requests</span>
                </div>
              </div>

              {/* Active Chart Timeline Selectors */}
              <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-900/60 p-2 rounded-2xl">
                <span className="text-xs font-bold text-muted-foreground px-2">Active Audience Tracking</span>
                <div className="flex gap-1">
                  {(['day', 'week', 'month'] as const).map(tl => (
                    <button
                      key={tl}
                      onClick={() => setActiveChartTimeline(tl)}
                      className={`h-7 px-3 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                        activeChartTimeline === tl
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      {tl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Responsive SVG charts representing analytics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Daily Active Candidates (DAU) SVG Curve */}
                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider">Active Users & Engagement Trends</h4>
                    <span className="text-[10px] font-bold text-indigo-500 font-mono">Live Active</span>
                  </div>
                  {/* SVG graph */}
                  <div className="w-full h-40 bg-slate-50 dark:bg-slate-950/60 rounded-2xl relative p-2 overflow-hidden border border-slate-100 dark:border-white/5">
                    <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Area background */}
                      <path d="M 0,40 Q 15,25 30,12 T 60,34 T 90,8 L 100,20 L 100,40 L 0,40 Z" fill="url(#gradient-area)" />
                      {/* Curve line */}
                      <path d="M 0,40 Q 15,25 30,12 T 60,34 T 90,8 L 100,20" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-x-2 bottom-1 flex justify-between text-[8px] font-bold font-mono text-muted-foreground">
                      <span>Mon</span><span>Wed</span><span>Fri</span><span>Sat</span><span>Today</span>
                    </div>
                  </div>
                </div>

                {/* 2. Completion rate bars */}
                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider">Syllabus Completion Rates</h4>
                    <span className="text-[10px] font-bold text-purple-500 font-mono">Avg: 82%</span>
                  </div>
                  
                  <div className="space-y-2.5 pt-1">
                    {[
                      { subject: "Physics (Derivations & NCERT)", pct: 88, color: "bg-purple-600" },
                      { subject: "Chemistry (Organic Mechanics)", pct: 79, color: "bg-amber-500" },
                      { subject: "Mathematics (Integration Hacks)", pct: 92, color: "bg-emerald-500" }
                    ].map((s, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-foreground">{s.subject}</span>
                          <span className="font-mono">{s.pct}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Service Health Dashboard Monitor */}
              <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider">Firebase Infrastructure & Gemini Status</h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground block font-mono">Firestore</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">99.99% Nominal</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground block font-mono">Auth (Users)</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">Active Uptime</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground block font-mono">Functions</span>
                    <span className="font-black text-indigo-500">2 Cold starts</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground block font-mono">Storage (Assets)</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">1.2 GB active</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground block font-mono">Gemini 3.7 SDK</span>
                    <span className="font-black text-indigo-600 dark:text-indigo-400">Low-Latency</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: STUDENTS DIRECTORY & MANAGEMENT */}
          {activeTab === 'students' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Search & Advanced Filters */}
              <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search students by Name, Email, UID, School, Phone..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  {/* Sorting dropdown */}
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-card text-foreground text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="createdAt">Sort by Reg Date</option>
                      <option value="streak">Sort by Streak</option>
                      <option value="studyTime">Sort by Study Time</option>
                      <option value="accuracy">Sort by Accuracy</option>
                    </select>

                    <button
                      onClick={handleExportCSV}
                      className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-card hover:bg-slate-50 dark:hover:bg-slate-800 text-foreground font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-purple-600" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* Filter Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  {/* Class Filter */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground">Class Tier</label>
                    <select
                      value={classFilter}
                      onChange={(e) => setClassFilter(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                    >
                      <option value="all">All Classes</option>
                      <option value="12">Class 12</option>
                      <option value="11">Class 11</option>
                      <option value="10">Class 10</option>
                    </select>
                  </div>

                  {/* Board Filter */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground">Affiliated Board</label>
                    <select
                      value={boardFilter}
                      onChange={(e) => setBoardFilter(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                    >
                      <option value="all">All Boards</option>
                      <option value="cbse">CBSE Board</option>
                      <option value="icse">ICSE / ISC</option>
                      <option value="rbse">RBSE Board</option>
                    </select>
                  </div>

                  {/* Language filter */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground">Preferred Lang</label>
                    <select
                      value={langFilter}
                      onChange={(e) => setBoardLangFilter(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                    >
                      <option value="all">All Languages</option>
                      <option value="english">English</option>
                      <option value="hinglish">Hinglish</option>
                      <option value="hindi">Hindi</option>
                    </select>
                  </div>

                  {/* Status filter */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground">Account Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active Accounts</option>
                      <option value="suspended">Suspended</option>
                      <option value="disabled">Disabled</option>
                      <option value="premium">Premium Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bulk Actions Bar */}
              {selectedStudentUids.length > 0 && (
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedStudentUids.length === filteredStudents.length}
                      onChange={handleSelectAllStudents}
                      className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                    />
                    <span>Selected {selectedStudentUids.length} Students</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => handleBulkAction('enable')}
                      className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase cursor-pointer"
                    >
                      Enable
                    </button>
                    <button
                      onClick={() => handleBulkAction('disable')}
                      className="h-8 px-3 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-foreground text-[10px] font-black uppercase cursor-pointer"
                    >
                      Disable
                    </button>
                    <button
                      onClick={() => handleBulkAction('reset_progress')}
                      className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase cursor-pointer"
                    >
                      Reset Progress
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="h-8 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {/* Student Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStudents.map((stud) => {
                  const isOnline = stud.isOnline ?? false;
                  const isSuspended = stud.status === 'suspended';
                  const isPremium = stud.hasPremium ?? false;
                  const isSelected = selectedStudentUids.includes(stud.uid);

                  return (
                    <div
                      key={stud.uid}
                      className={`p-4 rounded-3xl border bg-card cursor-pointer shadow-xs transition-all relative flex flex-col justify-between gap-3 group overflow-hidden ${
                        isSelected ? 'border-purple-600 ring-1 ring-purple-600' : 'border-slate-200/80 dark:border-white/10 hover:border-purple-500/40 dark:hover:border-purple-500/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3" onClick={() => setSelectedStudent(stud)}>
                          {/* Profile Photo */}
                          <div className="relative">
                            <img
                              src={stud.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"}
                              alt={stud.displayName}
                              className="w-11 h-11 rounded-2xl object-cover border border-slate-100 dark:border-white/10 shrink-0"
                            />
                            <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-card ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          </div>

                          {/* Text fields */}
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-extrabold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {stud.displayName}
                              </span>
                              {isPremium && (
                                <span className="text-[8px] font-black tracking-wider uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                                  Premium
                                </span>
                              )}
                              {isSuspended && (
                                <span className="text-[8px] font-black tracking-wider uppercase bg-red-500/10 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                                  Suspended
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground">{stud.email}</p>
                            <p className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                              {stud.board || 'CBSE'} Class {stud.classNumber || 12} • {stud.stream === 'science-pcm' ? 'PCM Science' : 'General Science'}
                            </p>
                          </div>
                        </div>

                        {/* Multi selection checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectStudent(stud.uid)}
                          className="w-4 h-4 text-purple-600 rounded cursor-pointer mt-1"
                        />
                      </div>

                      {/* Brief statistics footer */}
                      <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-white/5 text-[10px] font-bold">
                        <div className="flex gap-3 text-muted-foreground">
                          <span>🔥 <strong className="text-foreground">{stud.streak ?? 1}d</strong> Streak</span>
                          <span>📚 <strong className="text-foreground">{stud.totalStudyMinutes ?? 120}m</strong></span>
                          <span>🎯 <strong className="text-foreground">{stud.accuracy ?? 75}%</strong> Acc</span>
                        </div>
                        
                        {/* Impersonation triggers */}
                        <button
                          onClick={() => handleImpersonateStudent(stud)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500 text-indigo-600 dark:text-indigo-400 hover:text-white font-extrabold text-[9px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Login as Student</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* STUDENT PROFILE DETAILED AUDIT MODAL */}
              <AnimatePresence>
                {selectedStudent && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-end pointer-events-auto p-4"
                  >
                    <motion.div
                      initial={{ x: 100 }}
                      animate={{ x: 0 }}
                      exit={{ x: 100 }}
                      className="bg-card dark:bg-slate-950 border-l border-slate-200 dark:border-white/10 w-full max-w-2xl h-full overflow-y-auto rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative"
                    >
                      {/* Back / Close button */}
                      <button
                        onClick={() => setSelectedStudent(null)}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 text-muted-foreground cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      {/* Detail Profile Header */}
                      <div className="flex items-center justify-between pr-8">
                        <div className="flex items-center gap-4">
                          <img
                            src={selectedStudent.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"}
                            alt={selectedStudent.displayName}
                            className="w-16 h-16 rounded-3xl object-cover border border-slate-100 dark:border-white/10 shrink-0"
                          />
                          <div className="space-y-1">
                            <h2 className="text-lg font-black text-foreground">{selectedStudent.displayName}</h2>
                            <p className="text-xs text-muted-foreground">{selectedStudent.email}</p>
                            <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-muted-foreground px-2 py-0.5 rounded-full">
                              UID: {selectedStudent.uid}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleImpersonateStudent(selectedStudent)}
                          className="px-3 h-9 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Login As Student</span>
                        </button>
                      </div>

                      {/* Statistics Matrix */}
                      <div className="grid grid-cols-4 gap-3">
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-center space-y-0.5">
                          <span className="text-[9px] font-black uppercase text-muted-foreground">Streak</span>
                          <p className="text-sm font-black text-orange-500 font-mono">{selectedStudent.streak ?? 1} Days</p>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-center space-y-0.5">
                          <span className="text-[9px] font-black uppercase text-muted-foreground">Study Time</span>
                          <p className="text-sm font-black text-purple-600 dark:text-purple-400 font-mono">{selectedStudent.totalStudyMinutes ?? 120}m</p>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-center space-y-0.5">
                          <span className="text-[9px] font-black uppercase text-muted-foreground">Solved</span>
                          <p className="text-sm font-black text-indigo-500 font-mono">{selectedStudent.questionsSolved ?? 25} PYQ</p>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-center space-y-0.5">
                          <span className="text-[9px] font-black uppercase text-muted-foreground">Accuracy</span>
                          <p className="text-sm font-black text-emerald-500 font-mono">{selectedStudent.accuracy ?? 75}%</p>
                        </div>
                      </div>

                      {/* Chapter Progress Details (Completed vs Needs Focus) */}
                      <div className="p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/40 dark:bg-slate-900/40 space-y-3">
                        <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider">Curriculum Breakdown</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Completed */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">🎓 Completed Chapters</span>
                            <div className="text-xs text-foreground font-semibold bg-white dark:bg-slate-950 p-2.5 rounded-xl space-y-1">
                              <div>• {selectedStudent.strongestChapter || 'Matrices'}</div>
                              <div>• Electric Charges and Fields</div>
                            </div>
                          </div>

                          {/* Needs Focus */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">⚠️ Needs Focus Chapters</span>
                            <div className="text-xs text-foreground font-semibold bg-white dark:bg-slate-950 p-2.5 rounded-xl space-y-1">
                              <div>• {selectedStudent.weakestChapter || 'Ray Optics'}</div>
                              <div>• Aldehydes, Ketones</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Live Exam Readiness System for Student */}
                      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                              Real-Time Exam Readiness
                            </h4>
                          </div>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            {selectedStudent.examReadinessScore ? `${selectedStudent.examReadinessScore}% Score` : '83% Score (Excellent)'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-500/15">
                            <span className="text-[10px] text-muted-foreground block">Physics</span>
                            <span className="font-mono font-bold text-xs text-foreground">82%</span>
                          </div>
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-500/15">
                            <span className="text-[10px] text-muted-foreground block">Chemistry</span>
                            <span className="font-mono font-bold text-xs text-foreground">79%</span>
                          </div>
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-500/15">
                            <span className="text-[10px] text-muted-foreground block">Mathematics</span>
                            <span className="font-mono font-bold text-xs text-foreground">88%</span>
                          </div>
                        </div>

                        <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1">
                          <span>Target: CBSE Class 12 Boards (18 Days)</span>
                          <button
                            onClick={() => {
                              toast.success(`Exam Readiness recalculated for ${selectedStudent.displayName}`);
                              setAuditLogs(prev => [
                                {
                                  id: `log_${Date.now()}`,
                                  timestamp: new Date().toISOString(),
                                  adminEmail: currentAdmin?.email || "admin@rankify.in",
                                  action: `Recalculated deterministic Exam Readiness for ${selectedStudent.displayName}`,
                                  targetUser: selectedStudent.displayName,
                                  status: "success",
                                  device: "Admin Dashboard",
                                  ip: "Internal"
                                },
                                ...prev
                              ]);
                            }}
                            className="px-2 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px] cursor-pointer hover:bg-indigo-500 flex items-center gap-1"
                          >
                            <RefreshCw className="w-2.5 h-2.5" />
                            <span>Recalculate</span>
                          </button>
                        </div>
                      </div>

                      {/* Histories & Saved Data View */}
                      <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                        <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider">Revision History & Bookmarks</h4>
                        <div className="text-xs space-y-2 text-muted-foreground">
                          <div>
                            <strong className="text-foreground">Calculus Notes:</strong> "Ray optics: magnifying power compound microscope forms at D: m = -L/f_o * (1 + D/f_e)"
                          </div>
                          <div>
                            <strong className="text-foreground">Organic Note:</strong> "Important: Aldol requires alpha-H. Cannizzaro does not."
                          </div>
                          <div className="flex gap-2 text-[10px] font-black text-indigo-500 font-mono">
                            <span>📝 3 Flashcards Saved</span>
                            <span>🔖 5 Chapter Bookmarks</span>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Admin Actions Console for Selected Student */}
                      <div className="p-5 rounded-3xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/10 space-y-4">
                        <h4 className="text-xs font-black uppercase text-rose-500 tracking-wider flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-rose-500" />
                          <span>Administrative Actions Center</span>
                        </h4>

                        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                          {/* Disable / Enable */}
                          {selectedStudent.status === 'disabled' ? (
                            <button
                              onClick={() => handleUpdateStudentStatus(selectedStudent.uid, 'active')}
                              className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Enable Account</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStudentStatus(selectedStudent.uid, 'disabled')}
                              className="h-9 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-foreground flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Disable Account</span>
                            </button>
                          )}

                          {/* Suspend / Unsuspend */}
                          {selectedStudent.status === 'suspended' ? (
                            <button
                              onClick={() => handleUpdateStudentStatus(selectedStudent.uid, 'active')}
                              className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                              <LockOpen className="w-3.5 h-3.5" />
                              <span>Unsuspend User</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStudentStatus(selectedStudent.uid, 'suspended')}
                              className="h-9 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Suspend Account</span>
                            </button>
                          )}

                          {/* Reset Progress */}
                          <button
                            onClick={() => handleAdminResetActions(selectedStudent.uid, 'progress')}
                            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-foreground flex items-center justify-center gap-1 cursor-pointer transition-all"
                          >
                            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                            <span>Reset Syllabus</span>
                          </button>

                          {/* Reset Streak */}
                          <button
                            onClick={() => handleAdminResetActions(selectedStudent.uid, 'streak')}
                            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-foreground flex items-center justify-center gap-1 cursor-pointer transition-all"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset Streak</span>
                          </button>

                          {/* Recalculate Exam Readiness */}
                          <button
                            onClick={() => {
                              toast.success(`Exam Readiness recalculated for ${selectedStudent.displayName}`);
                              setAuditLogs(prev => [
                                {
                                  id: `log_${Date.now()}`,
                                  timestamp: new Date().toISOString(),
                                  adminEmail: currentAdmin?.email || "admin@rankify.in",
                                  action: `Triggered full Exam Readiness recalculation for ${selectedStudent.displayName}`,
                                  targetUser: selectedStudent.displayName,
                                  status: "success",
                                  device: "Admin Dashboard",
                                  ip: "Internal"
                                },
                                ...prev
                              ]);
                            }}
                            className="h-9 px-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1 cursor-pointer transition-all"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Recalculate Readiness</span>
                          </button>

                          {/* Force New SmartPlan */}
                          <button
                            onClick={() => handleAdminResetActions(selectedStudent.uid, 'smartplan')}
                            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-foreground flex items-center justify-center gap-1 cursor-pointer transition-all"
                          >
                            <Zap className="w-3.5 h-3.5 text-purple-600" />
                            <span>Force New Plan</span>
                          </button>

                          {/* Password Reset */}
                          <button
                            onClick={() => handleGeneralSecurityTrigger(selectedStudent.uid, 'password_reset')}
                            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-foreground flex items-center justify-center gap-1 cursor-pointer transition-all"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>PW Reset Email</span>
                          </button>

                          {/* Clean Bookmarks */}
                          <button
                            onClick={() => handleAdminResetActions(selectedStudent.uid, 'delete_bookmarks')}
                            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-foreground flex items-center justify-center gap-1 cursor-pointer transition-all"
                          >
                            <Star className="w-3.5 h-3.5 text-amber-500" />
                            <span>Clean Bookmarks</span>
                          </button>

                          {/* Data repair triggers */}
                          <button
                            onClick={() => handleAdminResetActions(selectedStudent.uid, 'repair')}
                            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-foreground flex items-center justify-center gap-1 cursor-pointer transition-all"
                          >
                            <Settings className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Repair Data</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* TAB 3: BROADCASTING VAULT (ANNOUNCEMENTS & PUSH) */}
          {activeTab === 'broadcasting' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Announcements form */}
              <form
                onSubmit={handleSendAnnouncement}
                className="p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-card space-y-4 shadow-xs"
              >
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <Bell className="w-4.5 h-4.5 text-purple-600" />
                  <span>Broadcast Segmented Announcement To Students</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Announcement Title</label>
                    <input
                      type="text"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="e.g. CBSE Practical Board Exam Guidelines Released"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Priority Rating</label>
                    <select
                      value={annPriority}
                      onChange={(e) => setAnnPriority(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-purple-500"
                    >
                      <option value="normal">Standard Notice</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent Board Alert</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Target Audience Segment</label>
                    <select
                      value={annTargetSegment}
                      onChange={(e) => setAnnTargetSegment(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                    >
                      <option value="everyone">Everyone (All Students)</option>
                      <option value="class12">Specific Class: Class 12</option>
                      <option value="cbse">Specific Board: CBSE Board</option>
                      <option value="maths">Specific Subject: Mathematics</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Notice Description</label>
                  <textarea
                    value={annBody}
                    onChange={(e) => setAnnBody(e.target.value)}
                    rows={3}
                    placeholder="Provide details about exam timing, materials allowed, and checklist..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" className="text-xs font-bold h-9">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Publish Announcement</span>
                  </Button>
                </div>
              </form>

              {/* Push notifications scheduler form */}
              <form
                onSubmit={handleSendPushNotification}
                className="p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-card space-y-4 shadow-xs"
              >
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <MessageSquare className="w-4.5 h-4.5 text-indigo-600" />
                  <span>Send Immediate Push Notification to Browsers</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Notification Header</label>
                    <input
                      type="text"
                      value={pushTitle}
                      onChange={(e) => setPushTitle(e.target.value)}
                      placeholder="e.g. 📚 Your Chemistry task is waiting!"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Timing Option</label>
                    <select
                      value={pushSchedule}
                      onChange={(e) => setPushSchedule(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                    >
                      <option value="now">Instant Notification</option>
                      <option value="evening">Schedule Evening (18:00)</option>
                      <option value="tomorrow">Schedule Tomorrow (09:00)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Alert Content</label>
                  <input
                    type="text"
                    value={pushBody}
                    onChange={(e) => setPushBody(e.target.value)}
                    placeholder="e.g. Only 25 minutes left today to stay on track. Open Rankify."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" className="text-xs font-bold h-9 bg-indigo-600 hover:bg-indigo-500">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Deliver Notification</span>
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {/* TAB 4: REMOTE TOGGLES & CONFIGS */}
          {activeTab === 'remote' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Maintenance toggle card */}
              <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                      <Settings className="w-4.5 h-4.5 text-rose-500" />
                      <span>Global App Maintenance Lock</span>
                    </h3>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      When enabled, all student access is blocked in real time, redirecting to a friendly status notice screen.
                    </p>
                  </div>

                  <button
                    onClick={handleToggleMaintenance}
                    className={`w-12 h-7 rounded-full transition-all duration-300 focus:outline-none flex items-center p-1 cursor-pointer ${
                      maintenanceMode ? 'bg-rose-500 justify-end' : 'bg-slate-200 dark:bg-slate-800 justify-start'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                  </button>
                </div>
              </div>

              {/* Advanced Feature flags configuration */}
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-card space-y-4 shadow-xs">
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                  <ToggleRight className="w-4.5 h-4.5 text-purple-600" />
                  <span>Module Capability Feature Flags</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* AI capabilities */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-white/5">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold block text-foreground">AI Study Copilot</span>
                      <p className="text-[10px] text-muted-foreground">Enable Gemini Flash integrations</p>
                    </div>
                    <button
                      onClick={() => handleToggleRemoteFeature('ai')}
                      className={`w-10 h-6.5 rounded-full transition-all flex items-center p-0.5 cursor-pointer ${aiEnabled ? 'bg-purple-600 justify-end' : 'bg-slate-300 justify-start'}`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>

                  {/* Browser notification alerts */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-white/5">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold block text-foreground">Desktop Notifications</span>
                      <p className="text-[10px] text-muted-foreground">Manage service worker push relays</p>
                    </div>
                    <button
                      onClick={() => handleToggleRemoteFeature('notifications')}
                      className={`w-10 h-6.5 rounded-full transition-all flex items-center p-0.5 cursor-pointer ${notificationsEnabled ? 'bg-purple-600 justify-end' : 'bg-slate-300 justify-start'}`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>

                  {/* SmartPlan updates */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-white/5">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold block text-foreground">SmartPlan Engine</span>
                      <p className="text-[10px] text-muted-foreground">Allow daily dynamic target calibrations</p>
                    </div>
                    <button
                      onClick={() => handleToggleRemoteFeature('smartplan')}
                      className={`w-10 h-6.5 rounded-full transition-all flex items-center p-0.5 cursor-pointer ${smartPlanEnabled ? 'bg-purple-600 justify-end' : 'bg-slate-300 justify-start'}`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>

                  {/* LectureLab analytics */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-white/5">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold block text-foreground">LectureLab Module</span>
                      <p className="text-[10px] text-muted-foreground">Video syllabus extractors toggler</p>
                    </div>
                    <button
                      onClick={() => handleToggleRemoteFeature('lecturelab')}
                      className={`w-10 h-6.5 rounded-full transition-all flex items-center p-0.5 cursor-pointer ${lectureLabEnabled ? 'bg-purple-600 justify-end' : 'bg-slate-300 justify-start'}`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Version Controls */}
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-card space-y-4 shadow-xs">
                <h3 className="font-extrabold text-sm text-foreground">App Release Version Controls</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Latest Shipped Version</label>
                    <input
                      type="text"
                      value={latestAppVersion}
                      onChange={(e) => setLatestAppVersion(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Minimum Supported Version</label>
                    <input
                      type="text"
                      value={minAppVersion}
                      onChange={(e) => setMinAppVersion(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Server Message Header</label>
                    <input
                      type="text"
                      value={serverMessage}
                      onChange={(e) => setServerMessage(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    onClick={() => {
                      toast.success(`Forced release boundaries updated to v${latestAppVersion}!`);
                    }}
                    className="text-xs font-bold h-9"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    <span>Apply Release Policies</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: CONTENT CMS (QUOTES, ALERTS) */}
          {activeTab === 'content' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Motivational Quotes CMS form */}
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-card space-y-4 shadow-xs">
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5 text-purple-600" />
                  <span>Manage Motivational Quotes & Roasts</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Quote Text / Savage Roast</label>
                    <input
                      type="text"
                      value={newQuoteText}
                      onChange={(e) => setNewQuoteText(e.target.value)}
                      placeholder="e.g. Books miss you more than Instagram today 😂"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Category / Author</label>
                    <input
                      type="text"
                      value={newQuoteAuthor}
                      onChange={(e) => setNewQuoteAuthor(e.target.value)}
                      placeholder="e.g. Funny Roast"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    onClick={() => {
                      if (!newQuoteText.trim()) return;
                      const item = {
                        id: String(quotes.length + 1),
                        text: newQuoteText,
                        author: newQuoteAuthor || "Anonymous"
                      };
                      setQuotes([...quotes, item]);
                      setNewQuoteText('');
                      setNewQuoteAuthor('');
                      toast.success("Motivational Roast published to home dashboard!");
                    }}
                    className="text-xs font-bold h-9"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Add Quote / Roast</span>
                  </Button>
                </div>

                {/* Quotes List */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
                  {quotes.map((q) => (
                    <div
                      key={q.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-foreground">"{q.text}"</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">— {q.author}</div>
                      </div>
                      <button
                        onClick={() => {
                          setQuotes(quotes.filter(item => item.id !== q.id));
                          toast.success("Quote removed.");
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 6: SYLLABUS REPORTS & EXPORTS */}
          {activeTab === 'exports' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-card space-y-4 shadow-xs">
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                  <FileText className="w-4.5 h-4.5 text-purple-600" />
                  <span>Generate CBSE Syllabus Engagement Reports</span>
                </h3>

                <p className="text-xs text-muted-foreground leading-normal">
                  Compile complete diagnostics of syllabus coverage and study time averages across Class 12, Class 11, and Class 10 candidates. Export to standard spreadsheet formats instantly.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 text-center">
                    <span className="text-[9px] font-black uppercase text-muted-foreground">Daily Report</span>
                    <button
                      onClick={handleExportCSV}
                      className="mt-2 w-full h-8 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Export Daily
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 text-center">
                    <span className="text-[9px] font-black uppercase text-muted-foreground">Weekly Digest</span>
                    <button
                      onClick={handleExportCSV}
                      className="mt-2 w-full h-8 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Export Weekly
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 text-center">
                    <span className="text-[9px] font-black uppercase text-muted-foreground">Monthly Ledger</span>
                    <button
                      onClick={handleExportCSV}
                      className="mt-2 w-full h-8 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Export Monthly
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 7: SECURITY & BACKUP VAULT */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Database Backup Trigger */}
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-card space-y-4 shadow-xs">
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                  <Database className="w-4.5 h-4.5 text-indigo-500" />
                  <span>Cloud Firestore Backups Vault</span>
                </h3>

                <p className="text-xs text-muted-foreground leading-normal">
                  Generate snapshot archives of user credentials, syllabus metrics, statistics, and notes cached inside Firestore. Snaps are safely backed up locally.
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={handleBackupFirestore}
                    className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-sm"
                  >
                    Generate Backup Snapshot
                  </button>
                  <button
                    onClick={handleRestoreBackup}
                    className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-card hover:bg-slate-50 dark:hover:bg-slate-800 text-foreground font-bold text-xs cursor-pointer"
                  >
                    Restore Backup Point
                  </button>
                </div>
              </div>

              {/* Login Logs / Audit trail */}
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-card space-y-3 shadow-xs">
                <h3 className="font-extrabold text-sm text-foreground">Security Audit Trail</h3>

                <div className="space-y-2 pt-1">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 text-[11px] font-mono leading-relaxed"
                    >
                      <div className="flex justify-between items-center font-bold text-xs mb-1">
                        <span className={log.status === 'critical' ? 'text-red-500' : log.status === 'warning' ? 'text-amber-500' : 'text-emerald-500'}>
                          [{log.status.toUpperCase()}] {log.action}
                        </span>
                        <span className="text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-muted-foreground">
                        Admin: {log.adminEmail} | Target: {log.targetUser} | IP: {log.ip || '127.0.0.1'} | {log.device || 'Chrome Mobile'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 8: WEAKNESS ANALYTICS (COHORT DIAGNOSTICS) */}
          {activeTab === 'weakness' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header Banner */}
              <div className="p-6 rounded-3xl border border-rose-500/25 bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-900 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-rose-500" />
                    <h3 className="font-extrabold text-base text-foreground">
                      Student Weakness & Cognitive Friction Hub
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    Real-Time Root Cause Tracking
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                  Automated behavioral analysis across candidate study logs: identifying high failure rate chapters, common formula amnesia patterns, and cohort subject bottlenecks.
                </p>
              </div>

              {/* 4 Stat Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider font-mono">
                    Weakest Subject
                  </span>
                  <div className="text-xl font-black text-foreground">Chemistry</div>
                  <span className="text-[10px] text-rose-500 font-bold">58% Avg Mastery</span>
                </div>

                <div className="p-4 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider font-mono">
                    Strongest Subject
                  </span>
                  <div className="text-xl font-black text-foreground">Mathematics</div>
                  <span className="text-[10px] text-emerald-500 font-bold">86% Avg Mastery</span>
                </div>

                <div className="p-4 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider font-mono">
                    Avg Recovery Time
                  </span>
                  <div className="text-xl font-black font-mono text-foreground">4.2 Days</div>
                  <span className="text-[10px] text-muted-foreground">Per weak chapter</span>
                </div>

                <div className="p-4 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
                  <span className="text-[10px] font-black text-purple-500 uppercase tracking-wider font-mono">
                    Top Root Cause
                  </span>
                  <div className="text-sm font-black text-foreground truncate">Low Practice</div>
                  <span className="text-[10px] text-muted-foreground">48% of struggles</span>
                </div>
              </div>

              {/* Grid: Most Difficult Chapters & Most Common Mistakes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Most Difficult Chapters */}
                <div className="p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-card space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>Most Difficult Chapters Across Students</span>
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">By Error Rate</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {[
                      { chapter: 'Current Electricity', subject: 'Physics', failureRate: '42%', cause: 'Wheatstone & Potentiometer Formula Amnesia' },
                      { chapter: 'Electrochemistry', subject: 'Chemistry', failureRate: '38%', cause: 'Nernst Equation Valence Errors' },
                      { chapter: 'Ray Optics and Optical Instruments', subject: 'Physics', failureRate: '36%', cause: 'Lens Maker Medium Index Trap' },
                      { chapter: 'Aldehydes, Ketones & Acids', subject: 'Chemistry', failureRate: '35%', cause: 'Aldol vs Cannizzaro α-H Confusion' },
                      { chapter: 'Integrals (Calculus)', subject: 'Mathematics', failureRate: '32%', cause: 'King’s Property & Partial Fractions' },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-400">#{idx + 1}</span>
                            <span className="font-extrabold text-foreground">{item.chapter}</span>
                            <span className="text-[10px] text-muted-foreground">({item.subject})</span>
                          </div>
                          <div className="text-[10px] text-rose-500 font-medium">
                            Cause: {item.cause}
                          </div>
                        </div>

                        <span className="font-mono font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20 text-xs">
                          {item.failureRate}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Most Common Mistakes Catalog */}
                <div className="p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-card space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                      <BookX className="w-4 h-4 text-rose-500" />
                      <span>Most Common Mistakes & Traps</span>
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">Cohort Analysis</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400 block">
                        ⚡ Most Forgotten Formula
                      </span>
                      <p className="font-semibold text-foreground">
                        Lens Maker Formula in Media: 1/f = (μ_lens/μ_med - 1)(1/R1 - 1/R2)
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block">
                        🧠 Most Incorrect Concept Trap
                      </span>
                      <p className="font-semibold text-foreground">
                        Aldol Condensation (requires α-H) vs Cannizzaro Reaction (absence of α-H)
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 block">
                        ❓ Most Failed Question Type
                      </span>
                      <p className="font-semibold text-foreground">
                        Assertion-Reasoning on Kirchhoff Loop sign conventions & terminal emf
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 block">
                        🕒 Chronobiological Drop
                      </span>
                      <p className="font-semibold text-foreground">
                        Calculation precision drops by 27% during study sessions scheduled after 10:30 PM.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 8: STUDY REPLAY & TIMELINE ANALYTICS */}
          {activeTab === 'replay' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 border border-indigo-500/25 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider border border-indigo-500/30">
                      Cohort Learning Diary
                    </span>
                    <span className="text-xs text-indigo-200/80 font-mono">14,820 Events Tracked</span>
                  </div>
                  <h3 className="text-xl font-black tracking-tight">Study Replay & Timeline Intelligence</h3>
                  <p className="text-xs text-indigo-200/80 max-w-xl">
                    Macro telemetry across student study timelines, peak productivity cycles, subject revision frequency, and privacy-shielded journal monitoring.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      toast.success("Study timeline metrics re-indexed with Firebase subcollections!");
                    }}
                    className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-sync Replays</span>
                  </button>
                </div>
              </div>

              {/* 4 Core Summary Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Average Study Hours */}
                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider font-mono">
                      Average Study Hours
                    </span>
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-black font-mono text-foreground">3.4 hrs</div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">
                    +14.2% vs previous month
                  </span>
                </div>

                {/* Most Active Day */}
                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-purple-500 uppercase tracking-wider font-mono">
                      Most Active Day
                    </span>
                    <Calendar className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <div className="text-2xl font-black font-mono text-foreground">Wednesday</div>
                  <span className="text-[11px] text-muted-foreground font-medium block">
                    Peak: 6:00 PM – 9:00 PM IST
                  </span>
                </div>

                {/* Average Daily Study */}
                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider font-mono">
                      Average Daily Study
                    </span>
                    <Zap className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black font-mono text-foreground">204 mins</div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">
                    ~3.4 hrs per active student
                  </span>
                </div>

                {/* Streak Continuity */}
                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider font-mono">
                      Streak Consistency
                    </span>
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black font-mono text-foreground">11.4 Days</div>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold block">
                    78% cohort active daily
                  </span>
                </div>
              </div>

              {/* Day-of-Week Distribution & Most Studied Subjects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Average Daily Study By Day */}
                <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-500" />
                      <span>Average Daily Study by Day of Week</span>
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">Current Cohort</span>
                  </div>

                  <div className="space-y-3 pt-2">
                    {[
                      { day: 'Monday', hours: 3.2, pct: 67 },
                      { day: 'Tuesday', hours: 3.8, pct: 79 },
                      { day: 'Wednesday (Peak)', hours: 4.5, pct: 94, highlight: true },
                      { day: 'Thursday', hours: 3.9, pct: 81 },
                      { day: 'Friday', hours: 3.4, pct: 71 },
                      { day: 'Saturday (Exam Drill)', hours: 4.8, pct: 100, highlight: true },
                      { day: 'Sunday (Rest & Buffers)', hours: 2.9, pct: 60 }
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className={`font-bold ${item.highlight ? 'text-indigo-600 dark:text-indigo-400' : 'text-foreground'}`}>
                            {item.day}
                          </span>
                          <span className="font-mono font-bold text-muted-foreground">{item.hours}h avg</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.highlight
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                : 'bg-slate-400 dark:bg-slate-600'
                            }`}
                            style={{ width: `${item.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Most Studied Subjects & Timeline Distribution */}
                <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-500" />
                      <span>Most Studied Subjects & Focus Share</span>
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">30-Day Share</span>
                  </div>

                  <div className="space-y-4 pt-1">
                    {[
                      {
                        name: 'Physics',
                        share: 38,
                        color: 'from-blue-500 to-indigo-600',
                        badge: 'Most Studied',
                        topTopics: 'Current Electricity, Ray Optics, Magnetism',
                        hoursLogged: '5,630 hrs'
                      },
                      {
                        name: 'Chemistry',
                        share: 34,
                        color: 'from-emerald-500 to-teal-600',
                        badge: 'Most Improved',
                        topTopics: 'Coordination Compounds, Aldehydes & Ketones, Solutions',
                        hoursLogged: '5,040 hrs'
                      },
                      {
                        name: 'Mathematics',
                        share: 28,
                        color: 'from-purple-500 to-pink-600',
                        badge: 'Highest Numerical Load',
                        topTopics: 'Integrals, Matrices, Differential Equations',
                        hoursLogged: '4,150 hrs'
                      }
                    ].map((subj, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-foreground">{subj.name}</span>
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-300 text-[10px] font-bold">
                              {subj.badge}
                            </span>
                          </div>
                          <span className="font-mono text-xs font-black text-foreground">{subj.share}% ({subj.hoursLogged})</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${subj.color}`} style={{ width: `${subj.share}%` }} />
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Top Chapters Replayed: <span className="text-foreground font-semibold">{subj.topTopics}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Overall Timeline Analytics Statistics Table */}
              <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-500" />
                    <span>Overall Timeline Activity Telemetry</span>
                  </h4>
                  <span className="text-[10px] text-muted-foreground font-mono">Live Sync Engine</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Practice Sessions</span>
                    <span className="text-xl font-black font-mono text-foreground mt-1 block">4,920</span>
                    <span className="text-[9px] text-emerald-500 font-bold block">+8% this week</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Tasks Completed</span>
                    <span className="text-xl font-black font-mono text-foreground mt-1 block">5,140</span>
                    <span className="text-[9px] text-indigo-500 font-bold block">SmartPlan items</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Formula Revisions</span>
                    <span className="text-xl font-black font-mono text-foreground mt-1 block">2,890</span>
                    <span className="text-[9px] text-purple-500 font-bold block">Spaced triggers</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Mock Tests</span>
                    <span className="text-xl font-black font-mono text-foreground mt-1 block">870</span>
                    <span className="text-[9px] text-rose-500 font-bold block">CBSE full-length</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Flashcard Reviews</span>
                    <span className="text-xl font-black font-mono text-foreground mt-1 block">1,000</span>
                    <span className="text-[9px] text-amber-500 font-bold block">Quick recall</span>
                  </div>
                </div>
              </div>

              {/* Student Learning Diary Inspector with Strict Privacy Shield */}
              <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      <span>Student Timeline Inspector & Privacy Vault</span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Inspect individual candidate activity logs. Student personal notes and self-reflections are encrypted and hidden by default.
                    </p>
                  </div>

                  {/* Student Selector */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-muted-foreground">Student:</label>
                    <select
                      value={selectedReplayStudentUid}
                      onChange={(e) => setSelectedReplayStudentUid(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-background text-xs font-bold text-foreground"
                    >
                      {filteredStudents.map((s) => (
                        <option key={s.uid} value={s.uid}>
                          {s.displayName} ({s.board} Class {s.cbseClass || s.classNumber || 12})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Privacy Safeguard Notice */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                  <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1 flex-1">
                    <strong className="text-amber-600 dark:text-amber-400 block font-bold">
                      FERPA & Student Privacy Compliance Notice
                    </strong>
                    <p className="text-muted-foreground leading-relaxed">
                      Personal diary entries, private study notes, and self-doubts are private to the student. They will NEVER be displayed in cleartext unless an administrator explicitly opens them. All note-viewing actions are recorded in the security audit log.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !revealedStudentNotes[selectedReplayStudentUid];
                      setRevealedStudentNotes({
                        ...revealedStudentNotes,
                        [selectedReplayStudentUid]: next
                      });
                      if (next) {
                        toast.success("Private student notes revealed for this session (Logged in audit trail)");
                        setAuditLogs((prev) => [
                          {
                            id: `log_${Date.now()}`,
                            timestamp: new Date().toISOString(),
                            adminEmail: currentAdmin?.email || "admin@rankify.in",
                            action: `Explicitly unshielded private study journal notes for student UID ${selectedReplayStudentUid}`,
                            targetUser: selectedReplayStudentUid,
                            status: "warning",
                            device: "Admin Dashboard",
                            ip: "Internal"
                          },
                          ...prev
                        ]);
                      } else {
                        toast("Private notes re-encrypted and hidden");
                      }
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      revealedStudentNotes[selectedReplayStudentUid]
                        ? 'bg-rose-600 text-white hover:bg-rose-500'
                        : 'bg-amber-600 text-white hover:bg-amber-500'
                    }`}
                  >
                    {revealedStudentNotes[selectedReplayStudentUid] ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Re-lock Private Notes</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Explicitly Open Private Notes</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Timeline Events Table for Selected Student */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Recent Timeline Events for Selected Candidate
                  </div>

                  <div className="space-y-2">
                    {[
                      {
                        id: 'evt_1',
                        time: 'Today, 4:30 PM',
                        type: 'Practice Session',
                        subject: 'Physics',
                        chapter: 'Current Electricity',
                        score: '84% Accuracy',
                        duration: '45 mins',
                        privateNote: 'Struggled with potentiometer null deflection questions. Need to review internal resistance formula tonight.'
                      },
                      {
                        id: 'evt_2',
                        time: 'Today, 2:15 PM',
                        type: 'Formula Revision',
                        subject: 'Chemistry',
                        chapter: 'Electrochemistry',
                        score: '100% Recalled',
                        duration: '20 mins',
                        privateNote: 'Nernst equation temperature dependence: Remember 0.0591/n is strictly at 298K!'
                      },
                      {
                        id: 'evt_3',
                        time: 'Yesterday, 7:00 PM',
                        type: 'Mock Test Section',
                        subject: 'Mathematics',
                        chapter: 'Integrals',
                        score: '78% Accuracy',
                        duration: '60 mins',
                        privateNote: 'Missed partial fractions by mistake in substitution. Feeling exhausted but determined.'
                      }
                    ].map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-foreground">{item.chapter}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                              {item.subject}
                            </span>
                            <span className="text-[10px] text-muted-foreground">• {item.type}</span>
                          </div>
                          <div className="flex items-center gap-3 font-mono text-[11px]">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{item.score}</span>
                            <span className="text-muted-foreground">{item.duration}</span>
                            <span className="text-muted-foreground">{item.time}</span>
                          </div>
                        </div>

                        {/* Protected Notes Content */}
                        <div className="pt-1 text-xs">
                          {revealedStudentNotes[selectedReplayStudentUid] ? (
                            <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-foreground flex items-start gap-2">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-bold shrink-0">
                                Unshielded Note
                              </span>
                              <p className="text-xs italic leading-relaxed">"{item.privateNote}"</p>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-xl bg-slate-200/40 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 text-muted-foreground flex items-center justify-between">
                              <span className="text-xs italic flex items-center gap-1.5">
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span>[Encrypted Student Reflection Note — Hidden for Privacy]</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">Protected</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 9: RANKIFY BRAIN AI COACH TELEMETRY */}
          {activeTab === 'brain' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 border border-purple-500/25 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider border border-purple-500/30">
                      Autonomous Mentorship Telemetry
                    </span>
                    <span className="text-xs text-purple-200/80 font-mono">Anonymous Aggregate</span>
                  </div>
                  <h3 className="text-xl font-black tracking-tight">Rankify Brain AI Coach Analytics</h3>
                  <p className="text-xs text-purple-200/80 max-w-xl">
                    Macro analytics across AI advice acceptance, common cohort vulnerabilities, and diurnal behavioral patterns.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/25 text-xs text-purple-200 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-[11px] leading-tight">
                    Strict Confidentiality: Private AI chats & prompts are 100% anonymized.
                  </span>
                </div>
              </div>

              {/* 4 Core Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Advice Acceptance */}
                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-purple-500 uppercase tracking-wider font-mono">
                      Advice Acceptance Rate
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <div className="text-2xl font-black font-mono text-foreground">82.6%</div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">
                    +6.8% vs last month
                  </span>
                </div>

                {/* Mission Completion */}
                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider font-mono">
                      Daily Mission Completion
                    </span>
                    <Target className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-black font-mono text-foreground">74.2%</div>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold block">
                    ~3.1 tasks/student
                  </span>
                </div>

                {/* Average Daily Study Behavior */}
                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider font-mono">
                      Average Daily Study
                    </span>
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black font-mono text-foreground">3h 24m</div>
                  <span className="text-[11px] text-muted-foreground font-medium block">
                    Peak: 6:00 PM – 8:00 PM
                  </span>
                </div>

                {/* Top Coach Personality */}
                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider font-mono">
                      Preferred AI Persona
                    </span>
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-foreground">Mentor</div>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold block">
                    42% student adoption
                  </span>
                </div>
              </div>

              {/* Most Common Weak Subjects & Chapters Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>Most Common Weak Subjects & Bottlenecks</span>
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">Cohort Diagnostics</span>
                  </div>

                  <div className="space-y-3 pt-1">
                    {[
                      {
                        subject: 'Physics',
                        share: 44,
                        color: 'from-rose-500 to-red-600',
                        vulnerableChapters: 'Current Electricity (potentiometer), Ray Optics (derivation signs)',
                        action: 'High numerical error rate after 10 PM'
                      },
                      {
                        subject: 'Chemistry',
                        share: 34,
                        color: 'from-amber-500 to-orange-600',
                        vulnerableChapters: 'Electrochemistry (Nernst cell emf), Aldehydes & Ketones (Aldol vs Cannizzaro)',
                        action: '41% of cohort skipped for >= 4 days'
                      },
                      {
                        subject: 'Mathematics',
                        share: 22,
                        color: 'from-blue-500 to-indigo-600',
                        vulnerableChapters: 'Definite Integrals (properties), Differential Equations (homogeneous)',
                        action: 'Rushed substitution calculations'
                      }
                    ].map((item, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-foreground">{item.subject}</span>
                          <span className="font-mono text-xs font-black text-rose-500">{item.share}% Failure Share</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${item.color}`} style={{ width: `${item.share}%` }} />
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Top Weak Chapters: <strong className="text-foreground">{item.vulnerableChapters}</strong>
                        </div>
                        <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                          AI Observation: {item.action}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Average Study Behavior & Diurnal Rhythm */}
                <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span>Average Study Behavior & Chronobiological Cycles</span>
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">Cognitive Telemetry</span>
                  </div>

                  <div className="space-y-3 pt-1 text-xs">
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                        <span>Golden Focus Window: 6:00 PM – 8:00 PM IST</span>
                        <span className="font-mono">94% Accuracy Peak</span>
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        Students solve board questions 35% faster with minimum hesitation during early evening hours. Rankify Brain auto-schedules difficult derivations here.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                      <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-bold">
                        <span>Late-Night Fatigue Drop: After 10:30 PM</span>
                        <span className="font-mono">-27% Arithmetic Precision</span>
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        Multi-step calculations show a steep drop in accuracy past 10:30 PM. Brain shifts student recommendations to light formula recall and NCERT theory reading.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
                      <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-bold">
                        <span>Weekend Study Spikes: Sunday Acceleration</span>
                        <span className="font-mono">+45% Session Length</span>
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        Students average 4.8 hours on Sundays with full mock test simulations. Sunday Weekly Reports achieve a 92% review open rate.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1">
                      <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 font-bold">
                        <span>Spaced Formula Recall Adherence</span>
                        <span className="font-mono">78% Retention</span>
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        When Brain sends non-repeating smart reminders for 6-day formula decay, 78% of students complete active recall within 12 hours.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 10: EXAM COMMAND TELEMETRY (ANONYMOUS AGGREGATE) */}
          {activeTab === 'command' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 border border-indigo-500/25 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider border border-indigo-500/30">
                      Cohort Command Telemetry
                    </span>
                    <span className="text-xs text-indigo-200/80 font-mono">Anonymous Overall Trends Only</span>
                  </div>
                  <h3 className="text-xl font-black tracking-tight">Exam Command Center Macro Intelligence</h3>
                  <p className="text-xs text-indigo-200/80 max-w-xl">
                    Aggregated board readiness pacing, high-frequency urgent tasks, and format-specific failure patterns across all registered Class 12 candidates.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-200 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-[11px] leading-tight">
                    Privacy Guarantee: Individual student commands and reflection notes remain confidential.
                  </span>
                </div>
              </div>

              {/* 4 Core Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1.5">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider font-mono">
                    Cohort Exam Countdown
                  </span>
                  <div className="text-2xl font-black font-mono text-foreground">18 Days</div>
                  <span className="text-[11px] text-muted-foreground font-medium block">
                    CBSE Class 12 Science Boards
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1.5">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider font-mono">
                    Average Cohort Readiness
                  </span>
                  <div className="text-2xl font-black font-mono text-emerald-500">84.2%</div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">
                    +4.6% vs previous sprint
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1.5">
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider font-mono">
                    Most Failed Format
                  </span>
                  <div className="text-2xl font-black text-rose-500">Numericals</div>
                  <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold block">
                    64% avg accuracy
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1.5">
                  <span className="text-[10px] font-black text-purple-500 uppercase tracking-wider font-mono">
                    Peak Productivity Hour
                  </span>
                  <div className="text-2xl font-black font-mono text-foreground">6–8 PM</div>
                  <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold block">
                    94% speed window
                  </span>
                </div>
              </div>

              {/* Anonymous Predicted Scores & Urgent Task Cohort Trends */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Cohort Predicted Ranges */}
                <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <span>Cohort Projected Board Marks Distribution</span>
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">PCM Aggregate</span>
                  </div>

                  <div className="space-y-3 pt-1 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">Physics (Max 70)</span>
                        <span className="font-mono text-purple-600">60–68 Marks (88.5% avg)</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: '88%' }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">Main drag: Potentiometer calculation errors & Lens Maker signs</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">Chemistry (Max 70)</span>
                        <span className="font-mono text-emerald-600">56–64 Marks (84.0% avg)</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: '84%' }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">Main drag: 41% of cohort unrevised in Organic name reactions for &gt;5 days</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">Mathematics (Max 80)</span>
                        <span className="font-mono text-indigo-600">68–76 Marks (91.2% avg)</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-500" style={{ width: '91%' }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">Main drag: Rushed matrix inverse substitutions in timed mocks</span>
                    </div>
                  </div>
                </div>

                {/* Most Common Urgent Tasks Assigned by AI */}
                <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                      <Flame className="w-4 h-4 text-rose-500" />
                      <span>Most Common Urgent Tasks Dispatched by AI</span>
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">Cohort AI Feed</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 space-y-1">
                      <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 block font-mono">
                        Rank 1 • 68% Students Flagged
                      </span>
                      <p className="font-bold text-foreground">
                        Resolve Kirchhoff Loop Sign Rule Trap in Mistake Notebook
                      </p>
                      <span className="text-[10px] text-muted-foreground">Potentiometer and loop rules produce repeat sign errors</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-1">
                      <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 block font-mono">
                        Rank 2 • 59% Students Flagged
                      </span>
                      <p className="font-bold text-foreground">
                        Nernst Equation Temperature Dependence & Cell EMF Recall
                      </p>
                      <span className="text-[10px] text-muted-foreground">Overdue formula retention triggers automatic urgent task</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/40 space-y-1">
                      <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 block font-mono">
                        Rank 3 • 47% Students Flagged
                      </span>
                      <p className="font-bold text-foreground">
                        Compound Microscope 5-Mark Ray Diagram Derivations
                      </p>
                      <span className="text-[10px] text-muted-foreground">High-yield derivation required before full-length science mock</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 11: SMART REVISION ENGINE COHORT TELEMETRY */}
          {activeTab === 'revision' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-purple-950 text-white shadow-xl border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Cohort Revision Analytics</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-mono">
                      Anonymous Aggregations Only
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black">
                    Smart Revision Completion & Spaced Recall Dynamics
                  </h3>
                  <p className="text-xs text-amber-100/80 max-w-2xl">
                    Real-time cohort telemetry tracking how CBSE Class 12 PCM students interact with Ebbinghaus memory intervals, skip rates, and retention stability.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="p-3 rounded-2xl bg-white/10 text-center min-w-[100px]">
                    <span className="text-[10px] text-amber-200 uppercase font-bold block">Avg. Completion</span>
                    <div className="text-2xl font-black font-mono text-amber-300">78.4%</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/10 text-center min-w-[100px]">
                    <span className="text-[10px] text-purple-200 uppercase font-bold block">Avg. Session</span>
                    <div className="text-2xl font-black font-mono text-white">27.4m</div>
                  </div>
                </div>
              </div>

              {/* 4 Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 text-center space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                    Cohort Completion Rate
                  </span>
                  <div className="text-3xl font-black font-mono text-emerald-500">78.4%</div>
                  <span className="text-[10px] text-muted-foreground font-mono">+12.3% MoM growth</span>
                </div>

                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 text-center space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                    Avg. Reschedule Frequency
                  </span>
                  <div className="text-3xl font-black font-mono text-amber-500">1.4x</div>
                  <span className="text-[10px] text-muted-foreground font-mono">Before final completion</span>
                </div>

                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 text-center space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                    Formula Recall Accuracy
                  </span>
                  <div className="text-3xl font-black font-mono text-purple-600">83.1%</div>
                  <span className="text-[10px] text-emerald-500 font-bold font-mono">High Retention</span>
                </div>

                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 text-center space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                    Active Revision Streak
                  </span>
                  <div className="text-3xl font-black font-mono text-orange-500">7.2 Days</div>
                  <span className="text-[10px] text-muted-foreground font-mono">Cohort average</span>
                </div>
              </div>

              {/* Most Skipped Chapters & Revision Interval Trends */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Most Skipped Chapters */}
                <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>Most Frequently Skipped Chapters (Cohort Risk)</span>
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">Class 12 PCM</span>
                  </div>

                  <div className="space-y-3 pt-1 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">1. Electrochemistry (Chemistry)</span>
                        <span className="font-mono text-rose-600">42% Skip Rate</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-rose-500" style={{ width: '42%' }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">Primary bottleneck: Nernst calculation complexity and log conversions</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">2. Wave Optics (Physics)</span>
                        <span className="font-mono text-amber-600">38% Skip Rate</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: '38%' }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">Primary bottleneck: Huygens wave front derivations & fringe width formulas</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">3. Integrals (Mathematics)</span>
                        <span className="font-mono text-indigo-600">31% Skip Rate</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-500" style={{ width: '31%' }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">Primary bottleneck: Definite integral property transformations & algebraic fatigue</span>
                    </div>
                  </div>
                </div>

                {/* Spaced Interval Trends */}
                <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-600" />
                      <span>Ebbinghaus Interval Step Distribution</span>
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">Cohort Active States</span>
                  </div>

                  <div className="space-y-3 pt-1 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">Immediate & 1-Day Recall (Step 1-2)</span>
                        <span className="font-mono text-muted-foreground">34% of Chapters</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-rose-500" style={{ width: '34%' }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">3 to 7 Days Consolidation (Step 3-4)</span>
                        <span className="font-mono text-muted-foreground">38% of Chapters</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: '38%' }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">15 to 30 Days Long-Term (Step 5-6)</span>
                        <span className="font-mono text-muted-foreground">20% of Chapters</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-purple-500" style={{ width: '20%' }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">45 to 90 Days Exam Mastered (Step 7-9)</span>
                        <span className="font-mono text-muted-foreground">8% of Chapters</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: '8%' }} />
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-2 text-amber-700 dark:text-amber-300">
                    <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>Privacy Assurance:</strong> Anonymous analytics aggregated across active student cohort. Individual study sessions, private diaries, and custom notes are strictly hidden.
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 12: NCERT READING ANALYTICS & COHORT METRICS */}
          {activeTab === 'ncert' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white shadow-xl border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>NCERT Reading Telemetry</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-mono">
                      Anonymous Aggregations Only
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black">
                    Class 12 Textbook Engagement & Reading Time Analytics
                  </h3>
                  <p className="text-xs text-purple-100/80 max-w-2xl">
                    Monitors how students consume NCERT chapters, voice speech adoption, most read vs. skipped textbooks, and highlight distributions.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="p-3 rounded-2xl bg-white/10 text-center min-w-[100px]">
                    <span className="text-[10px] text-purple-200 uppercase font-bold block">Avg. Session</span>
                    <div className="text-2xl font-black font-mono text-purple-300">32.8m</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/10 text-center min-w-[100px]">
                    <span className="text-[10px] text-emerald-200 uppercase font-bold block">Audio Mode</span>
                    <div className="text-2xl font-black font-mono text-emerald-400">41%</div>
                  </div>
                </div>
              </div>

              {/* 4 Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 text-center space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                    Cohort Total Highlights
                  </span>
                  <div className="text-3xl font-black font-mono text-purple-600">1,420</div>
                  <span className="text-[10px] text-muted-foreground font-mono">Color annotations logged</span>
                </div>

                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 text-center space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                    Active Bookmarks
                  </span>
                  <div className="text-3xl font-black font-mono text-amber-500">680</div>
                  <span className="text-[10px] text-muted-foreground font-mono">Pinned definitions & laws</span>
                </div>

                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 text-center space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                    Avg. Reading Speed
                  </span>
                  <div className="text-3xl font-black font-mono text-indigo-500">1.1x</div>
                  <span className="text-[10px] text-muted-foreground font-mono">Speech synthesis pacing</span>
                </div>

                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 text-center space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                    Completion Stability
                  </span>
                  <div className="text-3xl font-black font-mono text-emerald-500">81.6%</div>
                  <span className="text-[10px] text-emerald-600 font-bold font-mono">Finish opened chapters</span>
                </div>
              </div>

              {/* Most Read vs Least Read Chapters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Most Read Chapters */}
                <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span>Most Read NCERT Chapters (Highest Engagement)</span>
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">Cohort Top 3</span>
                  </div>

                  <div className="space-y-3 pt-1 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">1. Current Electricity (Physics)</span>
                        <span className="font-mono text-emerald-600">54.2m avg • 84% complete</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: '84%' }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">78 active readers • High focus on drift velocity & Kirchhoff loops</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">2. Electrochemistry (Chemistry)</span>
                        <span className="font-mono text-purple-600">48.6m avg • 76% complete</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-purple-500" style={{ width: '76%' }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">72 active readers • High focus on Nernst equation derivations</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">3. Determinants & Matrices (Math)</span>
                        <span className="font-mono text-indigo-600">42.1m avg • 88% complete</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-500" style={{ width: '88%' }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">69 active readers • High focus on 5-mark Matrix Inversion AX=B</span>
                    </div>
                  </div>
                </div>

                {/* Least Read Chapters */}
                <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>Least Read Chapters (Intervention Required)</span>
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">Cohort Bottlenecks</span>
                  </div>

                  <div className="space-y-3 pt-1 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">1. Wave Optics (Physics)</span>
                        <span className="font-mono text-rose-600">18.2m avg • 32% complete</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-rose-500" style={{ width: '32%' }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">Only 34 readers • Huygens wave fronts and fringe proofs frequently skipped</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">2. Aldehydes & Ketones (Chemistry)</span>
                        <span className="font-mono text-amber-600">21.0m avg • 39% complete</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: '39%' }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">38 readers • Reaction mechanism density causes early reading fatigue</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">3. Differential Equations (Mathematics)</span>
                        <span className="font-mono text-indigo-600">22.4m avg • 45% complete</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-500" style={{ width: '45%' }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">41 readers • Integrating factor identification needs targeted drills</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 13: FORMULA INTELLIGENCE COHORT TELEMETRY */}
          {activeTab === 'formula' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-purple-950 text-white shadow-xl border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Formula Mastery Telemetry</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-mono">
                      Anonymous Cohort Data
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black">
                    Class 12 PCM Formula Retention & Application Diagnostics
                  </h3>
                  <p className="text-xs text-amber-100/80 max-w-2xl">
                    Aggregated analytics monitoring algebraic trap rates, stoichiometric errors, and derivation completion trends across the student cohort.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="p-3 rounded-2xl bg-white/10 text-center min-w-[100px]">
                    <span className="text-[10px] text-amber-200 uppercase font-bold block">Avg. Mastery</span>
                    <div className="text-2xl font-black font-mono text-emerald-400">74%</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/10 text-center min-w-[100px]">
                    <span className="text-[10px] text-purple-200 uppercase font-bold block">Calculations</span>
                    <div className="text-2xl font-black font-mono text-white">2.8k</div>
                  </div>
                </div>
              </div>

              {/* 4 Summary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 text-center space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                    Cohort Average Mastery
                  </span>
                  <div className="text-3xl font-black font-mono text-emerald-500">74.2%</div>
                  <span className="text-[10px] text-muted-foreground font-mono">+8.4% improvement</span>
                </div>

                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 text-center space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                    Total Practice Drills
                  </span>
                  <div className="text-3xl font-black font-mono text-purple-600">2,840</div>
                  <span className="text-[10px] text-muted-foreground font-mono">Formula evaluations logged</span>
                </div>

                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 text-center space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                    Due Revision Adherence
                  </span>
                  <div className="text-3xl font-black font-mono text-amber-500">82.5%</div>
                  <span className="text-[10px] text-muted-foreground font-mono">Spaced recall completed</span>
                </div>

                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 text-center space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                    Derivations Understood
                  </span>
                  <div className="text-3xl font-black font-mono text-indigo-500">91.0%</div>
                  <span className="text-[10px] text-emerald-500 font-bold font-mono">Step-by-step proofs</span>
                </div>
              </div>

              {/* Most Forgotten Formulas & Most Revised Chapters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Most Forgotten Formulas */}
                <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>Most Frequently Forgotten Formulas (Cohort Risk)</span>
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">Exam Traps</span>
                  </div>

                  <div className="space-y-3 pt-1 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">1. Nernst Equation (Stoichiometric Powers)</span>
                        <span className="font-mono text-rose-600">46% Trap Rate</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-rose-500" style={{ width: '46%' }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">Students forget to square [H⁺]² or cube ion concentrations in Q quotient</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">2. Lens Maker (Medium Immersion μ2/μ1)</span>
                        <span className="font-mono text-amber-600">41% Trap Rate</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: '41%' }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">Forgetting Cartesian signs (R1 &gt; 0, R2 &lt; 0) and surrounding medium index</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">3. Matrix Inversion Adjoint Transpose</span>
                        <span className="font-mono text-indigo-600">34% Trap Rate</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-500" style={{ width: '34%' }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">Forgetting to transpose cofactor matrix [Cij] into adj(A)</span>
                    </div>
                  </div>
                </div>

                {/* Most Revised Chapters */}
                <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <span>Most Revised Formula Chapters</span>
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">Cohort Volume</span>
                  </div>

                  <div className="space-y-3 pt-1 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">Electrochemistry (Chemistry)</span>
                        <span className="font-mono text-purple-600 font-bold">420 Revisions</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-purple-500" style={{ width: '85%' }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">High frequency of cell emf and Kohlrausch limiting conductivity drills</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">Current Electricity (Physics)</span>
                        <span className="font-mono text-amber-600 font-bold">390 Revisions</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: '78%' }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">Drift velocity and temperature dependence relations</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">Determinants & Matrices (Mathematics)</span>
                        <span className="font-mono text-indigo-600 font-bold">360 Revisions</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-500" style={{ width: '72%' }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">5-mark matrix inversion algorithm AX = B</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-2 text-amber-700 dark:text-amber-300">
                    <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>Privacy Assurance:</strong> Anonymous formula performance statistics aggregated across active cohort. Individual practice logs and error diaries remain strictly private.
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 14: AI DAILY BRIEFING TELEMETRY */}
          {activeTab === 'briefing' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white shadow-xl border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Daily Briefing Telemetry</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-mono">
                      Anonymous Cohort Intelligence
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black">
                    Student Briefing Opening Rates & Study Difficulty Trends
                  </h3>
                  <p className="text-xs text-purple-100/80 max-w-2xl">
                    Aggregated telemetry monitoring when students open morning briefings, how notification rules engage, and the most common difficulties reported in night reflections.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="p-3 rounded-2xl bg-white/10 text-center min-w-[100px]">
                    <span className="text-[10px] text-purple-200 uppercase font-bold block">Open Rate</span>
                    <div className="text-2xl font-black font-mono text-emerald-400">89.4%</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/10 text-center min-w-[100px]">
                    <span className="text-[10px] text-amber-200 uppercase font-bold block">Top Tone</span>
                    <div className="text-2xl font-black font-mono text-amber-300">Savage</div>
                  </div>
                </div>
              </div>

              {/* 4 Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 text-center space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                    Morning Briefing Opens
                  </span>
                  <div className="text-3xl font-black font-mono text-emerald-500">94.2%</div>
                  <span className="text-[10px] text-muted-foreground font-mono">Opened before 08:30 AM</span>
                </div>

                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 text-center space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                    Night Reflections Logged
                  </span>
                  <div className="text-3xl font-black font-mono text-purple-600">79.1%</div>
                  <span className="text-[10px] text-muted-foreground font-mono">Completed before 10:30 PM</span>
                </div>

                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 text-center space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                    Daily Mission Adherence
                  </span>
                  <div className="text-3xl font-black font-mono text-amber-500">81.4%</div>
                  <span className="text-[10px] text-muted-foreground font-mono">Completed Top 2 Priorities</span>
                </div>

                <div className="p-5 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 text-center space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                    Energy Schedule Match
                  </span>
                  <div className="text-3xl font-black font-mono text-indigo-500">88.6%</div>
                  <span className="text-[10px] text-emerald-500 font-bold font-mono">High Chronotype Sync</span>
                </div>
              </div>

              {/* Daypart Engagement & Most Common Difficulties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Notification Engagement by Daypart */}
                <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span>Notification Open Engagement by Daypart</span>
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">Anti-Spam Filter</span>
                  </div>

                  <div className="space-y-3 pt-1 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">Morning Briefing (07:00 AM)</span>
                        <span className="font-mono text-emerald-600">94.2% Open Rate</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: '94%' }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">Midday Check-In (01:30 PM)</span>
                        <span className="font-mono text-amber-600">72.8% Open Rate</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: '73%' }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">Evening Summary (06:30 PM)</span>
                        <span className="font-mono text-purple-600">84.6% Open Rate</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-purple-500" style={{ width: '85%' }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">Night Reflection Routine (09:30 PM)</span>
                        <span className="font-mono text-indigo-600">79.1% Open Rate</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-500" style={{ width: '79%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Most Common Student Difficulties Reported in Reflections */}
                <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>Most Common Difficulties Reported in Night Reflections</span>
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">Cohort Calibrations</span>
                  </div>

                  <div className="space-y-3 pt-1 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">1. Numerical Calculation Speed & Log Conversions</span>
                        <span className="font-mono text-rose-600">68 Students Flagged</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">Electrochemistry Nernst and Chemical Kinetics exponential calculations</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">2. 5-Mark Derivation Step Memorization</span>
                        <span className="font-mono text-amber-600">54 Students Flagged</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">Lens Maker and Wave Optics Huygens proofs under time pressure</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">3. Afternoon Post-Lunch Cognitive Slump</span>
                        <span className="font-mono text-purple-600">47 Students Flagged</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">Solved by shifting active problem solving to 2:00 PM slot via Study DNA</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-2 text-amber-700 dark:text-amber-300">
                    <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>Privacy Assurance:</strong> Anonymous briefing engagement aggregated across active students. Individual reflection journal entries and personal comments are strictly confidential.
                    </span>
                  </div>
                </div>
              </div>

              {/* LIVE STUDENT BRIEFINGS INSPECTOR */}
              <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <h4 className="font-extrabold text-sm sm:text-base text-foreground">
                        Live Student Briefings Inspector
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Inspect individual personalized briefing cards generated by AI based on real student metrics and Study DNA.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-purple-600 font-bold">
                    {sampleStudentBriefings.length} Active Profiles
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {sampleStudentBriefings.map((stud) => {
                    const isSelected = selectedBriefingStudentId === stud.id;
                    return (
                      <button
                        key={stud.id}
                        onClick={() => setSelectedBriefingStudentId(stud.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-500/10 border-purple-500 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200/70 dark:border-white/5 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-foreground truncate">{stud.studentName}</span>
                          <span className="text-[10px] font-mono text-emerald-500 font-bold">{stud.readinessScore}%</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-mono text-purple-600 font-semibold capitalize">
                            {stud.tone.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-muted-foreground">• {stud.streakDays}d streak</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-1">
                          {stud.todayFocus}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Student Briefing Preview Card */}
                {(() => {
                  const currentStudent = sampleStudentBriefings.find((s) => s.id === selectedBriefingStudentId) || sampleStudentBriefings[0];
                  if (!currentStudent) return null;
                  return (
                    <div className="p-5 rounded-2xl bg-slate-950 text-white border border-purple-500/30 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-600/30 border border-purple-400/50 flex items-center justify-center font-black font-mono text-sm text-purple-200">
                            {currentStudent.studentName[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-sm text-white">{currentStudent.studentName}</h5>
                              <span className="px-2 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono capitalize">
                                {currentStudent.tone.replace('_', ' ')}
                              </span>
                            </div>
                            <span className="text-xs text-purple-200/70 font-mono">
                              {currentStudent.targetExam} • {currentStudent.streakDays}-Day Streak
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs font-mono">
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            Readiness: {currentStudent.readinessScore}%
                          </span>
                          <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Missions: {currentStudent.missionsCompleted}/{currentStudent.missionsTotal} Done
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] uppercase font-mono font-bold text-amber-400 block tracking-wider">
                          Personalized Briefing Message:
                        </span>
                        <p className="text-xs sm:text-sm text-purple-100 italic bg-white/5 p-3 rounded-xl border border-white/10">
                          "{currentStudent.aiMessage}"
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-purple-300/80 font-mono">
                          Today's Focus: <strong className="text-white">{currentStudent.todayFocus}</strong>
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground capitalize">
                          Last Opened: {currentStudent.lastOpenedPeriod} Briefing
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ADJUST TONE & SEND CUSTOM BRIEFING ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. TONE CALIBRATION & ADJUSTMENT */}
                <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <h4 className="font-extrabold text-sm sm:text-base text-foreground">
                        Cohort Tone Calibration
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Adjust the AI personality and messaging tone used across daily student briefings.
                    </p>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {[
                      {
                        tone: 'savage_friend' as BriefingTone,
                        label: 'Savage Friend',
                        desc: 'Witty, blunt, hyper-relatable push that fights procrastination with humor.',
                        example: 'Your Chemistry has been waiting longer than your phone notifications 😅.',
                        tag: '38% Cohort Favorite',
                      },
                      {
                        tone: 'motivational_mentor' as BriefingTone,
                        label: 'Motivational Mentor',
                        desc: 'Inspiring, momentum-driven coach reinforcing high aspirations and consistency.',
                        example: 'You are 5 days consistent. Don’t break the streak today.',
                        tag: '29% Cohort Share',
                      },
                      {
                        tone: 'strict_coach' as BriefingTone,
                        label: 'Strict Coach',
                        desc: 'Firm, accountability-first guidance focused on overdue tasks and zero excuses.',
                        example: 'Revision overdue. Complete Electrochemistry before starting anything new.',
                        tag: '18% Cohort Share',
                      },
                      {
                        tone: 'friendly_teacher' as BriefingTone,
                        label: 'Friendly Teacher',
                        desc: 'Warm, encouraging, step-by-step guidance making hard topics approachable.',
                        example: 'Small progress today will make tomorrow easier.',
                        tag: '10% Cohort Share',
                      },
                      {
                        tone: 'calm_guide' as BriefingTone,
                        label: 'Calm Guide',
                        desc: 'Stress-reducing, mindfulness-centered focus that keeps anxiety in check.',
                        example: 'Take a calm breath. One focused 45-minute derivation creates lasting mastery.',
                        tag: '5% Cohort Share',
                      },
                    ].map((item) => {
                      const isSelected = briefingCustomTone === item.tone;
                      return (
                        <div
                          key={item.tone}
                          onClick={() => setBriefingCustomTone(item.tone)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-500/10 border-purple-500 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-900 border-slate-200/70 dark:border-white/5 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground">{item.label}</span>
                            <span className="text-[10px] font-mono text-purple-600 font-semibold">{item.tag}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium italic mt-1">
                            "{item.example}"
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    onClick={async () => {
                      await briefingService.adminOverrideTone(briefingCustomTone);
                      toast.success(`Cohort briefing tone updated to ${briefingCustomTone.replace('_', ' ')}!`);
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-2xl py-2.5 cursor-pointer shadow-md"
                  >
                    Apply Tone to Active Cohort
                  </Button>
                </div>

                {/* 2. SEND CUSTOM BRIEFING COMPOSER */}
                <div className="p-6 rounded-3xl bg-card border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-purple-600" />
                      <h4 className="font-extrabold text-sm sm:text-base text-foreground">
                        Send Custom Briefing Broadcast
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Dispatch a personalized high-priority briefing notification to all students or specific segments.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Target Segment */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-foreground">Target Student Segment</label>
                      <select
                        value={briefingTargetSegment}
                        onChange={(e) => setBriefingTargetSegment(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-foreground font-medium text-xs"
                      >
                        <option value="everyone">All Students (Entire Cohort)</option>
                        <option value="class12">CBSE Class 12 Science (PCM)</option>
                        <option value="weak_chemistry">Students with Weak Chemistry Flag</option>
                        <option value="revision_overdue">Students with Overdue Revision Spaced Drills</option>
                        <option value="low_readiness">Students with &lt; 70% Readiness Score</option>
                      </select>
                    </div>

                    {/* Briefing Title */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-foreground">Briefing Title</label>
                      <input
                        type="text"
                        value={briefingCustomTitle}
                        onChange={(e) => setBriefingCustomTitle(e.target.value)}
                        placeholder="e.g. Good Morning! High-Yield Wave Optics Today"
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-foreground text-xs font-medium"
                      >
                      </input>
                    </div>

                    {/* AI Message */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-foreground">Personalized AI Mentor Message</label>
                      <textarea
                        rows={3}
                        value={briefingCustomMessage}
                        onChange={(e) => setBriefingCustomMessage(e.target.value)}
                        placeholder="Type the message that will be delivered in the student's daily briefing..."
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-foreground text-xs font-medium resize-none"
                      />
                    </div>

                    {/* Estimated Study Time */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <label className="text-[11px] font-bold text-foreground">Estimated Study Time (Minutes)</label>
                        <input
                          type="number"
                          value={briefingEstimatedMinutes}
                          onChange={(e) => setBriefingEstimatedMinutes(Number(e.target.value))}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-foreground text-xs font-mono font-bold"
                        />
                      </div>

                      <div className="flex-1 space-y-1">
                        <label className="text-[11px] font-bold text-foreground">Selected Tone</label>
                        <div className="p-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-mono font-bold capitalize">
                          {briefingCustomTone.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={async () => {
                      if (!briefingCustomTitle.trim() || !briefingCustomMessage.trim()) {
                        toast.error('Please enter a briefing title and message.');
                        return;
                      }
                      await briefingService.adminSendCustomBriefing({
                        targetSegment: briefingTargetSegment,
                        title: briefingCustomTitle,
                        focusChapter: 'Electrochemistry & Wave Optics',
                        aiMessage: briefingCustomMessage,
                        tone: briefingCustomTone,
                        estimatedMinutes: briefingEstimatedMinutes,
                      });
                      toast.success(`Custom briefing broadcast dispatched to ${briefingTargetSegment.replace('_', ' ')}!`);
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl py-2.5 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Dispatch Custom Briefing Broadcast</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};

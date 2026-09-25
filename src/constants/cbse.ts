import { CBSEClass, CBSESubject } from '@/types/cbse';

export const CBSE_CLASSES: CBSEClass[] = [
  { id: 9, label: 'Class 9', description: 'Foundation for Secondary Board' },
  { id: 10, label: 'Class 10', description: 'Secondary School Board Examination' },
  { id: 11, label: 'Class 11', description: 'Senior Secondary Foundation' },
  { id: 12, label: 'Class 12', description: 'Senior School Board Examination' },
];

export const CBSE_SUBJECTS: CBSESubject[] = [
  {
    id: 'maths',
    name: 'Mathematics',
    code: '041',
    classes: [9, 10, 11, 12],
    icon: 'BrainCircuit',
    color: '#7c3aed',
  },
  {
    id: 'science',
    name: 'Science',
    code: '086',
    classes: [9, 10],
    icon: 'Sparkles',
    color: '#2563eb',
  },
  {
    id: 'physics',
    name: 'Physics',
    code: '042',
    classes: [11, 12],
    streams: ['science'],
    icon: 'Sparkles',
    color: '#0284c7',
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    code: '043',
    classes: [11, 12],
    streams: ['science'],
    icon: 'Sparkles',
    color: '#059669',
  },
  {
    id: 'biology',
    name: 'Biology',
    code: '044',
    classes: [11, 12],
    streams: ['science'],
    icon: 'BookOpen',
    color: '#10b981',
  },
  {
    id: 'social-science',
    name: 'Social Science',
    code: '087',
    classes: [9, 10],
    icon: 'Compass',
    color: '#ea580c',
  },
  {
    id: 'english',
    name: 'English Core',
    code: '301',
    classes: [9, 10, 11, 12],
    icon: 'FileText',
    color: '#d97706',
  },
];

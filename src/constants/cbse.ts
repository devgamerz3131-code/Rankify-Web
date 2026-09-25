import { CBSEClass, CBSESubject } from '@/types/cbse';

export const CBSE_CLASSES: CBSEClass[] = [
  { id: 12, label: 'Class 12', description: 'Senior School Board Examination (Science PCM)' },
];

export const CBSE_SUBJECTS: CBSESubject[] = [
  {
    id: 'physics',
    name: 'Physics',
    code: '042',
    classes: [12],
    streams: ['science'],
    icon: 'Sparkles',
    color: '#6366f1',
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    code: '043',
    classes: [12],
    streams: ['science'],
    icon: 'Sparkles',
    color: '#ec4899',
  },
  {
    id: 'mathematics',
    name: 'Mathematics',
    code: '041',
    classes: [12],
    streams: ['science'],
    icon: 'BrainCircuit',
    color: '#3b82f6',
  },
];

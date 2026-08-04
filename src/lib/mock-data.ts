import { 
  Question, QuestionBank, Exam, Student, StudentExamSession,
  Subject, ClassGrade, Topic, MonitoringData
} from './types';

// ============================================================
// Mock Subjects
// ============================================================
export const SUBJECTS: Subject[] = [
  { id: 's1', name: 'Matematika', code: 'MTK' },
  { id: 's2', name: 'Bahasa Indonesia', code: 'BIN' },
  { id: 's3', name: 'IPA (Fisika)', code: 'IPA' },
  { id: 's4', name: 'IPS (Sejarah)', code: 'IPS' },
  { id: 's5', name: 'Bahasa Inggris', code: 'BIG' },
];

// ============================================================
// Mock Class Grades
// ============================================================
export const CLASS_GRADES: ClassGrade[] = [
  { id: 'c1', name: 'Kelas VII', level: 7 },
  { id: 'c2', name: 'Kelas VIII', level: 8 },
  { id: 'c3', name: 'Kelas IX', level: 9 },
  { id: 'c4', name: 'Kelas X', level: 10 },
  { id: 'c5', name: 'Kelas XI', level: 11 },
  { id: 'c6', name: 'Kelas XII', level: 12 },
];

// ============================================================
// Mock Topics
// ============================================================
export const TOPICS: Topic[] = [
  { id: 't1', name: 'Aljabar', subjectId: 's1' },
  { id: 't2', name: 'Geometri', subjectId: 's1' },
  { id: 't3', name: 'Statistika', subjectId: 's1' },
  { id: 't4', name: 'Teks Narasi', subjectId: 's2' },
  { id: 't5', name: 'Teks Deskripsi', subjectId: 's2' },
  { id: 't6', name: 'Hukum Newton', subjectId: 's3' },
  { id: 't7', name: 'Listrik Statis', subjectId: 's3' },
  { id: 't8', name: 'Perang Dunia II', subjectId: 's4' },
  { id: 't9', name: 'Kemerdekaan Indonesia', subjectId: 's4' },
  { id: 't10', name: 'Grammar & Tenses', subjectId: 's5' },
  { id: 't11', name: 'Reading Comprehension', subjectId: 's5' },
];

// ============================================================
// Mock Questions
// ============================================================
export const MOCK_QUESTIONS: Question[] = [];

// ============================================================
// Mock Question Banks
// ============================================================
export const MOCK_QUESTION_BANKS: QuestionBank[] = [];

// ============================================================
// Mock Exams
// ============================================================
export const MOCK_EXAMS: Exam[] = [];

// ============================================================
// Mock Students
// ============================================================
export const MOCK_STUDENTS: Student[] = [];

// ============================================================
// Mock Student Exam Sessions (for monitoring)
// ============================================================
export const MOCK_SESSIONS: StudentExamSession[] = [];

// ============================================================
// Mock Monitoring Data
// ============================================================
export const MOCK_MONITORING: MonitoringData = {
  examId: '',
  examTitle: '',
  totalStudents: 0,
  activeStudents: 0,
  disconnectedStudents: 0,
  flaggedStudents: 0,
  completedStudents: 0,
  sessions: [],
};

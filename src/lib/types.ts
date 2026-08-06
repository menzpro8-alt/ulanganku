// ============================================================
// AI-Powered Exam Platform - Type Definitions
// ============================================================

// Question Types
export type QuestionType = 
  | 'pilihan_ganda'        // Single Choice
  | 'pilihan_ganda_kompleks' // Multi-Select
  | 'menjodohkan'          // Matching Pairs
  | 'isian_singkat'        // Short Answer
  | 'essay';               // Essay

export type Difficulty = 'mudah' | 'sedang' | 'sulit';

export type ExamStatus = 'draft' | 'published' | 'active' | 'completed';

export type StudentExamStatus = 'not_started' | 'active' | 'disconnected' | 'flagged' | 'completed' | 'auto_submitted';

// Subject and Class
export interface Subject {
  id: string;
  name: string;
  code: string;
}

export interface ClassGrade {
  id: string;
  name: string;
  level: number;
}

export interface Topic {
  id: string;
  name: string;
  subjectId: string;
}

// Question Option (for choice-based questions)
export interface QuestionOption {
  id: string;
  label: string; // A, B, C, D, E
  text: string;
  isCorrect: boolean;
}

// Matching Pair
export interface MatchingPair {
  id: string;
  premise: string;  // Left item
  response: string; // Right item
}



// Base Question
export interface Question {
  id: string;
  type: QuestionType;
  subjectId: string;
  classGradeId: string;
  topicId: string;
  difficulty: Difficulty;
  text: string;
  image?: string;
  points: number;
  // Type-specific fields
  options?: QuestionOption[];           // For pilihan_ganda & pilihan_ganda_kompleks
  matchingPairs?: MatchingPair[];       // For menjodohkan

  createdAt: string;
  updatedAt: string;
}

// Question Bank
export interface QuestionBank {
  id: string;
  name: string;
  subjectId: string;
  classGradeId: string;
  topicId: string;
  description?: string;
  questionCount: number;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

// Exam
export interface Exam {
  id: string;
  title: string;
  description?: string;
  subjectId: string;
  classGradeId: string;
  status: ExamStatus;
  durationMinutes: number;
  totalPoints: number;
  passingScore: number;
  token: string;
  questions: ExamQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface ExamQuestion {
  id: string;
  questionId: string;
  question: Question;
  order: number;
  points: number;
}

// Student
export interface Student {
  id: string;
  name: string;
  classGrade: string;
  avatar?: string;
}

// Student Exam Session
export interface StudentExamSession {
  id: string;
  studentId: string;
  student: Student;
  examId: string;
  status: StudentExamStatus;
  antiCheatStrikes: number;
  startTime?: string;
  endTime?: string;
  currentQuestionIndex: number;
  answers: StudentAnswer[];
  score?: number;
}

// Student Answer
export interface StudentAnswer {
  questionId: string;
  type: QuestionType;
  // Type-specific answer fields
  selectedOptionIds?: string[];     // For pilihan_ganda & pilihan_ganda_kompleks
  matchingAnswers?: { premiseId: string; responseId: string }[]; // For menjodohkan
  textAnswer?: string;              // For isian_singkat & essay

}

// AI Generation Request
export interface AIGenerateRequest {
  subject: string;
  grade: string;
  difficulty: Difficulty;
  questionCount: number;
  questionTypes: QuestionType[];
  topic?: string;
}

// AI Generated Question (staging)
export interface AIGeneratedQuestion {
  id: string;
  tempId: string;
  type: QuestionType;
  text: string;
  difficulty: Difficulty;
  options?: QuestionOption[];
  matchingPairs?: MatchingPair[];

  points: number;
  isSelected: boolean;
}

// Import Validation Result
export interface ImportValidationResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: ImportError[];
  questions: Partial<Question>[];
}

export interface ImportError {
  row: number;
  column: string;
  message: string;
  value: string;
}

// Monitoring
export interface MonitoringData {
  examId: string;
  examTitle: string;
  totalStudents: number;
  activeStudents: number;
  disconnectedStudents: number;
  flaggedStudents: number;
  completedStudents: number;
  sessions: StudentExamSession[];
}

// Navigation
export type AppView = 
  | 'role_select'
  | 'admin_dashboard'
  | 'teacher_dashboard'
  | 'teacher_question_bank'
  | 'teacher_question_editor'
  | 'teacher_import'
  | 'teacher_ai_generator'
  | 'teacher_monitor'
  | 'teacher_exam_manager'
  | 'teacher_reports'
  | 'student_dashboard'
  | 'student_exam'
  | 'student_results';

export type UserRole = 'admin' | 'teacher' | 'student' | null;

// App State
export interface AppState {
  role: UserRole;
  currentView: AppView;
  selectedQuestionBank: QuestionBank | null;
  selectedExam: Exam | null;
  editingQuestion: Question | null;
  editingQuestionType: QuestionType | null;
  studentSession: StudentExamSession | null;
  antiCheatStrikes: number;
  showAntiCheatOverlay: boolean;
}

// Question type labels
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  pilihan_ganda: 'Pilihan Ganda',
  pilihan_ganda_kompleks: 'Pilihan Ganda Kompleks',
  menjodohkan: 'Menjodohkan',
  isian_singkat: 'Isian Singkat',
  essay: 'Uraian / Essay',
};

export const QUESTION_TYPE_ICONS: Record<QuestionType, string> = {
  pilihan_ganda: 'faCircleDot',
  pilihan_ganda_kompleks: 'faSquareCheck',
  menjodohkan: 'faRightLeft',
  isian_singkat: 'faKeyboard',
  essay: 'faParagraph',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  mudah: 'Mudah',
  sedang: 'Sedang',
  sulit: 'Sulit',
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  mudah: 'bg-emerald-100 text-emerald-700',
  sedang: 'bg-amber-100 text-amber-700',
  sulit: 'bg-red-100 text-red-700',
};

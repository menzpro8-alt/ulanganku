import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  AppView, UserRole, QuestionBank, Exam, Question, 
  QuestionType, StudentExamSession, StudentAnswer,
} from './types';

interface ExamStore {
  // Navigation
  role: UserRole;
  currentView: AppView;
  setRole: (role: UserRole) => void;
  setView: (view: AppView) => void;
  navigateBack: () => void;
  
  // Teacher state
  selectedQuestionBank: QuestionBank | null;
  setSelectedQuestionBank: (bank: QuestionBank | null) => void;
  selectedExam: Exam | null;
  setSelectedExam: (exam: Exam | null) => void;
  editingQuestion: Question | null;
  setEditingQuestion: (question: Question | null) => void;
  editingQuestionType: QuestionType | null;
  setEditingQuestionType: (type: QuestionType | null) => void;
  
  // Question bank filters
  filterSubject: string;
  filterClass: string;
  filterTopic: string;
  searchQuery: string;
  setFilterSubject: (v: string) => void;
  setFilterClass: (v: string) => void;
  setFilterTopic: (v: string) => void;
  setSearchQuery: (v: string) => void;
  
  // Student state
  studentSession: StudentExamSession | null;
  setStudentSession: (session: StudentExamSession | null) => void;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  studentAnswers: Map<string, StudentAnswer>;
  setStudentAnswer: (questionId: string, answer: StudentAnswer) => void;
  
  // Anti-cheat
  antiCheatStrikes: number;
  addStrike: () => void;
  showAntiCheatOverlay: boolean;
  setShowAntiCheatOverlay: (show: boolean) => void;
  resetAntiCheat: () => void;
  
  // Import wizard
  importStep: number;
  setImportStep: (step: number) => void;
  importFile: File | null;
  setImportFile: (file: File | null) => void;
  
  // AI Generator
  aiSubject: string;
  aiGrade: string;
  aiDifficulty: string;
  aiQuestionCount: number;
  aiQuestionTypes: QuestionType[];
  aiModel: string;
  setAiSubject: (v: string) => void;
  setAiGrade: (v: string) => void;
  setAiDifficulty: (v: string) => void;
  setAiQuestionCount: (n: number) => void;
  setAiQuestionTypes: (t: QuestionType[]) => void;
  setAiModel: (m: string) => void;
}

const VIEW_HISTORY: AppView[] = [];

export const useExamStore = create<ExamStore>()(persist((set, get) => ({
  // Navigation
  role: null,
  currentView: 'role_select',
  setRole: (role) => set({ 
    role, 
    currentView: role === 'teacher' ? 'teacher_dashboard' : 'student_dashboard' 
  }),
  setView: (currentView) => {
    const prev = get().currentView;
    VIEW_HISTORY.push(prev);
    set({ currentView });
  },
  navigateBack: () => {
    const prev = VIEW_HISTORY.pop();
    if (prev) set({ currentView: prev });
  },
  
  // Teacher state
  selectedQuestionBank: null,
  setSelectedQuestionBank: (selectedQuestionBank) => set({ selectedQuestionBank }),
  selectedExam: null,
  setSelectedExam: (selectedExam) => set({ selectedExam }),
  editingQuestion: null,
  setEditingQuestion: (editingQuestion) => set({ editingQuestion }),
  editingQuestionType: null,
  setEditingQuestionType: (editingQuestionType) => set({ editingQuestionType }),
  
  // Filters
  filterSubject: '',
  filterClass: '',
  filterTopic: '',
  searchQuery: '',
  setFilterSubject: (filterSubject) => set({ filterSubject }),
  setFilterClass: (filterClass) => set({ filterClass }),
  setFilterTopic: (filterTopic) => set({ filterTopic }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  
  // Student state
  studentSession: null,
  setStudentSession: (studentSession) => set({ studentSession }),
  currentQuestionIndex: 0,
  setCurrentQuestionIndex: (currentQuestionIndex) => set({ currentQuestionIndex }),
  studentAnswers: new Map(),
  setStudentAnswer: (questionId, answer) => {
    const newAnswers = new Map(get().studentAnswers);
    newAnswers.set(questionId, answer);
    set({ studentAnswers: newAnswers });
  },
  
  // Anti-cheat
  antiCheatStrikes: 0,
  addStrike: () => {
    const current = get().antiCheatStrikes;
    set({ antiCheatStrikes: current + 1 });
    if (current + 1 >= 3) {
      set({ showAntiCheatOverlay: true });
    }
  },
  showAntiCheatOverlay: false,
  setShowAntiCheatOverlay: (showAntiCheatOverlay) => set({ showAntiCheatOverlay }),
  resetAntiCheat: () => set({ antiCheatStrikes: 0, showAntiCheatOverlay: false }),
  
  // Import wizard
  importStep: 0,
  setImportStep: (importStep) => set({ importStep }),
  importFile: null,
  setImportFile: (importFile) => set({ importFile }),
  
  // AI Generator
  aiSubject: '',
  aiGrade: '',
  aiDifficulty: 'sedang',
  aiQuestionCount: 5,
  aiQuestionTypes: ['pilihan_ganda'],
  aiModel: 'claude-3-5-sonnet',
  setAiSubject: (aiSubject) => set({ aiSubject }),
  setAiGrade: (aiGrade) => set({ aiGrade }),
  setAiDifficulty: (aiDifficulty) => set({ aiDifficulty }),
  setAiQuestionCount: (aiQuestionCount) => set({ aiQuestionCount }),
  setAiQuestionTypes: (aiQuestionTypes) => set({ aiQuestionTypes }),
  setAiModel: (aiModel) => set({ aiModel }),
}), { name: 'exam-store', partialize: (state) => ({ role: state.role, currentView: state.currentView, studentSession: state.studentSession }) }));

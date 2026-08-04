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
export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q1',
    type: 'pilihan_ganda',
    subjectId: 's1',
    classGradeId: 'c4',
    topicId: 't1',
    difficulty: 'sedang',
    text: 'Jika 2x + 5 = 13, maka nilai x adalah...',
    points: 10,
    options: [
      { id: 'q1a', label: 'A', text: '3', isCorrect: false },
      { id: 'q1b', label: 'B', text: '4', isCorrect: true },
      { id: 'q1c', label: 'C', text: '5', isCorrect: false },
      { id: 'q1d', label: 'D', text: '6', isCorrect: false },
      { id: 'q1e', label: 'E', text: '7', isCorrect: false },
    ],
    createdAt: '2025-01-15T08:00:00Z',
    updatedAt: '2025-01-15T08:00:00Z',
  },
  {
    id: 'q2',
    type: 'pilihan_ganda_kompleks',
    subjectId: 's1',
    classGradeId: 'c4',
    topicId: 't1',
    difficulty: 'sulit',
    text: 'Pilih semua pernyataan yang benar tentang fungsi kuadrat f(x) = x\u00B2 - 4x + 3:',
    points: 15,
    options: [
      { id: 'q2a', label: 'A', text: 'Titik puncak berada di x = 2', isCorrect: true },
      { id: 'q2b', label: 'B', text: 'Grafik memotong sumbu y di y = 3', isCorrect: true },
      { id: 'q2c', label: 'C', text: 'Diskriminan bernilai negatif', isCorrect: false },
      { id: 'q2d', label: 'D', text: 'Grafik terbuka ke bawah', isCorrect: false },
      { id: 'q2e', label: 'E', text: 'Akar-akarnya adalah x = 1 dan x = 3', isCorrect: true },
    ],
    createdAt: '2025-01-15T09:00:00Z',
    updatedAt: '2025-01-15T09:00:00Z',
  },
  {
    id: 'q3',
    type: 'menjodohkan',
    subjectId: 's5',
    classGradeId: 'c4',
    topicId: 't10',
    difficulty: 'sedang',
    text: 'Cocokkan kalimat dengan tense yang tepat:',
    points: 20,
    matchingPairs: [
      { id: 'q3p1', premise: 'I eat breakfast every morning', response: 'Simple Present' },
      { id: 'q3p2', premise: 'I am eating breakfast now', response: 'Present Continuous' },
      { id: 'q3p3', premise: 'I have eaten breakfast', response: 'Present Perfect' },
      { id: 'q3p4', premise: 'I have been eating for 30 minutes', response: 'Present Perfect Continuous' },
    ],
    createdAt: '2025-01-16T10:00:00Z',
    updatedAt: '2025-01-16T10:00:00Z',
  },

  {
    id: 'q6',
    type: 'pilihan_ganda',
    subjectId: 's3',
    classGradeId: 'c4',
    topicId: 't6',
    difficulty: 'mudah',
    text: 'Satuan SI untuk gaya adalah...',
    points: 5,
    options: [
      { id: 'q6a', label: 'A', text: 'Joule', isCorrect: false },
      { id: 'q6b', label: 'B', text: 'Newton', isCorrect: true },
      { id: 'q6c', label: 'C', text: 'Pascal', isCorrect: false },
      { id: 'q6d', label: 'D', text: 'Watt', isCorrect: false },
    ],
    createdAt: '2025-01-17T09:00:00Z',
    updatedAt: '2025-01-17T09:00:00Z',
  },
  {
    id: 'q7',
    type: 'pilihan_ganda',
    subjectId: 's4',
    classGradeId: 'c5',
    topicId: 't9',
    difficulty: 'sedang',
    text: 'Proklamasi kemerdekaan Indonesia dibacakan pada tanggal...',
    points: 10,
    options: [
      { id: 'q7a', label: 'A', text: '17 Agustus 1945', isCorrect: true },
      { id: 'q7b', label: 'B', text: '18 Agustus 1945', isCorrect: false },
      { id: 'q7c', label: 'C', text: '1 Juni 1945', isCorrect: false },
      { id: 'q7d', label: 'D', text: '10 November 1945', isCorrect: false },
    ],
    createdAt: '2025-01-18T08:00:00Z',
    updatedAt: '2025-01-18T08:00:00Z',
  },
  {
    id: 'q8',
    type: 'menjodohkan',
    subjectId: 's3',
    classGradeId: 'c4',
    topicId: 't7',
    difficulty: 'sedang',
    text: 'Cocokkan besaran listrik dengan satuannya:',
    points: 20,
    matchingPairs: [
      { id: 'q8p1', premise: 'Arus Listrik', response: 'Ampere' },
      { id: 'q8p2', premise: 'Tegangan', response: 'Volt' },
      { id: 'q8p3', premise: 'Hambatan', response: 'Ohm' },
      { id: 'q8p4', premise: 'Daya', response: 'Watt' },
    ],
    createdAt: '2025-01-18T10:00:00Z',
    updatedAt: '2025-01-18T10:00:00Z',
  },

];

// ============================================================
// Mock Question Banks
// ============================================================
export const MOCK_QUESTION_BANKS: QuestionBank[] = [
  {
    id: 'qb1',
    name: 'Bank Soal Aljabar Kelas X',
    subjectId: 's1',
    classGradeId: 'c4',
    topicId: 't1',
    description: 'Kumpulan soal aljabar untuk kelas X semester 1',
    questionCount: 2,
    questions: MOCK_QUESTIONS.filter(q => q.subjectId === 's1' && q.topicId === 't1'),
    createdAt: '2025-01-15T08:00:00Z',
    updatedAt: '2025-01-15T08:00:00Z',
  },
  {
    id: 'qb2',
    name: 'Bank Soal Bahasa Inggris Grammar',
    subjectId: 's5',
    classGradeId: 'c4',
    topicId: 't10',
    description: 'Soal grammar dan tenses untuk kelas X',
    questionCount: 1,
    questions: MOCK_QUESTIONS.filter(q => q.subjectId === 's5' && q.topicId === 't10'),
    createdAt: '2025-01-16T08:00:00Z',
    updatedAt: '2025-01-16T08:00:00Z',
  },
  {
    id: 'qb3',
    name: 'Bank Soal Fisika Hukum Newton',
    subjectId: 's3',
    classGradeId: 'c4',
    topicId: 't6',
    description: 'Soal fisika pokok hukum Newton',
    questionCount: 1,
    questions: MOCK_QUESTIONS.filter(q => q.subjectId === 's3' && q.topicId === 't6'),
    createdAt: '2025-01-17T08:00:00Z',
    updatedAt: '2025-01-17T08:00:00Z',
  },
  {
    id: 'qb4',
    name: 'Bank Soal Sejarah Indonesia',
    subjectId: 's4',
    classGradeId: 'c5',
    topicId: 't9',
    description: 'Soal sejarah kemerdekaan Indonesia',
    questionCount: 1,
    questions: MOCK_QUESTIONS.filter(q => q.subjectId === 's4' && q.topicId === 't9'),
    createdAt: '2025-01-18T08:00:00Z',
    updatedAt: '2025-01-18T08:00:00Z',
  },
  {
    id: 'qb5',
    name: 'Bank Soal IPA Listrik',
    subjectId: 's3',
    classGradeId: 'c4',
    topicId: 't7',
    description: 'Soal listrik statis dan dinamis',
    questionCount: 1,
    questions: MOCK_QUESTIONS.filter(q => q.subjectId === 's3' && q.topicId === 't7'),
    createdAt: '2025-01-18T10:00:00Z',
    updatedAt: '2025-01-18T10:00:00Z',
  },
];

// ============================================================
// Mock Exams
// ============================================================
export const MOCK_EXAMS: Exam[] = [
  {
    id: 'e1',
    title: 'Ujian Tengah Semester - Matematika X',
    description: 'UTS Matematika Kelas X Semester Genap 2025',
    subjectId: 's1',
    classGradeId: 'c4',
    status: 'active',
    durationMinutes: 90,
    totalPoints: 100,
    passingScore: 60,
    token: 'MAT123',
    questions: [
      { id: 'eq1', questionId: 'q1', question: MOCK_QUESTIONS[0], order: 1, points: 10 },
      { id: 'eq2', questionId: 'q2', question: MOCK_QUESTIONS[1], order: 2, points: 15 },
      { id: 'eq4', questionId: 'q4', question: MOCK_QUESTIONS[3], order: 3, points: 10 },
    ],
    createdAt: '2025-01-20T08:00:00Z',
    updatedAt: '2025-01-20T08:00:00Z',
  },
  {
    id: 'e2',
    title: 'Quiz Bahasa Inggris - Tenses',
    description: 'Quiz singkat grammar dan tenses',
    subjectId: 's5',
    classGradeId: 'c4',
    status: 'published',
    durationMinutes: 45,
    totalPoints: 50,
    passingScore: 30,
    token: 'ENG456',
    questions: [
      { id: 'eq3', questionId: 'q3', question: MOCK_QUESTIONS[2], order: 1, points: 20 },
      { id: 'eq9', questionId: 'q9', question: MOCK_QUESTIONS[8], order: 2, points: 5 },
    ],
    createdAt: '2025-01-21T08:00:00Z',
    updatedAt: '2025-01-21T08:00:00Z',
  },
  {
    id: 'e3',
    title: 'Ujian Akhir Semester - Fisika XI',
    description: 'UAS Fisika Kelas XI Semester Genap 2025',
    subjectId: 's3',
    classGradeId: 'c5',
    status: 'draft',
    durationMinutes: 120,
    totalPoints: 150,
    passingScore: 75,
    token: 'FIS789',
    questions: [
      { id: 'eq6', questionId: 'q6', question: MOCK_QUESTIONS[5], order: 1, points: 5 },
      { id: 'eq8', questionId: 'q8', question: MOCK_QUESTIONS[7], order: 2, points: 20 },
      { id: 'eq10', questionId: 'q10', question: MOCK_QUESTIONS[9], order: 3, points: 30 },
    ],
    createdAt: '2025-01-22T08:00:00Z',
    updatedAt: '2025-01-22T08:00:00Z',
  },
];

// ============================================================
// Mock Students
// ============================================================
export const MOCK_STUDENTS: Student[] = [
  { id: 'st1', name: 'Ahmad Rizki', classGrade: 'Kelas X' },
  { id: 'st2', name: 'Siti Nurhaliza', classGrade: 'Kelas X' },
  { id: 'st3', name: 'Budi Santoso', classGrade: 'Kelas X' },
  { id: 'st4', name: 'Dewi Kartika', classGrade: 'Kelas X' },
  { id: 'st5', name: 'Eko Prasetyo', classGrade: 'Kelas X' },
  { id: 'st6', name: 'Fitri Handayani', classGrade: 'Kelas X' },
  { id: 'st7', name: 'Gunawan Wibowo', classGrade: 'Kelas XI' },
  { id: 'st8', name: 'Hana Safira', classGrade: 'Kelas XI' },
  { id: 'st9', name: 'Irfan Maulana', classGrade: 'Kelas XI' },
  { id: 'st10', name: 'Joko Widodo', classGrade: 'Kelas XI' },
  { id: 'st11', name: 'Kartini Putri', classGrade: 'Kelas XI' },
  { id: 'st12', name: 'Lestari Dewi', classGrade: 'Kelas XI' },
];

// ============================================================
// Mock Student Exam Sessions (for monitoring)
// ============================================================
export const MOCK_SESSIONS: StudentExamSession[] = [
  {
    id: 'ses1', studentId: 'st1', student: MOCK_STUDENTS[0], examId: 'e1',
    status: 'active', antiCheatStrikes: 0, currentQuestionIndex: 2,
    startTime: '2025-01-20T09:00:00Z', answers: [],
  },
  {
    id: 'ses2', studentId: 'st2', student: MOCK_STUDENTS[1], examId: 'e1',
    status: 'active', antiCheatStrikes: 1, currentQuestionIndex: 1,
    startTime: '2025-01-20T09:00:00Z', answers: [],
  },
  {
    id: 'ses3', studentId: 'st3', student: MOCK_STUDENTS[2], examId: 'e1',
    status: 'disconnected', antiCheatStrikes: 2, currentQuestionIndex: 3,
    startTime: '2025-01-20T09:00:00Z', answers: [],
  },
  {
    id: 'ses4', studentId: 'st4', student: MOCK_STUDENTS[3], examId: 'e1',
    status: 'flagged', antiCheatStrikes: 3, currentQuestionIndex: 1,
    startTime: '2025-01-20T09:00:00Z', answers: [],
  },
  {
    id: 'ses5', studentId: 'st5', student: MOCK_STUDENTS[4], examId: 'e1',
    status: 'completed', antiCheatStrikes: 0, currentQuestionIndex: 3,
    startTime: '2025-01-20T09:00:00Z', endTime: '2025-01-20T09:45:00Z', answers: [],
  },
  {
    id: 'ses6', studentId: 'st6', student: MOCK_STUDENTS[5], examId: 'e1',
    status: 'active', antiCheatStrikes: 0, currentQuestionIndex: 2,
    startTime: '2025-01-20T09:00:00Z', answers: [],
  },
];

// ============================================================
// Mock Monitoring Data
// ============================================================
export const MOCK_MONITORING: MonitoringData = {
  examId: 'e1',
  examTitle: 'Ujian Tengah Semester - Matematika X',
  totalStudents: 6,
  activeStudents: 3,
  disconnectedStudents: 1,
  flaggedStudents: 1,
  completedStudents: 1,
  sessions: MOCK_SESSIONS,
};

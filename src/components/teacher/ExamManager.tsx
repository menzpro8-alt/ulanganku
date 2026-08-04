'use client';

import { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileAlt,
  faPlus,
  faSearch,
  faFilter,
  faClock,
  faStar,
  faEdit,
  faCopy,
  faTrash,
  faChevronRight,
  faArrowLeft,
  faSave,
  faPaperPlane,
  faCircleDot,
  faSquareCheck,
  faRightLeft,
  faFont,
  faAlignLeft,
  faGripVertical,
  faTimes,
  faCheck,
  faUsers,
  faCalendarAlt,
  faQuestionCircle,
  faBookOpen,
} from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { publishExam } from '@/app/actions/exam';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MOCK_EXAMS, MOCK_QUESTIONS, SUBJECTS, CLASS_GRADES } from '@/lib/mock-data';
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/lib/types';
import type { Exam, ExamStatus, Question, QuestionType } from '@/lib/types';

const STATUS_CONFIG: Record<ExamStatus, { label: string; bg: string; text: string; pulse?: boolean }> = {
  draft: { label: 'Draft', bg: 'bg-cool-gray-200', text: 'text-cool-gray-500' },
  published: { label: 'Dipublikasi', bg: 'bg-blue-100', text: 'text-blue-600' },
  active: { label: 'Aktif', bg: 'bg-emerald-100', text: 'text-emerald-600', pulse: true },
  completed: { label: 'Selesai', bg: 'bg-slate-100', text: 'text-slate-500' },
};

const TYPE_ICONS: Record<QuestionType, typeof faCircleDot> = {
  pilihan_ganda: faCircleDot,
  pilihan_ganda_kompleks: faSquareCheck,
  menjodohkan: faRightLeft,
};

function getSubjectName(subjectId: string): string {
  return SUBJECTS.find(s => s.id === subjectId)?.name ?? '-';
}

function getClassName(classGradeId: string): string {
  return CLASS_GRADES.find(c => c.id === classGradeId)?.name ?? '-';
}

type ViewMode = 'list' | 'create' | 'detail';

interface ExamFormData {
  title: string;
  description: string;
  subjectId: string;
  classGradeId: string;
  durationMinutes: number;
  passingScore: number;
  token: string;
  selectedQuestionIds: string[];
}

const emptyForm: ExamFormData = {
  title: '',
  description: '',
  subjectId: '',
  classGradeId: '',
  durationMinutes: 60,
  passingScore: 60,
  token: '',
  selectedQuestionIds: [],
};

export default function ExamManager() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [form, setForm] = useState<ExamFormData>(emptyForm);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filtered exams
  const filteredExams = useMemo(() => {
    return MOCK_EXAMS.filter(exam => {
      const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || exam.status === filterStatus;
      const matchesSubject = filterSubject === 'all' || exam.subjectId === filterSubject;
      return matchesSearch && matchesStatus && matchesSubject;
    });
  }, [searchQuery, filterStatus, filterSubject, refreshKey]);

  // Available questions for form (from mock)
  const availableQuestions = MOCK_QUESTIONS;
  const filteredAvailable = useMemo(() => {
    if (!form.subjectId) return availableQuestions;
    return availableQuestions.filter(q => q.subjectId === form.subjectId);
  }, [form.subjectId, availableQuestions]);

  const selectedTotalPoints = useMemo(() => {
    return form.selectedQuestionIds.reduce((sum, qId) => {
      const q = availableQuestions.find(aq => aq.id === qId);
      return sum + (q?.points ?? 0);
    }, 0);
  }, [form.selectedQuestionIds, availableQuestions]);

  const handleCreateExam = () => {
    setForm(emptyForm);
    setViewMode('create');
  };

  const handleViewExam = (exam: Exam) => {
    setSelectedExam(exam);
    setViewMode('detail');
  };

  const handleEditExam = (exam: Exam) => {
    setForm({
      title: exam.title,
      description: exam.description ?? '',
      subjectId: exam.subjectId,
      classGradeId: exam.classGradeId,
      durationMinutes: exam.durationMinutes,
      passingScore: exam.passingScore,
      token: exam.token,
      selectedQuestionIds: exam.questions.map(eq => eq.questionId),
    });
    setSelectedExam(exam);
    setViewMode('create');
  };

  const handleDuplicateExam = (exam: Exam) => {
    setForm({
      title: `${exam.title} (Salinan)`,
      description: exam.description ?? '',
      subjectId: exam.subjectId,
      classGradeId: exam.classGradeId,
      durationMinutes: exam.durationMinutes,
      passingScore: exam.passingScore,
      token: exam.token,
      selectedQuestionIds: exam.questions.map(eq => eq.questionId),
    });
    setSelectedExam(null);
    setViewMode('create');
  };

  const handleToggleQuestion = (questionId: string) => {
    const next = form.selectedQuestionIds.includes(questionId)
      ? form.selectedQuestionIds.filter(id => id !== questionId)
      : [...form.selectedQuestionIds, questionId];
    setForm({ ...form, selectedQuestionIds: next });
  };

  const buildExam = (status: ExamStatus): Exam => {
    const selectedQuestions = availableQuestions.filter(q => form.selectedQuestionIds.includes(q.id));
    return {
      id: selectedExam?.id || `e-${Date.now()}`,
      title: form.title,
      description: form.description,
      subjectId: form.subjectId,
      classGradeId: form.classGradeId,
      status,
      durationMinutes: form.durationMinutes,
      totalPoints: selectedTotalPoints,
      passingScore: form.passingScore,
      token: form.token,
      questions: selectedQuestions.map((q, idx) => ({
        id: `eq-${Date.now()}-${idx}`,
        questionId: q.id,
        question: q,
        order: idx + 1,
        points: q.points || 0,
      })),
      createdAt: selectedExam?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSaveDraft = () => {
    const newExam = buildExam('draft');
    if (selectedExam) {
      const idx = MOCK_EXAMS.findIndex(e => e.id === selectedExam.id);
      if (idx !== -1) MOCK_EXAMS[idx] = newExam;
    } else {
      MOCK_EXAMS.push(newExam);
    }
    setRefreshKey(k => k + 1);
    setViewMode('list');
    setSelectedExam(null);
    setForm(emptyForm);
  };

  const handlePublish = async () => {
    const newExam = buildExam('active');
    if (selectedExam) {
      const idx = MOCK_EXAMS.findIndex(e => e.id === selectedExam.id);
      if (idx !== -1) MOCK_EXAMS[idx] = newExam;
    } else {
      MOCK_EXAMS.push(newExam);
    }
    
    // Save to database permanently
    const result = await publishExam(newExam);
    if (result.success) {
      toast.success('Ujian berhasil dipublikasikan secara permanen ke database!');
      // Update ID to database ID if it was a new mock ID
      if (result.examId && !selectedExam) {
         newExam.id = result.examId;
      }
    } else {
      toast.error(result.error || 'Gagal mempublikasikan ke database');
    }

    setRefreshKey(k => k + 1);
    setViewMode('list');
    setSelectedExam(null);
    setForm(emptyForm);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedExam(null);
    setForm(emptyForm);
  };

  // ============================================================
  // EXAM LIST VIEW
  // ============================================================
  if (viewMode === 'list') {
    return (
      <div className="space-y-6 page-enter">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-charcoal">Kelola Ujian</h2>
            <p className="text-sm text-charcoal-light mt-0.5">Buat, edit, dan kelola semua ujian</p>
          </div>
          <Button
            onClick={handleCreateExam}
            className="bg-gradient-to-r from-[#5B6ABF] to-[#4554A0] hover:from-[#4F5AB0] hover:to-[#3D4A90] text-white"
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs mr-1.5" />
            Buat Ujian Baru
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-cool-gray-200">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-cool-gray-400 text-sm" />
                <Input
                  placeholder="Cari ujian..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 border-cool-gray-200 h-9"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[150px] h-9 border-cool-gray-200">
                  <FontAwesomeIcon icon={faFilter} className="text-cool-gray-400 text-[10px] mr-1.5" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Dipublikasi</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-full sm:w-[180px] h-9 border-cool-gray-200">
                  <SelectValue placeholder="Mata Pelajaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Mapel</SelectItem>
                  {SUBJECTS.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Exam Table */}
        <Card className="border-cool-gray-200 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-cool-gray-50 hover:bg-cool-gray-50">
                  <TableHead className="text-xs font-semibold text-charcoal-light">Ujian</TableHead>
                  <TableHead className="text-xs font-semibold text-charcoal-light">Mapel</TableHead>
                  <TableHead className="text-xs font-semibold text-charcoal-light">Kelas</TableHead>
                  <TableHead className="text-xs font-semibold text-charcoal-light">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-charcoal-light">Soal</TableHead>
                  <TableHead className="text-xs font-semibold text-charcoal-light">Durasi</TableHead>
                  <TableHead className="text-xs font-semibold text-charcoal-light text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-charcoal-light">
                      Tidak ada ujian ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExams.map(exam => {
                    const statusConfig = STATUS_CONFIG[exam.status];
                    return (
                      <TableRow
                        key={exam.id}
                        className="cursor-pointer hover:bg-cool-gray-50"
                        onClick={() => handleViewExam(exam)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-blue/10 flex items-center justify-center shrink-0">
                              <FontAwesomeIcon icon={faFileAlt} className="text-slate-blue text-sm" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-charcoal truncate max-w-[250px]">{exam.title}</div>
                              <div className="text-[10px] text-charcoal-light">
                                {new Date(exam.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-charcoal-light">{getSubjectName(exam.subjectId)}</TableCell>
                        <TableCell className="text-sm text-charcoal-light">{getClassName(exam.classGradeId)}</TableCell>
                        <TableCell>
                          <Badge className={`border-0 text-[10px] ${statusConfig.bg} ${statusConfig.text} ${statusConfig.pulse ? 'animate-pulse' : ''}`}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-charcoal-light">{exam.questions.length}</TableCell>
                        <TableCell className="text-sm text-charcoal-light">{exam.durationMinutes} mnt</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-charcoal-light hover:text-slate-blue" onClick={() => handleEditExam(exam)}>
                              <FontAwesomeIcon icon={faEdit} className="text-xs" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-charcoal-light hover:text-slate-blue" onClick={() => handleDuplicateExam(exam)}>
                              <FontAwesomeIcon icon={faCopy} className="text-xs" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-charcoal-light hover:text-coral" onClick={() => { setSelectedExam(exam); setShowDeleteDialog(true); }}>
                              <FontAwesomeIcon icon={faTrash} className="text-xs" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card layout */}
          <div className="md:hidden divide-y divide-cool-gray-100">
            {filteredExams.length === 0 ? (
              <div className="py-8 text-center text-charcoal-light text-sm">Tidak ada ujian ditemukan.</div>
            ) : (
              filteredExams.map(exam => {
                const statusConfig = STATUS_CONFIG[exam.status];
                return (
                  <div
                    key={exam.id}
                    className="p-4 cursor-pointer hover:bg-cool-gray-50 transition-colors"
                    onClick={() => handleViewExam(exam)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-charcoal line-clamp-1">{exam.title}</div>
                        <div className="text-xs text-charcoal-light mt-0.5">
                          {getSubjectName(exam.subjectId)} - {getClassName(exam.classGradeId)}
                        </div>
                      </div>
                      <Badge className={`border-0 text-[10px] shrink-0 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.pulse ? 'animate-pulse' : ''}`}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-charcoal-light">
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faQuestionCircle} className="text-[10px]" />
                        {exam.questions.length} soal
                      </span>
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                        {exam.durationMinutes} mnt
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hapus Ujian?</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus ujian &quot;{selectedExam?.title}&quot;? Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Batal</Button>
              <Button variant="destructive" onClick={() => setShowDeleteDialog(false)}>
                <FontAwesomeIcon icon={faTrash} className="text-xs mr-1.5" />
                Hapus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ============================================================
  // CREATE / EDIT EXAM VIEW
  // ============================================================
  if (viewMode === 'create') {
    return (
      <div className="space-y-6 page-enter max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBackToList} className="shrink-0">
            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-charcoal">
              {selectedExam ? 'Edit Ujian' : 'Buat Ujian Baru'}
            </h2>
            <p className="text-sm text-charcoal-light">Isi informasi ujian dan pilih soal</p>
          </div>
        </div>

        {/* Form */}
        <Card className="border-cool-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-charcoal flex items-center gap-2">
              <FontAwesomeIcon icon={faBookOpen} className="text-slate-blue text-sm" />
              Informasi Ujian
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="title" className="text-sm font-medium text-charcoal mb-1.5 block">Judul Ujian</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Contoh: Ujian Tengah Semester - Matematika X"
                  className="border-cool-gray-200"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="description" className="text-sm font-medium text-charcoal mb-1.5 block">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Deskripsi singkat tentang ujian ini..."
                  className="border-cool-gray-200 min-h-[80px] resize-y"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-charcoal mb-1.5 block">Mata Pelajaran</Label>
                <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
                  <SelectTrigger className="border-cool-gray-200">
                    <SelectValue placeholder="Pilih mata pelajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-charcoal mb-1.5 block">Kelas</Label>
                <Select value={form.classGradeId} onValueChange={(v) => setForm({ ...form, classGradeId: v })}>
                  <SelectTrigger className="border-cool-gray-200">
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_GRADES.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="duration" className="text-sm font-medium text-charcoal mb-1.5 block">Durasi (menit)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 0 })}
                  className="border-cool-gray-200"
                  min={1}
                />
              </div>
              <div>
                <Label htmlFor="passingScore" className="text-sm font-medium text-charcoal mb-1.5 block">KKM (%)</Label>
                <Input
                  id="passingScore"
                  type="number"
                  value={form.passingScore}
                  onChange={(e) => setForm({ ...form, passingScore: parseInt(e.target.value) || 0 })}
                  className="border-cool-gray-200"
                  min={0}
                  max={100}
                />
              </div>
              <div>
                <Label htmlFor="token" className="text-sm font-medium text-charcoal mb-1.5 block">Token Ujian</Label>
                <Input
                  id="token"
                  value={form.token}
                  onChange={(e) => setForm({ ...form, token: e.target.value.toUpperCase() })}
                  className="border-cool-gray-200 uppercase"
                  placeholder="Contoh: MAT123"
                  maxLength={6}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Selection */}
        <Card className="border-cool-gray-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-charcoal flex items-center gap-2">
                <FontAwesomeIcon icon={faQuestionCircle} className="text-slate-blue text-sm" />
                Pilih Soal
              </CardTitle>
              <div className="flex items-center gap-3 text-sm">
                <Badge variant="outline" className="border-slate-blue/30 text-slate-blue">
                  {form.selectedQuestionIds.length} soal
                </Badge>
                <Badge variant="outline" className="border-slate-blue/30 text-slate-blue">
                  {selectedTotalPoints} poin
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {filteredAvailable.map(q => {
                const isSelected = form.selectedQuestionIds.includes(q.id);
                return (
                  <div
                    key={q.id}
                    onClick={() => handleToggleQuestion(q.id)}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'border-slate-blue/30 bg-slate-blue/5'
                        : 'border-cool-gray-200 hover:border-cool-gray-300 hover:bg-cool-gray-50'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      className="mt-0.5 shrink-0 w-4 h-4 cursor-pointer pointer-events-none accent-slate-blue"
                      checked={isSelected}
                      readOnly
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FontAwesomeIcon
                          icon={TYPE_ICONS[q.type]}
                          className="text-xs text-slate-blue shrink-0"
                        />
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-cool-gray-200">
                          {QUESTION_TYPE_LABELS[q.type]}
                        </Badge>
                        <Badge className={`border-0 text-[9px] px-1.5 py-0 h-4 ${DIFFICULTY_COLORS[q.difficulty]}`}>
                          {DIFFICULTY_LABELS[q.difficulty]}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-cool-gray-200 text-charcoal-light">
                          {q.points} poin
                        </Badge>
                      </div>
                      <p className="text-sm text-charcoal line-clamp-2">{q.text}</p>
                    </div>
                  </div>
                );
              })}
              {filteredAvailable.length === 0 && (
                <div className="py-8 text-center text-charcoal-light text-sm">
                  {form.subjectId ? 'Tidak ada soal untuk mata pelajaran ini.' : 'Pilih mata pelajaran untuk melihat soal.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={handleBackToList} className="border-cool-gray-200">
            Batal
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            className="border-slate-blue/30 text-slate-blue hover:bg-slate-blue/5"
            disabled={!form.title.trim()}
          >
            <FontAwesomeIcon icon={faSave} className="text-xs mr-1.5" />
            Simpan Draft
          </Button>
          <Button
            onClick={handlePublish}
            className="bg-gradient-to-r from-[#5B6ABF] to-[#4554A0] hover:from-[#4F5AB0] hover:to-[#3D4A90] text-white"
            disabled={!form.title.trim() || !form.token.trim() || form.selectedQuestionIds.length === 0}
          >
            <FontAwesomeIcon icon={faPaperPlane} className="text-xs mr-1.5" />
            Publikasikan
          </Button>
        </div>
      </div>
    );
  }

  // ============================================================
  // EXAM DETAIL VIEW
  // ============================================================
  if (viewMode === 'detail' && selectedExam) {
    const statusConfig = STATUS_CONFIG[selectedExam.status];
    return (
      <div className="space-y-6 page-enter max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBackToList} className="shrink-0">
            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-charcoal truncate">{selectedExam.title}</h2>
            <p className="text-sm text-charcoal-light">{selectedExam.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-slate-blue/10 text-slate-blue border-slate-blue/30 font-mono">
              Token: {selectedExam.token}
            </Badge>
            <Badge className={`border-0 text-xs ${statusConfig.bg} ${statusConfig.text} ${statusConfig.pulse ? 'animate-pulse' : ''}`}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-cool-gray-200">
            <CardContent className="p-4 text-center">
              <FontAwesomeIcon icon={faBookOpen} className="text-slate-blue text-lg mb-2" />
              <div className="text-sm font-semibold text-charcoal">{getSubjectName(selectedExam.subjectId)}</div>
              <div className="text-[10px] text-charcoal-light uppercase tracking-wider">Mata Pelajaran</div>
            </CardContent>
          </Card>
          <Card className="border-cool-gray-200">
            <CardContent className="p-4 text-center">
              <FontAwesomeIcon icon={faUsers} className="text-slate-blue text-lg mb-2" />
              <div className="text-sm font-semibold text-charcoal">{getClassName(selectedExam.classGradeId)}</div>
              <div className="text-[10px] text-charcoal-light uppercase tracking-wider">Kelas</div>
            </CardContent>
          </Card>
          <Card className="border-cool-gray-200">
            <CardContent className="p-4 text-center">
              <FontAwesomeIcon icon={faClock} className="text-slate-blue text-lg mb-2" />
              <div className="text-sm font-semibold text-charcoal">{selectedExam.durationMinutes} menit</div>
              <div className="text-[10px] text-charcoal-light uppercase tracking-wider">Durasi</div>
            </CardContent>
          </Card>
          <Card className="border-cool-gray-200">
            <CardContent className="p-4 text-center">
              <FontAwesomeIcon icon={faStar} className="text-slate-blue text-lg mb-2" />
              <div className="text-sm font-semibold text-charcoal">KKM {selectedExam.passingScore}%</div>
              <div className="text-[10px] text-charcoal-light uppercase tracking-wider">Nilai Minimum</div>
            </CardContent>
          </Card>
        </div>

        {/* Questions List */}
        <Card className="border-cool-gray-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-charcoal flex items-center gap-2">
                <FontAwesomeIcon icon={faQuestionCircle} className="text-slate-blue text-sm" />
                Daftar Soal ({selectedExam.questions.length})
              </CardTitle>
              <Badge variant="outline" className="border-slate-blue/30 text-slate-blue">
                Total: {selectedExam.totalPoints} poin
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedExam.questions.map((eq, index) => {
                const q = eq.question;
                return (
                  <div
                    key={eq.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-cool-gray-200 bg-cool-gray-50/50"
                  >
                    {/* Drag handle + number */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <FontAwesomeIcon icon={faGripVertical} className="text-cool-gray-300 text-xs" />
                      <span className="w-7 h-7 rounded-md bg-slate-blue/10 text-slate-blue text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FontAwesomeIcon
                          icon={TYPE_ICONS[q.type]}
                          className="text-xs text-slate-blue shrink-0"
                        />
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-cool-gray-200">
                          {QUESTION_TYPE_LABELS[q.type]}
                        </Badge>
                        <Badge className={`border-0 text-[9px] px-1.5 py-0 h-4 ${DIFFICULTY_COLORS[q.difficulty]}`}>
                          {DIFFICULTY_LABELS[q.difficulty]}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-cool-gray-200 text-charcoal-light">
                          {eq.points} poin
                        </Badge>
                      </div>
                      <p className="text-sm text-charcoal line-clamp-2">{q.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => handleEditExam(selectedExam)}
            className="border-slate-blue/30 text-slate-blue hover:bg-slate-blue/5"
          >
            <FontAwesomeIcon icon={faEdit} className="text-xs mr-1.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => handleDuplicateExam(selectedExam)}
            className="border-cool-gray-200 text-charcoal-light hover:text-charcoal"
          >
            <FontAwesomeIcon icon={faCopy} className="text-xs mr-1.5" />
            Duplikat
          </Button>
          <Button
            variant="outline"
            onClick={() => { setShowDeleteDialog(true); }}
            className="border-coral/30 text-coral hover:bg-coral/5"
          >
            <FontAwesomeIcon icon={faTrash} className="text-xs mr-1.5" />
            Hapus
          </Button>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hapus Ujian?</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus ujian &quot;{selectedExam?.title}&quot;? Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Batal</Button>
              <Button variant="destructive" onClick={() => { setShowDeleteDialog(false); handleBackToList(); }}>
                <FontAwesomeIcon icon={faTrash} className="text-xs mr-1.5" />
                Hapus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
}

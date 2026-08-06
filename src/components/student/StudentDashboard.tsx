'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileAlt,
  faClock,
  faStar,
  faPlay,
  faHistory,
  faUserGraduate,
  faBell,
  faBellSlash,
  faChevronRight,
  faTrophy,
  faChartLine,
  faClipboardList,
  faFlask,
  faBook,
  faGlobe,
  faCalculator,
  faAtom,
  faLandmark,
  faLanguage,
  faEye,
  faSortAmountDown,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { Input } from '@/components/ui/input';
import { MOCK_STUDENTS, SUBJECTS, CLASS_GRADES } from '@/lib/mock-data';
import { getActiveExams, getExams } from '@/app/actions/exam';
import { getSessions, createSession } from '@/app/actions/session';
import { useExamStore } from '@/lib/store';
import type { Exam } from '@/lib/types';

function getSubjectName(subjectId: string): string {
  return SUBJECTS.find(s => s.id === subjectId)?.name ?? '';
}

function getClassName(classGradeId: string): string {
  return CLASS_GRADES.find(c => c.id === classGradeId)?.name ?? '';
}

const SUBJECT_ICONS: Record<string, typeof faCalculator> = {
  s1: faCalculator,
  s2: faBook,
  s3: faAtom,
  s4: faLandmark,
  s5: faLanguage,
};

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  s1: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-400' },
  s2: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-400' },
  s3: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-400' },
  s4: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-400' },
  s5: { bg: 'bg-teal-100', text: 'text-teal-600', border: 'border-teal-400' },
};

function getIndonesianDate(): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const now = new Date();
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

// Score Ring Component
function ScoreRing({ score, total, size = 56 }: { score: number; total: number; size?: number }) {
  const percentage = total > 0 ? (score / total) * 100 : 0;
  const passed = percentage >= 60;
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={passed ? '#00B894' : '#FF6B6B'}
          strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-bold ${passed ? 'text-emerald-600' : 'text-coral'}`}>
          {score}
        </span>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { setView, setStudentSession } = useExamStore();
  const student = MOCK_STUDENTS[0] || {
    id: 'guest',
    name: 'Siswa Tamu',
    email: 'siswa@sekolah.id',
    classGrade: 'Kelas X',
    classGradeId: 'c4'
  };
  const [notifyExams, setNotifyExams] = useState<Set<string>>(new Set());
  const [historySort, setHistorySort] = useState('latest');

  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [examToStart, setExamToStart] = useState<Exam | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState(false);

  const [activeExams, setActiveExams] = useState<any[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [mockCompletedExams, setMockCompletedExams] = useState<any[]>([]);
  
  useEffect(() => {
    async function loadData() {
      const examsRes = await getExams();
      if (examsRes.success) {
        setActiveExams(examsRes.data?.filter((e: any) => e.status === 'active') || []);
        setUpcomingExams(examsRes.data?.filter((e: any) => e.status === 'published') || []);
      }
      
      const sessionsRes = await getSessions();
      if (sessionsRes.success) {
        const completed = (sessionsRes.data || [])
          .filter((s: any) => s.status === 'completed' || s.status === 'auto_submitted')
          .map((s: any) => ({
            id: s.id,
            title: s.exam?.title || 'Ujian Selesai',
            subjectName: getSubjectName(s.exam?.subjectId || 's1'),
            subjectId: s.exam?.subjectId || 's1',
            dateTaken: s.endTime || s.startTime,
            score: s.score,
            totalPoints: 100, // mock total
            passed: s.score >= (s.exam?.passingScore || 70),
          }));
        setMockCompletedExams(completed);
      }
    }
    loadData();
  }, []);

  

  const sortedHistory = [...mockCompletedExams].sort((a, b) => {
    if (historySort === 'highest') return b.score / b.totalPoints - a.score / a.totalPoints;
    if (historySort === 'subject') return a.subjectName.localeCompare(b.subjectName);
    return new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime();
  });

  const avgScore = mockCompletedExams.length > 0
    ? Math.round(mockCompletedExams.reduce((sum, e) => sum + (e.score / e.totalPoints) * 100, 0) / mockCompletedExams.length)
    : 0;

  const toggleNotify = (examId: string) => {
    const next = new Set(notifyExams);
    if (next.has(examId)) next.delete(examId);
    else next.add(examId);
    setNotifyExams(next);
  };

  const promptToken = (exam: Exam) => {
    setExamToStart(exam);
    setTokenInput('');
    setTokenError(false);
    setTokenDialogOpen(true);
  };

  const handleStartExam = () => {
    if (!examToStart) return;
    if (tokenInput.trim().toUpperCase() !== examToStart.token.toUpperCase()) {
      setTokenError(true);
      return;
    }
    const exam = examToStart;
    setTokenDialogOpen(false);

    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(console.error);
    }

    const newSession = {
      id: `session-${Date.now()}`,
      studentId: student.id,
      examId: exam.id,
      status: 'active',
      antiCheatStrikes: 0,
      startTime: new Date().toISOString(),
      currentQuestionIndex: 0,
      answers: [],
      score: 0
    };
    createSession(newSession).then(res => {
      if(res.success) {
        setStudentSession({ ...newSession, student } as any);
      }
    });
    setView('student_exam');
  };

  return (
    <div className="min-h-screen bg-cool-gray page-enter">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Welcome Section */}
        <Card className="mb-8 border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#5B6ABF] to-[#4554A0] p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                {/* Student initials avatar - glassmorphism */}
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shrink-0 border border-white/30">
                  <span className="text-2xl font-bold text-[#5B6ABF]">{getInitials(student.name)}</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Selamat Datang, {student.name.split(' ')[0]}
                  </h1>
                  <p className="text-white/80 mt-1 text-sm">
                    {student.classGrade} | NIS: {student.id.toUpperCase()}
                  </p>
                  <p className="text-white/60 text-xs mt-0.5">{getIndonesianDate()}</p>
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center mx-auto mb-1.5">
                    <FontAwesomeIcon icon={faClipboardList} className="text-white/90 text-sm" />
                  </div>
                  <div className="text-xl font-bold text-white">{mockCompletedExams.length}</div>
                  <div className="text-[10px] text-white/60 uppercase tracking-wider">Total Ujian</div>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center mx-auto mb-1.5">
                    <FontAwesomeIcon icon={faChartLine} className="text-white/90 text-sm" />
                  </div>
                  <div className="text-xl font-bold text-white">{avgScore}</div>
                  <div className="text-[10px] text-white/60 uppercase tracking-wider">Rata-rata</div>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center mx-auto mb-1.5">
                    <FontAwesomeIcon icon={faTrophy} className="text-white/90 text-sm" />
                  </div>
                  <div className="text-xl font-bold text-white">3</div>
                  <div className="text-[10px] text-white/60 uppercase tracking-wider">Peringkat</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Active Exams Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-slate-blue rounded-full" />
            <h2 className="text-lg font-semibold text-charcoal">Ujian Aktif</h2>
            <Badge className="bg-slate-blue text-white border-0 ml-2">{activeExams.length}</Badge>
          </div>

          {activeExams.length === 0 ? (
            <Card className="border-dashed border-cool-gray-200">
              <CardContent className="p-8 text-center text-charcoal-light">
                Tidak ada ujian aktif saat ini.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeExams.map(exam => {
                const subjectIcon = SUBJECT_ICONS[exam.subjectId] || faFileAlt;
                const subjectColor = SUBJECT_COLORS[exam.subjectId] || SUBJECT_COLORS.s1;
                return (
                  <Card
                    key={exam.id}
                    className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-cool-gray-200 border-l-4 border-l-slate-blue animate-[pulse-border_3s_ease-in-out_infinite]"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-11 h-11 rounded-xl ${subjectColor.bg} flex items-center justify-center shrink-0`}>
                          <FontAwesomeIcon icon={subjectIcon} className={subjectColor.text} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-semibold text-charcoal leading-tight line-clamp-2">
                            {exam.title}
                          </CardTitle>
                          <CardDescription className="text-xs text-charcoal-light mt-1">
                            {getSubjectName(exam.subjectId)} - {getClassName(exam.classGradeId)}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-charcoal-light">
                          <FontAwesomeIcon icon={faClock} className="text-slate-blue w-3.5" />
                          <span>{exam.durationMinutes} menit</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-charcoal-light">
                          <FontAwesomeIcon icon={faFileAlt} className="text-slate-blue w-3.5" />
                          <span>{exam.questions.length} soal</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-charcoal-light">
                          <FontAwesomeIcon icon={faStar} className="text-slate-blue w-3.5" />
                          <span>KKM: {exam.passingScore}</span>
                        </div>
                      </div>
                      <Button
                        className="w-full bg-gradient-to-r from-[#5B6ABF] to-[#4554A0] hover:from-[#4F5AB0] hover:to-[#3D4A90] text-white transition-all h-10 font-medium"
                        onClick={() => promptToken(exam)}
                      >
                        <FontAwesomeIcon icon={faPlay} className="text-xs mr-1.5" />
                        Mulai Ujian
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Upcoming Exams Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-cool-gray-400 rounded-full" />
            <h2 className="text-lg font-semibold text-charcoal">Ujian Mendatang</h2>
            <Badge variant="secondary" className="ml-2">{upcomingExams.length}</Badge>
          </div>

          {upcomingExams.length === 0 ? (
            <Card className="border-dashed border-cool-gray-200">
              <CardContent className="p-8 text-center text-charcoal-light">
                Tidak ada ujian mendatang.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingExams.map(exam => {
                const subjectIcon = SUBJECT_ICONS[exam.subjectId] || faFileAlt;
                const isNotified = notifyExams.has(exam.id);
                return (
                  <Card
                    key={exam.id}
                    className="border-cool-gray-200 bg-cool-gray-100/60"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-cool-gray-200 flex items-center justify-center shrink-0">
                          <FontAwesomeIcon icon={subjectIcon} className="text-cool-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-semibold text-charcoal-light leading-tight line-clamp-2">
                            {exam.title}
                          </CardTitle>
                          <CardDescription className="text-xs text-cool-gray-400 mt-1">
                            {getSubjectName(exam.subjectId)}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-cool-gray-400">
                          <FontAwesomeIcon icon={faClock} className="w-3.5" />
                          <span>{exam.durationMinutes} menit</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-cool-gray-400">
                          <FontAwesomeIcon icon={faFileAlt} className="w-3.5" />
                          <span>{exam.questions.length} soal</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 py-2 px-4 rounded-lg bg-cool-gray-200 text-center text-sm text-cool-gray-400 font-medium">
                          Belum Dimulai
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className={`shrink-0 h-9 w-9 ${
                            isNotified
                              ? 'border-slate-blue/30 bg-slate-blue/10 text-slate-blue'
                              : 'border-cool-gray-300 text-cool-gray-400 hover:text-slate-blue hover:border-slate-blue/30'
                          }`}
                          onClick={() => toggleNotify(exam.id)}
                          title={isNotified ? 'Matikan notifikasi' : 'Aktifkan notifikasi'}
                        >
                          <FontAwesomeIcon icon={isNotified ? faBell : faBellSlash} className="text-sm" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Exam History Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-charcoal-light rounded-full" />
              <h2 className="text-lg font-semibold text-charcoal">Riwayat Ujian</h2>
              <Badge variant="outline" className="ml-2">{mockCompletedExams.length}</Badge>
            </div>
            <Select value={historySort} onValueChange={setHistorySort}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <FontAwesomeIcon icon={faSortAmountDown} className="text-cool-gray-400 mr-1.5 text-[10px]" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Terbaru</SelectItem>
                <SelectItem value="highest">Nilai Tertinggi</SelectItem>
                <SelectItem value="subject">Mata Pelajaran</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mockCompletedExams.length === 0 ? (
            <Card className="border-dashed border-cool-gray-200">
              <CardContent className="p-8 text-center text-charcoal-light">
                Belum ada riwayat ujian.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedHistory.map(exam => (
                <Card
                  key={exam.id}
                  className="hover:shadow-md transition-all duration-200 border-cool-gray-200"
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start gap-4">
                      <ScoreRing score={exam.score} total={exam.totalPoints} size={56} />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-charcoal leading-tight line-clamp-2 mb-1">
                          {exam.title}
                        </h3>
                        <p className="text-xs text-charcoal-light mb-2">{exam.subjectName}</p>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`border-0 text-[10px] px-2 py-0 h-5 ${
                              exam.passed
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-coral/10 text-coral'
                            }`}
                          >
                            {exam.passed ? 'Lulus' : 'Tidak Lulus'}
                          </Badge>
                          <span className="text-[10px] text-cool-gray-400">
                            {new Date(exam.dateTaken).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-cool-gray-100 flex items-center justify-between">
                      <span className="text-xs text-charcoal-light">
                        {exam.score}/{exam.totalPoints} poin
                      </span>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-blue hover:text-slate-blue-dark">
                        Lihat Detail
                        <FontAwesomeIcon icon={faChevronRight} className="text-[10px] ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Masukkan Token Ujian</DialogTitle>
            <DialogDescription>
              Silakan masukkan token unik untuk memulai {examToStart?.title}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="Contoh: 12345" 
              value={tokenInput} 
              onChange={e => {
                setTokenInput(e.target.value);
                setTokenError(false);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleStartExam();
              }}
            />
            {tokenError && (
              <p className="text-sm text-red-500 mt-2">Token salah. Silakan coba lagi.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTokenDialogOpen(false)}>Batal</Button>
            <Button className="bg-slate-blue text-white" onClick={handleStartExam}>Mulai Ujian</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

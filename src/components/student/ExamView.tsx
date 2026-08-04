'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faWarning,
  faExclamationTriangle,
  faChevronLeft,
  faChevronRight,
  faFlag,
  faArrowLeft,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useExamStore } from '@/lib/store';
import { MOCK_EXAMS } from '@/lib/mock-data';
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/lib/types';
import type { StudentAnswer } from '@/lib/types';
import QuestionRenderer from './QuestionRenderer';
import AntiCheatOverlay from './AntiCheatOverlay';

export default function ExamView() {
  const {
    studentSession,
    setView,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    studentAnswers,
    setStudentAnswer,
    antiCheatStrikes,
    resetAntiCheat,
    setStudentSession,
  } = useExamStore();

  const exam = MOCK_EXAMS[0];
  const [shuffledQuestions, setShuffledQuestions] = useState<typeof exam.questions[0]['question'][]>([]);
  const currentQuestion = shuffledQuestions[currentQuestionIndex];

  // Initialize shuffled questions on mount
  useEffect(() => {
    const rawQuestions = exam.questions.map(eq => eq.question);
    const shuffled = [...rawQuestions].sort(() => Math.random() - 0.5);
    setShuffledQuestions(shuffled);
  }, [exam]);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(exam.durationMinutes * 60);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalQuestions = shuffledQuestions.length;
  const answeredCount = Array.from(studentAnswers.keys()).filter(qId =>
    shuffledQuestions.some(q => q.id === qId)
  ).length;

  const videoRef = useRef<HTMLVideoElement>(null);

  // Webcam Proctoring
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => console.error("Webcam access denied", err));
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const timePercentage = (timeLeft / (exam.durationMinutes * 60)) * 100;
  const isTimeWarning = timeLeft <= 300 && timeLeft > 60;
  const isTimeCritical = timeLeft <= 60;

  // Submit handler
  const handleSubmit = useCallback(() => {
    if (isSubmitted) return;
    setIsSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    }

    if (studentSession) {
      setStudentSession({
        ...studentSession,
        status: antiCheatStrikes >= 3 ? 'auto_submitted' : 'completed',
        endTime: new Date().toISOString(),
        answers: Array.from(studentAnswers.values()),
        score: Math.floor(Math.random() * 40) + 60,
      });
    }

    setTimeout(() => {
      setView('student_results');
    }, 500);
  }, [isSubmitted, studentSession, antiCheatStrikes, studentAnswers, setStudentSession, setView]);

  // Timer logic
  useEffect(() => {
    if (isSubmitted) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(() => handleSubmit(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSubmitted, handleSubmit]);

  // Auto-submit after 3 strikes
  useEffect(() => {
    if (antiCheatStrikes >= 3 && !isSubmitted) {
      const timeout = setTimeout(() => handleSubmit(), 100);
      return () => clearTimeout(timeout);
    }
  }, [antiCheatStrikes, isSubmitted, handleSubmit]);

  const handleAnswer = (answer: StudentAnswer) => {
    setStudentAnswer(answer.questionId, answer);
  };

  const getCurrentAnswer = (): StudentAnswer | undefined => {
    if (!currentQuestion) return undefined;
    return studentAnswers.get(currentQuestion.id);
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentQuestionIndex(index);
    }
  };

  const toggleFlag = (questionId: string) => {
    const next = new Set(flaggedQuestions);
    if (next.has(questionId)) next.delete(questionId);
    else next.add(questionId);
    setFlaggedQuestions(next);
  };

  // Estimated score range for submit dialog
  const minScore = Math.round((answeredCount / totalQuestions) * 30);
  const maxScore = Math.round((answeredCount / totalQuestions) * 100);

  if (!currentQuestion) return null;

  // Question navigator item
  const renderNavCircle = (q: NonNullable<typeof currentQuestion>, index: number, isMobile = false) => {
    const isAnswered = studentAnswers.has(q.id);
    const isCurrent = index === currentQuestionIndex;
    const isFlagged = flaggedQuestions.has(q.id);

    return (
      <button
        key={q.id}
        onClick={() => goToQuestion(index)}
        title={`Soal ${index + 1}${isFlagged ? ' (Ditandai)' : ''}`}
        className={`rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all duration-200 relative ${
          isMobile ? 'w-8 h-8' : 'w-10 h-10'
        } ${
          isCurrent
            ? 'bg-slate-blue text-white shadow-md scale-110'
            : isFlagged
            ? 'bg-amber-100 text-amber-600 border-2 border-amber-300'
            : isAnswered
            ? 'bg-slate-blue/20 text-slate-blue border border-slate-blue/30'
            : 'bg-cool-gray-100 text-cool-gray-400 border border-cool-gray-200'
        }`}
      >
        {index + 1}
        {isFlagged && !isCurrent && (
          <FontAwesomeIcon
            icon={faFlag}
            className="absolute -top-1 -right-1 text-[8px] text-amber-500"
          />
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-cool-gray flex flex-col relative">
      {/* Anti-Cheat Overlay */}
      <AntiCheatOverlay />

      {/* Webcam Preview */}
      <div className="fixed bottom-4 right-4 z-50 w-32 h-24 bg-black rounded-lg overflow-hidden border-2 border-slate-blue shadow-lg">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      </div>

      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-cool-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Back button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetAntiCheat();
                setView('student_dashboard');
              }}
              className="border-cool-gray-200 text-charcoal-light hover:text-charcoal shrink-0 h-8 text-xs"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-[10px] mr-1" />
              Kembali
            </Button>

            {/* Exam Title */}
            <h1 className="flex-1 text-sm font-semibold text-charcoal truncate text-center min-w-0">
              {exam.title}
            </h1>

            {/* Timer + Strikes */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Timer pill */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-mono font-bold ${
                isTimeCritical
                  ? 'bg-coral text-white animate-pulse'
                  : isTimeWarning
                  ? 'bg-coral/10 text-coral'
                  : 'bg-cool-gray-100 text-charcoal'
              }`}>
                <FontAwesomeIcon
                  icon={isTimeCritical || isTimeWarning ? faExclamationTriangle : faClock}
                  className={`text-xs ${!isTimeCritical && !isTimeWarning ? 'text-slate-blue' : ''}`}
                />
                <span>{formatTime(timeLeft)}</span>
              </div>

              {/* Strike counter */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                      i < antiCheatStrikes
                        ? 'bg-coral text-white'
                        : 'bg-cool-gray-100 text-cool-gray-300'
                    }`}
                  >
                    <FontAwesomeIcon icon={faWarning} className="text-[9px]" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Time Progress */}
          <div className="mt-2">
            <Progress
              value={timePercentage}
              className={`h-1 ${
                isTimeCritical
                  ? '[&>div]:bg-coral'
                  : isTimeWarning
                  ? '[&>div]:bg-coral'
                  : '[&>div]:bg-slate-blue'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex max-w-5xl mx-auto w-full">
        {/* Question Navigation - Desktop: Vertical strip on left */}
        <div className="hidden md:flex flex-col items-center gap-2 p-4 w-[60px] shrink-0">
          <span className="text-[10px] font-medium text-charcoal-light mb-1 uppercase tracking-wider">Soal</span>
          {shuffledQuestions.map((q, index) => renderNavCircle(q, index))}
        </div>

        {/* Question Content Area */}
        <div className="flex-1 py-6 px-4 sm:px-6">
          {/* Mobile Question Navigation - Horizontal scrollable */}
          <div className="md:hidden flex items-center gap-1.5 mb-4 overflow-x-auto pb-2 custom-scrollbar">
            {shuffledQuestions.map((q, index) => renderNavCircle(q, index, true))}
          </div>

          {/* Question Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-charcoal-light">
                Soal {currentQuestionIndex + 1} dari {totalQuestions}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] border-slate-blue/30 text-slate-blue px-1.5 py-0 h-5"
              >
                {QUESTION_TYPE_LABELS[currentQuestion.type]}
              </Badge>
              <Badge className={`border-0 text-[10px] px-1.5 py-0 h-5 ${DIFFICULTY_COLORS[currentQuestion.difficulty]}`}>
                {DIFFICULTY_LABELS[currentQuestion.difficulty]}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] text-charcoal-light px-1.5 py-0 h-5">
                {exam.questions[currentQuestionIndex]?.points ?? currentQuestion.points} poin
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 ${
                  flaggedQuestions.has(currentQuestion.id)
                    ? 'text-amber-500 hover:text-amber-600'
                    : 'text-cool-gray-300 hover:text-amber-500'
                }`}
                onClick={() => toggleFlag(currentQuestion.id)}
                title={flaggedQuestions.has(currentQuestion.id) ? 'Hapus tanda' : 'Tandai untuk ditinjau'}
              >
                <FontAwesomeIcon icon={faFlag} className="text-xs" />
              </Button>
            </div>
          </div>

          {/* Question Card */}
          <Card className="border-cool-gray-200 shadow-sm mb-4">
            <CardContent className="p-4 sm:p-6">
              <QuestionRenderer
                question={currentQuestion}
                answer={getCurrentAnswer()}
                onAnswer={handleAnswer}
              />
            </CardContent>
          </Card>

          {/* Bottom Navigation Bar */}
          <div className="bg-white rounded-xl border border-cool-gray-200 shadow-sm p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              {/* Previous Button */}
              <Button
                variant="outline"
                onClick={() => goToQuestion(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0}
                className="border-cool-gray-200 h-9"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="text-xs mr-1.5" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </Button>

              {/* Center: Progress */}
              <div className="flex flex-col items-center gap-1 flex-1 max-w-[200px]">
                <div className="text-xs text-charcoal-light font-medium">
                  Soal {currentQuestionIndex + 1}/{totalQuestions}
                </div>
                <Progress
                  value={(answeredCount / totalQuestions) * 100}
                  className="h-1.5 w-full [&>div]:bg-slate-blue"
                />
                <div className="flex items-center gap-1 text-[10px] text-charcoal-light">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-500 text-[8px]" />
                  {answeredCount}/{totalQuestions} dijawab
                </div>
              </div>

              {/* Next / Submit Button */}
              {currentQuestionIndex < totalQuestions - 1 ? (
                <Button
                  onClick={() => goToQuestion(currentQuestionIndex + 1)}
                  className="bg-slate-blue hover:bg-slate-blue-dark text-white h-9"
                >
                  <span className="hidden sm:inline">Selanjutnya</span>
                  <FontAwesomeIcon icon={faChevronRight} className="text-xs ml-1.5" />
                </Button>
              ) : (
                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  className="bg-gradient-to-r from-[#5B6ABF] to-[#4554A0] hover:from-[#4F5AB0] hover:to-[#3D4A90] text-white h-9"
                >
                  Selesai
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-charcoal">Kumpulkan Ujian?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-1">
                <p className="text-charcoal-light">
                  Apakah Anda yakin ingin menyelesaikan ujian ini?
                </p>

                {/* Summary card */}
                <div className="bg-cool-gray-100 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-charcoal">Ringkasan:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-charcoal-light">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-500 text-xs" />
                      Dijawab: {answeredCount} soal
                    </div>
                    <div className="flex items-center gap-2 text-charcoal-light">
                      <FontAwesomeIcon icon={faWarning} className="text-cool-gray-400 text-xs" />
                      Belum: {totalQuestions - answeredCount} soal
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-cool-gray-200">
                    <span className="text-charcoal-light">Estimasi rentang nilai</span>
                    <span className="font-semibold text-charcoal">{minScore}% - {maxScore}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-charcoal-light">KKM</span>
                    <span className="font-semibold text-charcoal">{exam.passingScore}%</span>
                  </div>
                </div>

                {/* Warning for unanswered */}
                {totalQuestions - answeredCount > 0 && (
                  <div className="bg-coral/10 border border-coral/20 rounded-lg p-3 flex items-start gap-2">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-coral text-sm mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-coral">Masih ada {totalQuestions - answeredCount} soal yang belum dijawab!</p>
                      <p className="text-xs text-coral/70 mt-0.5">Soal yang tidak dijawab akan mendapatkan nilai 0.</p>
                    </div>
                  </div>
                )}

                {/* Flagged questions warning */}
                {flaggedQuestions.size > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <FontAwesomeIcon icon={faFlag} className="text-amber-500 text-sm mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-700">
                      Anda memiliki {flaggedQuestions.size} soal yang ditandai untuk ditinjau.
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-cool-gray-200">Kembali</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              className="bg-gradient-to-r from-[#5B6ABF] to-[#4554A0] hover:from-[#4F5AB0] hover:to-[#3D4A90] text-white"
            >
              Ya, Kumpulkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

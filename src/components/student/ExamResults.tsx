'use client';

import { useMemo, useState, useEffect } from 'react';
import { getExam } from '@/app/actions/exam';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faTimesCircle,
  faArrowLeft,
  faChevronDown,
  faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useExamStore } from '@/lib/store';
import { SUBJECTS } from '@/lib/mock-data';
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/lib/types';
import type { Question, StudentAnswer } from '@/lib/types';

export default function ExamResults() {
  const { studentSession, studentAnswers, setView, resetAntiCheat } = useExamStore();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (studentSession?.examId) {
        const res = await getExam(studentSession.examId);
        if (res.success && res.data) {
          setExam(res.data);
        }
      }
      setLoading(false);
    }
    load();
  }, [studentSession]);

  // Calculate score and per-question results
  const results = useMemo(() => {
    if (!exam) return { questionResults: [], totalPoints: 0, earnedPoints: 0, scorePercentage: 0, passed: false };
    const questions = exam.questions.map(eq => eq.question);
    const totalPoints = exam.questions.reduce((sum, eq) => sum + eq.points, 0);
    const questionResults = questions.map((question, index) => {
      const answer = studentAnswers.get(question.id);
      const examQuestion = exam.questions[index];
      const points = examQuestion?.points ?? question.points;
      let earned = 0;
      let isCorrect = false;

      if (answer) {
        switch (question.type) {
          case 'pilihan_ganda': {
            const correctOption = question.options?.find(o => o.isCorrect);
            if (correctOption && answer.selectedOptionIds?.includes(correctOption.id)) {
              earned = points;
              isCorrect = true;
            }
            break;
          }
          case 'pilihan_ganda_kompleks': {
            const correctIds = question.options
              ?.filter(o => o.isCorrect)
              .map(o => o.id)
              .sort() ?? [];
            const selectedIds = (answer.selectedOptionIds ?? []).sort();
            if (
              correctIds.length === selectedIds.length &&
              correctIds.every((id, i) => id === selectedIds[i])
            ) {
              earned = points;
              isCorrect = true;
            }
            break;
          }
          case 'menjodohkan': {
            const pairs = question.matchingPairs ?? [];
            const matches = answer.matchingAnswers ?? [];
            const allCorrect = pairs.every(
              pair => matches.find(m => m.premiseId === pair.id)?.responseId === pair.id
            );
            if (allCorrect && matches.length === pairs.length) {
              earned = points;
              isCorrect = true;
            }
            break;
          }
        }
      }

      return {
        question,
        answer,
        points,
        earned,
        isCorrect,
        index,
      };
    });

    const earnedPoints = questionResults.reduce((sum, r) => sum + r.earned, 0);
    const scorePercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = scorePercentage >= exam.passingScore;

    return {
      questionResults,
      totalPoints,
      earnedPoints,
      scorePercentage,
      passed,
    };
  }, [exam, studentAnswers]);

  // Use session score as fallback if available
  const displayScore = studentSession?.score ?? results.scorePercentage;
  const displayPassed = displayScore >= exam.passingScore;

  const getCorrectAnswerText = (question: Question): string => {
    switch (question.type) {
      case 'pilihan_ganda': {
        const correct = question.options?.find(o => o.isCorrect);
        return correct ? `${correct.label}. ${correct.text}` : '-';
      }
      case 'pilihan_ganda_kompleks': {
        const correct = question.options?.filter(o => o.isCorrect) ?? [];
        return correct.map(o => `${o.label}. ${o.text}`).join(', ');
      }
      case 'menjodohkan': {
        return question.matchingPairs
          ?.map(p => `${p.premise} -> ${p.response}`)
          .join('; ') ?? '-';
      }
      default:
        return '-';
    }
  };

  const getStudentAnswerText = (question: Question, answer?: StudentAnswer): string => {
    if (!answer) return 'Tidak dijawab';
    switch (question.type) {
      case 'pilihan_ganda': {
        const selectedId = answer.selectedOptionIds?.[0];
        const selected = question.options?.find(o => o.id === selectedId);
        return selected ? `${selected.label}. ${selected.text}` : 'Tidak dijawab';
      }
      case 'pilihan_ganda_kompleks': {
        const selectedIds = answer.selectedOptionIds ?? [];
        if (selectedIds.length === 0) return 'Tidak dijawab';
        const selected = question.options?.filter(o => selectedIds.includes(o.id)) ?? [];
        return selected.map(o => `${o.label}. ${o.text}`).join(', ');
      }
      case 'menjodohkan': {
        const matches = answer.matchingAnswers ?? [];
        if (matches.length === 0) return 'Tidak dijawab';
        return matches
          .map(m => {
            const premise = question.matchingPairs?.find(p => p.id === m.premiseId);
            const response = question.matchingPairs?.find(p => p.id === m.responseId);
            return `${premise?.premise ?? '?'} -> ${response?.response ?? '?'}`;
          })
          .join('; ');
      }
      default:
        return 'Tidak dijawab';
    }
  };

  const handleBackToDashboard = () => {
    resetAntiCheat();
    setView('student_dashboard');
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-cool-gray">Loading...</div>;
  if (!exam) return <div className="flex h-screen items-center justify-center bg-cool-gray">Ujian tidak ditemukan</div>;

  return (
    <div className="min-h-screen bg-cool-gray page-enter">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Score Card */}
        <Card className="border-0 shadow-lg mb-8 overflow-hidden">
          <div
            className={`p-8 sm:p-10 text-center ${
              displayPassed
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                : 'bg-gradient-to-br from-coral to-coral-dark'
            }`}
          >
            <div className="flex items-center justify-center mb-4">
              <FontAwesomeIcon
                icon={displayPassed ? faCheckCircle : faTimesCircle}
                className="text-5xl text-white/90"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {displayPassed ? 'Selamat!' : 'Belum Lulus'}
            </h1>
            <p className="text-white/80 text-sm sm:text-base mb-6">
              {displayPassed
                ? 'Anda telah lulus ujian ini.'
                : 'Nilai Anda belum mencapai KKM.'}
            </p>

            {/* Score Display */}
            <div className="inline-flex items-baseline gap-1">
              <span className="text-6xl sm:text-7xl font-bold text-white">
                {displayScore}
              </span>
              <span className="text-2xl text-white/70">%</span>
            </div>

            <div className="mt-4 flex items-center justify-center gap-4 text-white/70 text-sm">
              <span>KKM: {exam.passingScore}%</span>
              <span className="text-white/40">|</span>
              <span>
                {results.earnedPoints}/{results.totalPoints} poin
              </span>
            </div>
          </div>

          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-charcoal">{exam.questions.length}</div>
                <div className="text-xs text-charcoal-light">Total Soal</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-charcoal">
                  {results.questionResults.filter(r => r.isCorrect).length}
                </div>
                <div className="text-xs text-charcoal-light">Benar</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-coral">
                  {results.questionResults.filter(r => !r.isCorrect).length}
                </div>
                <div className="text-xs text-charcoal-light">Salah</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Per-Question Review */}
        <Card className="border-cool-gray-200 shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-charcoal">
              Pembahasan Soal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {results.questionResults.map((result, index) => (
                <AccordionItem key={result.question.id} value={result.question.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          result.isCorrect
                            ? 'bg-emerald-100 text-emerald-600'
                            : result.earned > 0
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-coral/10 text-coral'
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={result.isCorrect ? faCheckCircle : faTimesCircle}
                          className="text-sm"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-charcoal line-clamp-1">
                          Soal {index + 1}: {result.question.text}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-5"
                          >
                            {QUESTION_TYPE_LABELS[result.question.type]}
                          </Badge>
                          <span className="text-xs text-charcoal-light">
                            {result.earned}/{result.points} poin
                          </span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pl-11 pb-2">
                      {/* Student Answer */}
                      <div className="bg-cool-gray-100 rounded-lg p-3">
                        <p className="text-xs font-medium text-charcoal-light mb-1">
                          Jawaban Anda:
                        </p>
                        <p className="text-sm text-charcoal">
                          {getStudentAnswerText(result.question, result.answer)}
                        </p>
                      </div>

                      {/* Correct Answer */}
                      <div className="bg-emerald-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-emerald-600 mb-1">
                          Jawaban Benar:
                        </p>
                        <p className="text-sm text-charcoal">
                          {getCorrectAnswerText(result.question)}
                        </p>
                      </div>

                      {/* Points */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-charcoal-light">Poin diperoleh</span>
                        <span className="font-semibold text-charcoal">
                          {result.earned}/{result.points}
                        </span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Back to Dashboard */}
        <div className="text-center">
          <Button
            onClick={handleBackToDashboard}
            size="lg"
            className="bg-slate-blue hover:bg-slate-blue-dark text-white px-8"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

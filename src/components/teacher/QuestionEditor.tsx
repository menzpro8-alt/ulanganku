'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleDot,
  faSquareCheck,
  faRightLeft,
  faFont,
  faAlignLeft,
  faPlus,
  faTrash,
  faSave,
  faTimes,
  faCheck,
  faInfoCircle,
  faCheckDouble,
  faEye,
  faLightbulb,
  faChevronDown,
  faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useExamStore } from '@/lib/store';
import {
  QuestionType,
  Difficulty,
  QuestionOption,
  MatchingPair,
  QUESTION_TYPE_LABELS,
  DIFFICULTY_LABELS,
  QuestionBank,
} from '@/lib/types';
import { SUBJECTS, CLASS_GRADES, TOPICS, MOCK_QUESTIONS, MOCK_QUESTION_BANKS } from '@/lib/mock-data';
import { saveGeneratedQuestions } from '@/app/actions/question';

// ---------------------------------------------------------------------------
// Question type card definitions
// ---------------------------------------------------------------------------
const QUESTION_TYPE_CARDS: {
  type: QuestionType;
  icon: typeof faCircleDot;
  label: string;
  description: string;
}[] = [
  {
    type: 'pilihan_ganda',
    icon: faCircleDot,
    label: 'Pilihan Ganda',
    description: 'Satu jawaban benar',
  },
  {
    type: 'pilihan_ganda_kompleks',
    icon: faSquareCheck,
    label: 'Pilihan Ganda Kompleks',
    description: 'Lebih dari satu jawaban benar',
  },
  {
    type: 'menjodohkan',
    icon: faRightLeft,
    label: 'Menjodohkan',
    description: 'Cocokkan pasangan yang benar',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
let _uid = 0;
const uid = () => `_${++_uid}_${Date.now()}`;

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const DIFFICULTY_LIST: Difficulty[] = ['mudah', 'sedang', 'sulit'];

const DIFFICULTY_STYLES: Record<
  Difficulty,
  { activeBg: string; activeText: string; activeBorder: string; dotColor: string }
> = {
  mudah: {
    activeBg: 'rgba(16,185,129,0.12)',
    activeText: '#059669',
    activeBorder: '#10B981',
    dotColor: '#10B981',
  },
  sedang: {
    activeBg: 'rgba(245,158,11,0.12)',
    activeText: '#D97706',
    activeBorder: '#F59E0B',
    dotColor: '#F59E0B',
  },
  sulit: {
    activeBg: 'rgba(255,107,107,0.12)',
    activeText: '#DC2626',
    activeBorder: '#FF6B6B',
    dotColor: '#FF6B6B',
  },
};

// ---------------------------------------------------------------------------
// QuestionEditor Component
// ---------------------------------------------------------------------------
export default function QuestionEditor() {
  const { editingQuestionType, setEditingQuestionType, setView } =
    useExamStore();

  // ---- Form state ----
  const [questionType, setQuestionType] = useState<QuestionType>(
    editingQuestionType ?? 'pilihan_ganda'
  );
  const [subjectId, setSubjectId] = useState('');
  const [classGradeId, setClassGradeId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('sedang');
  const [points, setPoints] = useState<number>(10);
  const [questionText, setQuestionText] = useState('');

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [showEssayTips, setShowEssayTips] = useState(false);

  // Type-specific state
  const [options, setOptions] = useState<QuestionOption[]>([
    { id: uid(), label: 'A', text: '', isCorrect: false },
    { id: uid(), label: 'B', text: '', isCorrect: false },
    { id: uid(), label: 'C', text: '', isCorrect: false },
    { id: uid(), label: 'D', text: '', isCorrect: false },
  ]);

  const [matchingPairs, setMatchingPairs] = useState<MatchingPair[]>([
    { id: uid(), premise: '', response: '' },
    { id: uid(), premise: '', response: '' },
    { id: uid(), premise: '', response: '' },
  ]);

  // ---- Derived data ----
  const filteredTopics = useMemo(
    () => (subjectId ? TOPICS.filter((t) => t.subjectId === subjectId) : []),
    [subjectId]
  );

  // ---- Handlers ----
  const handleTypeChange = useCallback(
    (type: QuestionType) => {
      setQuestionType(type);
      setEditingQuestionType(type);
      if (type === 'pilihan_ganda' || type === 'pilihan_ganda_kompleks') {
        setOptions([
          { id: uid(), label: 'A', text: '', isCorrect: false },
          { id: uid(), label: 'B', text: '', isCorrect: false },
          { id: uid(), label: 'C', text: '', isCorrect: false },
          { id: uid(), label: 'D', text: '', isCorrect: false },
        ]);
      } else if (type === 'menjodohkan') {
        setMatchingPairs([
          { id: uid(), premise: '', response: '' },
          { id: uid(), premise: '', response: '' },
          { id: uid(), premise: '', response: '' },
        ]);
      }
    },
    [setEditingQuestionType]
  );

  const handleSubjectChange = useCallback((val: string) => {
    setSubjectId(val);
    setTopicId('');
  }, []);

  // Option handlers
  const addOption = useCallback(() => {
    const nextLabel =
      OPTION_LABELS[options.length] ?? String(options.length + 1);
    setOptions((prev) => [
      ...prev,
      { id: uid(), label: nextLabel, text: '', isCorrect: false },
    ]);
  }, [options.length]);

  const removeOption = useCallback(
    (id: string) => {
      if (options.length <= 2) return;
      setOptions((prev) => {
        const filtered = prev.filter((o) => o.id !== id);
        return filtered.map((o, i) => ({
          ...o,
          label: OPTION_LABELS[i] ?? String(i + 1),
        }));
      });
    },
    [options.length]
  );

  const updateOptionText = useCallback((id: string, text: string) => {
    setOptions((prev) =>
      prev.map((o) => (o.id === id ? { ...o, text } : o))
    );
  }, []);

  const setSingleCorrect = useCallback((id: string) => {
    setOptions((prev) =>
      prev.map((o) => ({ ...o, isCorrect: o.id === id }))
    );
  }, []);

  const toggleMultiCorrect = useCallback((id: string) => {
    setOptions((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, isCorrect: !o.isCorrect } : o
      )
    );
  }, []);

  // Matching pair handlers
  const addPair = useCallback(() => {
    setMatchingPairs((prev) => [
      ...prev,
      { id: uid(), premise: '', response: '' },
    ]);
  }, []);

  const removePair = useCallback(
    (id: string) => {
      if (matchingPairs.length <= 2) return;
      setMatchingPairs((prev) => prev.filter((p) => p.id !== id));
    },
    [matchingPairs.length]
  );

  const updatePair = useCallback(
    (id: string, field: 'premise' | 'response', value: string) => {
      setMatchingPairs((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
      );
    },
    []
  );

  // Save handlers
  const handleSave = useCallback(async () => {
    const questionData = {
      id: 'q_' + Date.now(),
      type: questionType,
      subjectId,
      classGradeId,
      topicId,
      difficulty,
      points,
      text: questionText,
      options:
        questionType === 'pilihan_ganda' ||
        questionType === 'pilihan_ganda_kompleks'
          ? options
          : undefined,
      matchingPairs: questionType === 'menjodohkan' ? matchingPairs : undefined,
    } as any;
    
    // Save to local mock data so it appears in Question Bank immediately
    MOCK_QUESTIONS.push(questionData);
    
    // Find or create bank
    let bank = MOCK_QUESTION_BANKS.find(b => b.subjectId === subjectId && b.classGradeId === classGradeId && b.topicId === topicId);
    if (bank) {
      bank.questions.push(questionData);
      bank.questionCount = bank.questions.length;
    } else {
      const subjectName = SUBJECTS.find((s) => s.id === subjectId)?.name || 'Custom Subject';
      const topicName = TOPICS.find((t) => t.id === topicId)?.name || 'Custom Topic';
      const newBank: QuestionBank = {
        id: `qb-manual-${Date.now()}`,
        name: `Bank Soal ${subjectName} - ${topicName}`,
        subjectId,
        classGradeId,
        topicId,
        description: `Soal manual ${subjectName}`,
        questionCount: 1,
        questions: [questionData],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_QUESTION_BANKS.push(newBank);
    }
    
    // Save to database
    try {
      await saveGeneratedQuestions([questionData], subjectId, classGradeId, topicId);
    } catch (e) {
      console.error('Failed to save to DB', e);
    }

    alert('Soal berhasil disimpan!');
    setView('teacher_question_bank');
  }, [
    questionType,
    subjectId,
    classGradeId,
    topicId,
    difficulty,
    points,
    questionText,
    options,
    matchingPairs,
    setView,
  ]);

  const handleSaveAndCreate = useCallback(async () => {
    const questionData = {
      id: 'q_' + Date.now(),
      type: questionType,
      subjectId,
      classGradeId,
      topicId,
      difficulty,
      points,
      text: questionText,
      options:
        questionType === 'pilihan_ganda' ||
        questionType === 'pilihan_ganda_kompleks'
          ? options
          : undefined,
      matchingPairs: questionType === 'menjodohkan' ? matchingPairs : undefined,
    } as any;
    
    // Save to local mock data
    MOCK_QUESTIONS.push(questionData);

    // Find or create bank
    let bank = MOCK_QUESTION_BANKS.find(b => b.subjectId === subjectId && b.classGradeId === classGradeId && b.topicId === topicId);
    if (bank) {
      bank.questions.push(questionData);
      bank.questionCount = bank.questions.length;
    } else {
      const subjectName = SUBJECTS.find((s) => s.id === subjectId)?.name || 'Custom Subject';
      const topicName = TOPICS.find((t) => t.id === topicId)?.name || 'Custom Topic';
      const newBank: QuestionBank = {
        id: `qb-manual-${Date.now()}`,
        name: `Bank Soal ${subjectName} - ${topicName}`,
        subjectId,
        classGradeId,
        topicId,
        description: `Soal manual ${subjectName}`,
        questionCount: 1,
        questions: [questionData],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_QUESTION_BANKS.push(newBank);
    }

    // Save to database
    try {
      await saveGeneratedQuestions([questionData], subjectId, classGradeId, topicId);
    } catch (e) {
      console.error('Failed to save to DB', e);
    }
    
    alert('Soal berhasil disimpan! Membuat soal baru...');
    // Reset form for new question
    setQuestionText('');
    setOptions([
      { id: uid(), label: 'A', text: '', isCorrect: false },
      { id: uid(), label: 'B', text: '', isCorrect: false },
      { id: uid(), label: 'C', text: '', isCorrect: false },
      { id: uid(), label: 'D', text: '', isCorrect: false },
    ]);
    setMatchingPairs([
      { id: uid(), premise: '', response: '' },
      { id: uid(), premise: '', response: '' },
      { id: uid(), premise: '', response: '' },
    ]);
  }, [
    questionType,
    subjectId,
    classGradeId,
    topicId,
    difficulty,
    points,
    questionText,
    options,
    matchingPairs,
  ]);

  const handleCancel = useCallback(() => {
    setView('teacher_question_bank');
  }, [setView]);

  // ======================================================================
  // RENDER HELPERS
  // ======================================================================

  // Type icon map for the type-specific editor header
  const typeIconMap: Record<QuestionType, typeof faCircleDot> = {
    pilihan_ganda: faCircleDot,
    pilihan_ganda_kompleks: faSquareCheck,
    menjodohkan: faRightLeft,
  };

  // Preview content for student view
  const renderStudentPreview = () => {
    const subjectName =
      SUBJECTS.find((s) => s.id === subjectId)?.name ?? 'Mata Pelajaran';
    const topicName =
      TOPICS.find((t) => t.id === topicId)?.name ?? 'Topik';

    return (
      <Card
        className="border-cool-gray-200"
        style={{ backgroundColor: '#FAFBFC' }}
      >
        <CardHeader className="border-b border-cool-gray-200 pb-3">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faEye}
              className="text-sm"
              style={{ color: '#5B6ABF' }}
            />
            <CardTitle
              className="text-sm font-semibold"
              style={{ color: '#5B6ABF' }}
            >
              Student View
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Preview tampilan soal untuk siswa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Question header */}
          <div className="flex items-center gap-2 text-xs" style={{ color: '#636E72' }}>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0"
              style={{ borderColor: '#5B6ABF', color: '#5B6ABF' }}
            >
              {QUESTION_TYPE_LABELS[questionType]}
            </Badge>
            <span>{subjectName}</span>
            <span style={{ color: '#CBD5E1' }}>|</span>
            <span>{topicName}</span>
          </div>

          {/* Difficulty + Points */}
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{
                backgroundColor: DIFFICULTY_STYLES[difficulty].activeBg,
                color: DIFFICULTY_STYLES[difficulty].activeText,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: DIFFICULTY_STYLES[difficulty].dotColor,
                }}
              />
              {DIFFICULTY_LABELS[difficulty]}
            </span>
            <span className="text-[10px]" style={{ color: '#94A3B8' }}>
              {points} poin
            </span>
          </div>

          {/* Question text */}
          <div
            className="text-sm leading-relaxed"
            style={{ color: '#2D3436' }}
          >
            {questionText || (
              <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>
                Teks soal akan muncul di sini...
              </span>
            )}
          </div>

          {/* Type-specific preview */}
          {questionType === 'pilihan_ganda' && (
            <div className="space-y-2">
              {options.map((opt) => (
                <label
                  key={opt.id}
                  className="flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer transition-colors"
                  style={{
                    borderColor: opt.isCorrect ? '#5B6ABF' : '#E2E8F0',
                    backgroundColor: opt.isCorrect
                      ? 'rgba(91,106,191,0.06)'
                      : '#FFFFFF',
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{
                      borderColor: opt.isCorrect ? '#5B6ABF' : '#CBD5E1',
                    }}
                  >
                    {opt.isCorrect && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: '#5B6ABF' }}
                      />
                    )}
                  </div>
                  <span className="text-sm" style={{ color: '#2D3436' }}>
                    {opt.text || (
                      <span style={{ color: '#CBD5E1' }}>
                        Opsi {opt.label}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          )}

          {questionType === 'pilihan_ganda_kompleks' && (
            <div className="space-y-2">
              {options.map((opt) => (
                <label
                  key={opt.id}
                  className="flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer transition-colors"
                  style={{
                    borderColor: opt.isCorrect ? '#5B6ABF' : '#E2E8F0',
                    backgroundColor: opt.isCorrect
                      ? 'rgba(91,106,191,0.06)'
                      : '#FFFFFF',
                  }}
                >
                  <div
                    className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                    style={{
                      borderColor: opt.isCorrect ? '#5B6ABF' : '#CBD5E1',
                      backgroundColor: opt.isCorrect
                        ? '#5B6ABF'
                        : 'transparent',
                    }}
                  >
                    {opt.isCorrect && (
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="text-[8px] text-white"
                      />
                    )}
                  </div>
                  <span className="text-sm" style={{ color: '#2D3436' }}>
                    {opt.text || (
                      <span style={{ color: '#CBD5E1' }}>
                        Opsi {opt.label}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          )}

          {questionType === 'menjodohkan' && (
            <div className="space-y-2">
              {matchingPairs.map((pair, idx) => (
                <div
                  key={pair.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: '#5B6ABF' }}
                  >
                    {idx + 1}
                  </span>
                  <span style={{ color: '#2D3436' }}>
                    {pair.premise || '...'}
                  </span>
                  <FontAwesomeIcon
                    icon={faRightLeft}
                    className="text-xs flex-shrink-0"
                    style={{ color: '#CBD5E1' }}
                  />
                  <span style={{ color: '#2D3436' }}>
                    {pair.response || '...'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ======================================================================
  // RENDER
  // ======================================================================
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 p-4 sm:p-6 page-enter">
      {/* ---- Top Bar with Preview Toggle ---- */}
      <div className="flex items-center justify-between">
        <h1
          className="text-xl font-bold"
          style={{ color: '#2D3436' }}
        >
          Buat Soal Baru
        </h1>
        <Button
          type="button"
          variant={showPreview ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2"
          style={
            showPreview
              ? { backgroundColor: '#5B6ABF' }
              : { borderColor: '#5B6ABF', color: '#5B6ABF' }
          }
        >
          <FontAwesomeIcon icon={faEye} className="text-xs" />
          Preview
        </Button>
      </div>

      <div
        className={`grid gap-6 ${
          showPreview ? 'lg:grid-cols-[1fr_380px]' : ''
        }`}
      >
        {/* ---- Left Column: Editor ---- */}
        <div className="space-y-6">
          {/* ================================================================ */}
          {/* Section 1: Type Selector                                        */}
          {/* ================================================================ */}
          <section>
            <h2
              className="text-sm font-semibold mb-3"
              style={{ color: '#636E72' }}
            >
              Pilih Tipe Soal
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {QUESTION_TYPE_CARDS.map((card) => {
                const isSelected = questionType === card.type;
                return (
                  <button
                    key={card.type}
                    type="button"
                    onClick={() => handleTypeChange(card.type)}
                    className={`
                      relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 transition-all
                      cursor-pointer text-center min-h-[110px] justify-center overflow-hidden group
                      ${
                        isSelected
                          ? 'shadow-md'
                          : 'hover:shadow-sm'
                      }
                    `}
                    style={{
                      borderColor: isSelected ? '#5B6ABF' : '#E2E8F0',
                      backgroundColor: isSelected
                        ? 'rgba(91,106,191,0.06)'
                        : '#FFFFFF',
                    }}
                  >
                    {/* Left colored bar for selected */}
                    {isSelected && (
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                        style={{ backgroundColor: '#5B6ABF' }}
                      />
                    )}

                    {/* Check icon in top-right corner */}
                    {isSelected && (
                      <div
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#5B6ABF' }}
                      >
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="text-[9px] text-white"
                        />
                      </div>
                    )}

                    {/* Hover gradient overlay */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none"
                      style={{
                        background: isSelected
                          ? undefined
                          : 'linear-gradient(135deg, rgba(91,106,191,0.04) 0%, rgba(91,106,191,0.01) 100%)',
                      }}
                    />

                    <FontAwesomeIcon
                      icon={card.icon}
                      className="text-2xl relative z-10"
                      style={{ color: isSelected ? '#5B6ABF' : '#94A3B8' }}
                    />
                    <span
                      className="text-xs font-semibold leading-tight relative z-10"
                      style={{ color: isSelected ? '#5B6ABF' : '#636E72' }}
                    >
                      {card.label}
                    </span>
                    <span
                      className="text-[10px] leading-tight relative z-10"
                      style={{ color: '#94A3B8' }}
                    >
                      {card.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ================================================================ */}
          {/* Section 2: Common Fields - Card                                  */}
          {/* ================================================================ */}
          <Card className="border-cool-gray-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faInfoCircle}
                  className="text-sm"
                  style={{ color: '#5B6ABF' }}
                />
                <CardTitle
                  className="text-base"
                  style={{ color: '#2D3436' }}
                >
                  Informasi Dasar
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Subject */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Mata Pelajaran</Label>
                  <Select
                    value={subjectId}
                    onValueChange={handleSubjectChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Mata Pelajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs" style={{ color: '#94A3B8' }}>
                    Pilih mata pelajaran untuk soal ini
                  </p>
                </div>

                {/* Class/Grade */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Kelas</Label>
                  <Select
                    value={classGradeId}
                    onValueChange={setClassGradeId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASS_GRADES.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs" style={{ color: '#94A3B8' }}>
                    Tingkat kelas target soal
                  </p>
                </div>

                {/* Topic */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Topik</Label>
                  <Select
                    value={topicId}
                    onValueChange={setTopicId}
                    disabled={!subjectId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          subjectId
                            ? 'Pilih Topik'
                            : 'Pilih Mata Pelajaran dulu'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTopics.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs" style={{ color: '#94A3B8' }}>
                    Topik spesifik dalam mata pelajaran
                  </p>
                </div>
              </div>

              {/* Difficulty & Points row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Difficulty - Segmented Toggle */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Tingkat Kesulitan
                  </Label>
                  <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: '#E2E8F0' }}>
                    {DIFFICULTY_LIST.map((d) => {
                      const ds = DIFFICULTY_STYLES[d];
                      const isActive = difficulty === d;
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDifficulty(d)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all"
                          style={{
                            backgroundColor: isActive
                              ? ds.activeBg
                              : '#FFFFFF',
                            color: isActive ? ds.activeText : '#636E72',
                            borderRight:
                              d !== 'sulit' ? '1px solid #E2E8F0' : undefined,
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: isActive
                                ? ds.dotColor
                                : '#CBD5E1',
                            }}
                          />
                          {DIFFICULTY_LABELS[d]}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs" style={{ color: '#94A3B8' }}>
                    Menentukan level kesulitan soal
                  </p>
                </div>

                {/* Points */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Poin</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value) || 1)}
                    className="w-full"
                  />
                  <p className="text-xs" style={{ color: '#94A3B8' }}>
                    Nilai poin untuk jawaban benar (1-100)
                  </p>
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Teks Soal</Label>
                <Textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Tulis teks soal di sini..."
                  rows={4}
                  className="resize-y"
                />
                <p className="text-xs" style={{ color: '#94A3B8' }}>
                  Tulis pertanyaan atau pernyataan soal dengan jelas
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ================================================================ */}
          {/* Section 3: Type-Specific Editor - Card                           */}
          {/* ================================================================ */}
          <Card className="border-cool-gray-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={typeIconMap[questionType]}
                  className="text-sm"
                  style={{ color: '#5B6ABF' }}
                />
                <CardTitle
                  className="text-base"
                  style={{ color: '#2D3436' }}
                >
                  {QUESTION_TYPE_LABELS[questionType]}
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Konfigurasi detail untuk tipe soal ini
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* ============ Pilihan Ganda (Single Choice) ============ */}
              {questionType === 'pilihan_ganda' && (
                <div className="space-y-4">
                  {/* Radio preview note */}
                  <div
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                    style={{
                      backgroundColor: 'rgba(91,106,191,0.06)',
                      color: '#5B6ABF',
                    }}
                  >
                    <FontAwesomeIcon icon={faCircleDot} className="text-xs" />
                    <span>
                      Siswa hanya dapat memilih satu jawaban yang benar
                    </span>
                  </div>

                  {options.map((opt) => (
                    <div
                      key={opt.id}
                      className="flex items-center gap-3 group"
                    >
                      {/* Label circle */}
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors"
                        style={{
                          borderColor: opt.isCorrect ? '#5B6ABF' : '#CBD5E1',
                          backgroundColor: opt.isCorrect
                            ? 'rgba(91,106,191,0.1)'
                            : 'transparent',
                          color: opt.isCorrect ? '#5B6ABF' : '#94A3B8',
                        }}
                      >
                        {opt.label}
                      </div>

                      {/* Option text */}
                      <Input
                        value={opt.text}
                        onChange={(e) =>
                          updateOptionText(opt.id, e.target.value)
                        }
                        placeholder={`Opsi ${opt.label}`}
                        className="flex-1"
                      />

                      {/* Radio for correct answer */}
                      <RadioGroup
                        value={
                          options.find((o) => o.isCorrect)?.id ?? ''
                        }
                        onValueChange={setSingleCorrect}
                        className="flex"
                      >
                        <RadioGroupItem
                          value={opt.id}
                          id={`radio-${opt.id}`}
                        />
                      </RadioGroup>

                      {/* Delete button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(opt.id)}
                        disabled={options.length <= 2}
                        className="flex-shrink-0 hover:text-red-500"
                        style={{ color: '#94A3B8' }}
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-sm" />
                      </Button>
                    </div>
                  ))}

                  {options.length < 8 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                      className="gap-2"
                    >
                      <FontAwesomeIcon icon={faPlus} className="text-xs" />
                      Tambah Opsi
                    </Button>
                  )}

                  {/* Student preview of radio buttons */}
                  <div
                    className="rounded-lg border p-4 space-y-2"
                    style={{
                      borderColor: '#E2E8F0',
                      backgroundColor: '#FAFBFC',
                    }}
                  >
                    <p
                      className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                      style={{ color: '#94A3B8' }}
                    >
                      Preview Tampilan Siswa
                    </p>
                    {options.map((opt) => (
                      <label
                        key={opt.id}
                        className="flex items-center gap-2.5 cursor-pointer"
                      >
                        <div
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                          style={{
                            borderColor: opt.isCorrect
                              ? '#5B6ABF'
                              : '#CBD5E1',
                          }}
                        >
                          {opt.isCorrect && (
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: '#5B6ABF' }}
                            />
                          )}
                        </div>
                        <span className="text-xs" style={{ color: '#2D3436' }}>
                          {opt.text || `Opsi ${opt.label}`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* ============ Pilihan Ganda Kompleks (Multi-Select) ============ */}
              {questionType === 'pilihan_ganda_kompleks' && (
                <div className="space-y-4">
                  {/* Info banner */}
                  <div
                    className="flex items-start gap-2.5 rounded-lg px-4 py-3 text-xs"
                    style={{
                      backgroundColor: 'rgba(91,106,191,0.08)',
                      borderLeft: '3px solid #5B6ABF',
                      color: '#5B6ABF',
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faInfoCircle}
                      className="text-sm mt-0.5 flex-shrink-0"
                    />
                    <span>
                      Siswa dapat memilih lebih dari satu jawaban. Centang semua
                      opsi yang benar.
                    </span>
                  </div>

                  {options.map((opt) => (
                    <div
                      key={opt.id}
                      className="flex items-center gap-3 group"
                    >
                      {/* Label circle */}
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors"
                        style={{
                          borderColor: opt.isCorrect ? '#5B6ABF' : '#CBD5E1',
                          backgroundColor: opt.isCorrect
                            ? 'rgba(91,106,191,0.1)'
                            : 'transparent',
                          color: opt.isCorrect ? '#5B6ABF' : '#94A3B8',
                        }}
                      >
                        {opt.label}
                      </div>

                      {/* Option text */}
                      <Input
                        value={opt.text}
                        onChange={(e) =>
                          updateOptionText(opt.id, e.target.value)
                        }
                        placeholder={`Opsi ${opt.label}`}
                        className="flex-1"
                      />

                      {/* Checkbox for correct answer */}
                      <Checkbox
                        checked={opt.isCorrect}
                        onCheckedChange={() => toggleMultiCorrect(opt.id)}
                      />

                      {/* Delete button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(opt.id)}
                        disabled={options.length <= 2}
                        className="flex-shrink-0 hover:text-red-500"
                        style={{ color: '#94A3B8' }}
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-sm" />
                      </Button>
                    </div>
                  ))}

                  {options.length < 8 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                      className="gap-2"
                    >
                      <FontAwesomeIcon icon={faPlus} className="text-xs" />
                      Tambah Opsi
                    </Button>
                  )}
                </div>
              )}

              {/* ============ Menjodohkan (Matching Pairs) ============ */}
              {questionType === 'menjodohkan' && (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="grid grid-cols-[auto_1fr_auto_1fr_auto] gap-2 items-center px-1">
                    <span className="w-6" />
                    <span
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#636E72' }}
                    >
                      Kolom Kiri (Premis)
                    </span>
                    <span className="w-10" />
                    <span
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#636E72' }}
                    >
                      Kolom Kanan (Respon)
                    </span>
                    <span className="w-9" />
                  </div>

                  {/* Pairs */}
                  {matchingPairs.map((pair, index) => (
                    <div
                      key={pair.id}
                      className="grid grid-cols-[auto_1fr_auto_1fr_auto] gap-2 items-center"
                    >
                      {/* Number indicator */}
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: '#5B6ABF' }}
                      >
                        {index + 1}
                      </div>

                      {/* Premise input */}
                      <Input
                        value={pair.premise}
                        onChange={(e) =>
                          updatePair(pair.id, 'premise', e.target.value)
                        }
                        placeholder="Premis..."
                        className="w-full"
                      />

                      {/* Connector - dashed line with arrow */}
                      <div className="flex items-center justify-center w-10 relative">
                        <div
                          className="absolute h-0.5 w-full"
                          style={{
                            backgroundImage:
                              'repeating-linear-gradient(90deg, #CBD5E1, #CBD5E1 3px, transparent 3px, transparent 6px)',
                          }}
                        />
                        <FontAwesomeIcon
                          icon={faRightLeft}
                          className="text-xs relative z-10 bg-white px-0.5"
                          style={{ color: '#5B6ABF' }}
                        />
                      </div>

                      {/* Response input */}
                      <Input
                        value={pair.response}
                        onChange={(e) =>
                          updatePair(pair.id, 'response', e.target.value)
                        }
                        placeholder="Respon..."
                        className="w-full"
                      />

                      {/* Delete button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePair(pair.id)}
                        disabled={matchingPairs.length <= 2}
                        className="flex-shrink-0 hover:text-red-500"
                        style={{ color: '#94A3B8' }}
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-sm" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPair}
                    className="gap-2"
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-xs" />
                    Tambah Pasangan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ================================================================ */}
          {/* Section 4: Action Buttons                                        */}
          {/* ================================================================ */}
          <section className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pb-6">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={handleCancel}
              className="sm:min-w-[120px] gap-2"
            >
              <FontAwesomeIcon icon={faTimes} className="text-sm" />
              Batal
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleSaveAndCreate}
              className="sm:min-w-[200px] gap-2"
              style={{ borderColor: '#5B6ABF', color: '#5B6ABF' }}
            >
              <FontAwesomeIcon icon={faPlus} className="text-sm" />
              Simpan & Buat Lagi
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={handleSave}
              className="sm:min-w-[180px] gap-2"
              style={{ backgroundColor: '#5B6ABF' }}
            >
              <FontAwesomeIcon icon={faSave} className="text-sm" />
              Simpan Soal
            </Button>
          </section>
        </div>

        {/* ---- Right Column: Preview Panel ---- */}
        {showPreview && (
          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            {renderStudentPreview()}
          </div>
        )}
      </div>
    </div>
  );
}

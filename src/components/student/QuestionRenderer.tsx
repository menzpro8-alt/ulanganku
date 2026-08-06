'use client';

import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleDot,
  faSquareCheck,
  faRightLeft,
  faCheck,
  faCircleInfo,
  faRotateLeft,
  faKeyboard,
  faParagraph,
} from '@fortawesome/free-solid-svg-icons';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Question, StudentAnswer, QuestionType } from '@/lib/types';
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/lib/types';

interface QuestionRendererProps {
  question: Question;
  answer?: StudentAnswer;
  onAnswer: (answer: StudentAnswer) => void;
}

const TYPE_ICONS: Record<QuestionType, typeof faCircleDot> = {
  pilihan_ganda: faCircleDot,
  pilihan_ganda_kompleks: faSquareCheck,
  menjodohkan: faRightLeft,
  isian_singkat: faKeyboard,
  essay: faParagraph,
};

// ============================================================
// Single Choice Renderer
// ============================================================
function SingleChoiceRenderer({
  question,
  answer,
  onAnswer,
}: QuestionRendererProps) {
  const selectedOptionId = answer?.selectedOptionIds?.[0] ?? '';

  const shuffledOptions = useMemo(() => {
    if (!question.options) return [];
    const shuffled = [...question.options].sort(() => Math.random() - 0.5);
    return shuffled.map((opt, i) => ({
      ...opt,
      label: String.fromCharCode(65 + i)
    }));
  }, [question.options]);

  const handleSelect = (value: string) => {
    onAnswer({
      questionId: question.id,
      type: 'pilihan_ganda',
      selectedOptionIds: [value],
    });
  };

  return (
    <div className="space-y-3">
      <RadioGroup value={selectedOptionId} onValueChange={handleSelect}>
        {shuffledOptions.map(option => {
          const isSelected = selectedOptionId === option.id;
          return (
            <label
              key={option.id}
              htmlFor={option.id}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group ${
                isSelected
                  ? 'border-l-slate-blue border-l-[4px] bg-slate-blue/5 border-t-cool-gray-200 border-r-cool-gray-200 border-b-cool-gray-200 shadow-sm'
                  : 'border-cool-gray-200 hover:border-cool-gray-300 hover:shadow-sm hover:bg-cool-gray-50'
              }`}
            >
              {/* Letter badge */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-200 ${
                  isSelected
                    ? 'bg-slate-blue text-white shadow-sm'
                    : 'bg-cool-gray-100 text-charcoal-light group-hover:bg-cool-gray-200'
                }`}
              >
                {option.label}
              </div>

              <span className={`flex-1 text-sm transition-colors ${isSelected ? 'text-charcoal font-medium' : 'text-charcoal'}`}>
                {option.text}
              </span>

              <RadioGroupItem value={option.id} id={option.id} className="sr-only" />

              {/* Checkmark circle */}
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                  isSelected
                    ? 'border-slate-blue bg-slate-blue scale-100'
                    : 'border-cool-gray-300 scale-90 opacity-0 group-hover:opacity-50 group-hover:scale-95'
                }`}
              >
                {isSelected && (
                  <FontAwesomeIcon icon={faCheck} className="text-white text-[10px]" />
                )}
              </div>
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
}

// ============================================================
// Multi-Select Renderer
// ============================================================
function MultiSelectRenderer({
  question,
  answer,
  onAnswer,
}: QuestionRendererProps) {
  const selectedOptionIds = answer?.selectedOptionIds ?? [];

  const shuffledOptions = useMemo(() => {
    if (!question.options) return [];
    const shuffled = [...question.options].sort(() => Math.random() - 0.5);
    return shuffled.map((opt, i) => ({
      ...opt,
      label: String.fromCharCode(65 + i)
    }));
  }, [question.options]);

  const handleToggle = (optionId: string) => {
    const newSelected = selectedOptionIds.includes(optionId)
      ? selectedOptionIds.filter(id => id !== optionId)
      : [...selectedOptionIds, optionId];

    onAnswer({
      questionId: question.id,
      type: 'pilihan_ganda_kompleks',
      selectedOptionIds: newSelected,
    });
  };

  return (
    <div className="space-y-3">
      {/* Info banner */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-blue/5 border border-slate-blue/15">
        <FontAwesomeIcon icon={faCircleInfo} className="text-slate-blue text-sm shrink-0" />
        <span className="text-xs text-slate-blue font-medium">Pilih semua jawaban yang benar</span>
        {selectedOptionIds.length > 0 && (
          <Badge className="bg-slate-blue/15 text-slate-blue border-0 text-[10px] ml-auto px-2 py-0 h-5">
            {selectedOptionIds.length} opsi dipilih
          </Badge>
        )}
      </div>

      {shuffledOptions.map(option => {
        const isSelected = selectedOptionIds.includes(option.id);
        return (
          <div
            key={option.id}
            onClick={() => handleToggle(option.id)}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group ${
              isSelected
                ? 'border-l-slate-blue border-l-[4px] bg-slate-blue/5 border-t-cool-gray-200 border-r-cool-gray-200 border-b-cool-gray-200 shadow-sm'
                : 'border-cool-gray-200 hover:border-cool-gray-300 hover:shadow-sm hover:bg-cool-gray-50'
            }`}
          >
            {/* Letter badge */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-200 ${
                isSelected
                  ? 'bg-slate-blue text-white shadow-sm'
                  : 'bg-cool-gray-100 text-charcoal-light group-hover:bg-cool-gray-200'
              }`}
            >
              {option.label}
            </div>

            <span className={`flex-1 text-sm transition-colors ${isSelected ? 'text-charcoal font-medium' : 'text-charcoal'}`}>
              {option.text}
            </span>

            {/* Checkbox */}
            <Checkbox
              checked={isSelected}
              className="w-5 h-5 shrink-0 data-[state=checked]:bg-slate-blue data-[state=checked]:border-slate-blue"
            />
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Matching Pairs Renderer
// ============================================================
function MatchingPairsRenderer({
  question,
  answer,
  onAnswer,
}: QuestionRendererProps) {
  const pairs = question.matchingPairs ?? [];
  const matchingAnswers = answer?.matchingAnswers ?? [];

  // Create shuffled response options - deterministic on first render
  const shuffledResponses = useMemo(() => {
    const responses = pairs.map(p => ({ id: p.id, response: p.response }));
    return [...responses].sort(() => {
      // Simple deterministic shuffle based on string comparison
      return responses.map(r => r.response).join('').localeCompare(
        responses.map(r => r.id).join('')
      ) > 0 ? 1 : -1;
    });
  }, [pairs]);

  const handleMatch = (premiseId: string, responseId: string) => {
    const newAnswers = matchingAnswers.filter(a => a.premiseId !== premiseId);
    if (responseId && responseId !== '_empty') {
      newAnswers.push({ premiseId, responseId });
    }
    onAnswer({
      questionId: question.id,
      type: 'menjodohkan',
      matchingAnswers: newAnswers,
    });
  };

  const getSelectedResponse = (premiseId: string): string => {
    return matchingAnswers.find(a => a.premiseId === premiseId)?.responseId ?? '';
  };

  const handleResetAll = () => {
    onAnswer({
      questionId: question.id,
      type: 'menjodohkan',
      matchingAnswers: [],
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-charcoal-light uppercase tracking-wider">
          Cocokkan pasangan yang tepat
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetAll}
          className="h-7 text-xs text-charcoal-light hover:text-coral"
        >
          <FontAwesomeIcon icon={faRotateLeft} className="text-[10px] mr-1.5" />
          Reset Semua
        </Button>
      </div>

      {/* Desktop: Two-column layout with dashed connectors */}
      <div className="hidden sm:grid sm:grid-cols-[1fr_40px_1fr] gap-0 items-stretch">
        {/* Left Column - Premises */}
        <div className="space-y-3">
          {pairs.map((pair, index) => (
            <div
              key={pair.id}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-blue/5 border border-slate-blue/15"
            >
              <span className="w-8 h-8 rounded-lg bg-slate-blue/10 text-slate-blue text-xs font-bold flex items-center justify-center shrink-0">
                {index + 1}
              </span>
              <span className="text-sm text-charcoal font-medium">{pair.premise}</span>
            </div>
          ))}
        </div>

        {/* Connector column */}
        <div className="flex flex-col items-center justify-around py-2">
          {pairs.map(pair => (
            <div key={pair.id} className="flex items-center justify-center h-[52px]">
              <div className="w-6 border-t-2 border-dashed border-cool-gray-300" />
            </div>
          ))}
        </div>

        {/* Right Column - Response dropdowns */}
        <div className="space-y-3">
          {pairs.map((pair, index) => (
            <Select
              key={pair.id}
              value={getSelectedResponse(pair.id) || undefined}
              onValueChange={(val) => handleMatch(pair.id, val)}
            >
              <SelectTrigger className="w-full h-[52px] text-sm border-cool-gray-200 focus:ring-slate-blue/30 data-[state=open]:ring-2 data-[state=open]:ring-slate-blue/30">
                <SelectValue placeholder="Pilih jawaban..." />
              </SelectTrigger>
              <SelectContent>
                {shuffledResponses.map(resp => (
                  <SelectItem key={resp.id} value={resp.id}>
                    {resp.response}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
      </div>

      {/* Mobile: Stacked layout */}
      <div className="sm:hidden space-y-3">
        {pairs.map((pair, index) => (
          <div key={pair.id} className="p-3 rounded-xl bg-cool-gray-50 border border-cool-gray-200 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-slate-blue/10 text-slate-blue text-[10px] font-bold flex items-center justify-center shrink-0">
                {index + 1}
              </span>
              <span className="text-sm text-charcoal font-medium">{pair.premise}</span>
            </div>
            <Select
              value={getSelectedResponse(pair.id) || undefined}
              onValueChange={(val) => handleMatch(pair.id, val)}
            >
              <SelectTrigger className="w-full h-10 text-sm border-cool-gray-200 focus:ring-slate-blue/30">
                <SelectValue placeholder="Pilih jawaban..." />
              </SelectTrigger>
              <SelectContent>
                {shuffledResponses.map(resp => (
                  <SelectItem key={resp.id} value={resp.id}>
                    {resp.response}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Short Answer Renderer
// ============================================================
function ShortAnswerRenderer({
  question,
  answer,
  onAnswer,
}: QuestionRendererProps) {
  const value = answer?.textAnswer ?? '';

  return (
    <div className="space-y-3">
      <Label htmlFor="short-answer" className="text-sm font-medium text-charcoal">Jawaban Singkat</Label>
      <Input
        id="short-answer"
        value={value}
        onChange={(e) => onAnswer({
          questionId: question.id,
          type: 'isian_singkat',
          textAnswer: e.target.value
        })}
        placeholder="Ketik jawaban Anda di sini..."
        className="w-full"
      />
    </div>
  );
}

// ============================================================
// Essay Renderer
// ============================================================
function EssayRenderer({
  question,
  answer,
  onAnswer,
}: QuestionRendererProps) {
  const value = answer?.textAnswer ?? '';

  return (
    <div className="space-y-3">
      <Label htmlFor="essay-answer" className="text-sm font-medium text-charcoal">Uraian / Essay</Label>
      <Textarea
        id="essay-answer"
        value={value}
        onChange={(e) => onAnswer({
          questionId: question.id,
          type: 'essay',
          textAnswer: e.target.value
        })}
        placeholder="Ketik uraian jawaban Anda di sini secara lengkap..."
        className="min-h-[150px] w-full"
      />
    </div>
  );
}

// ============================================================
// Main Question Renderer
// ============================================================
export default function QuestionRenderer({
  question,
  answer,
  onAnswer,
}: QuestionRendererProps) {
  const renderQuestionContent = () => {
    switch (question.type) {
      case 'pilihan_ganda':
        return (
          <SingleChoiceRenderer
            question={question}
            answer={answer}
            onAnswer={onAnswer}
          />
        );
      case 'pilihan_ganda_kompleks':
        return (
          <MultiSelectRenderer
            question={question}
            answer={answer}
            onAnswer={onAnswer}
          />
        );
      case 'menjodohkan':
        return (
          <MatchingPairsRenderer
            question={question}
            answer={answer}
            onAnswer={onAnswer}
          />
        );
      case 'isian_singkat':
        return (
          <ShortAnswerRenderer
            question={question}
            answer={answer}
            onAnswer={onAnswer}
          />
        );
      case 'essay':
        return (
          <EssayRenderer
            question={question}
            answer={answer}
            onAnswer={onAnswer}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="page-enter">
      {/* Question Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge
            variant="outline"
            className="gap-1.5 border-slate-blue/30 text-slate-blue"
          >
            <FontAwesomeIcon icon={TYPE_ICONS[question.type] || faCircleDot} className="text-xs" />
            {QUESTION_TYPE_LABELS[question.type] || question.type}
          </Badge>
          <Badge className={`border-0 ${DIFFICULTY_COLORS[question.difficulty] || 'bg-cool-gray-100 text-cool-gray-700'}`}>
            {DIFFICULTY_LABELS[question.difficulty] || question.difficulty}
          </Badge>
          <Badge variant="outline" className="text-charcoal-light">
            {question.points} poin
          </Badge>
        </div>
        <p className="text-lg text-charcoal leading-relaxed whitespace-pre-wrap">
          {question.text}
        </p>
      </div>

      {/* Question Content */}
      {renderQuestionContent()}
    </div>
  );
}

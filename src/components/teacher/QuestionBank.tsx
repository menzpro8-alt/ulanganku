'use client';

import { useMemo, useState, useEffect } from 'react';
import { useExamStore } from '@/lib/store';
import {
  QUESTION_TYPE_LABELS,
  QUESTION_TYPE_ICONS,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
} from '@/lib/types';
import { SUBJECTS, CLASS_GRADES, TOPICS } from '@/lib/mock-data';
import { getQuestionBanks, updateQuestionBank, deleteQuestionBank } from '@/app/actions/bank';
import { Icon } from '@/components/shared/Icon';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function QuestionBank() {
  const {
    filterSubject,
    filterClass,
    filterTopic,
    searchQuery,
    setFilterSubject,
    setFilterClass,
    setFilterTopic,
    setSearchQuery,
    selectedQuestionBank,
    setSelectedQuestionBank,
    setView,
  } = useExamStore();

  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getQuestionBanks();
      if (res.success) {
        setBanks(res.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Filter topics based on selected subject
  const filteredTopics = useMemo(() => {
    if (!filterSubject) return TOPICS;
    return TOPICS.filter((t) => t.subjectId === filterSubject);
  }, [filterSubject]);

  // Filter question banks based on filters
  const filteredBanks = useMemo(() => {
    return banks.filter((bank) => {
      if (filterSubject && filterSubject !== 'all' && bank.subjectId !== filterSubject) return false;
      if (filterClass && filterClass !== 'all' && bank.classGradeId !== filterClass) return false;
      if (filterTopic && filterTopic !== 'all' && bank.topicId !== filterTopic) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !bank.name.toLowerCase().includes(query) &&
          !bank.description?.toLowerCase().includes(query)
        )
          return false;
      }
      return true;
    });
  }, [banks, filterSubject, filterClass, filterTopic, searchQuery]);

  // Get subject/class/topic names
  const getSubjectName = (id: string) => SUBJECTS.find((s) => s.id === id)?.name || id || 'Tanpa Mapel';
  const getClassName = (id: string) => CLASS_GRADES.find((s) => s.id === id)?.name || id || 'Tanpa Kelas';
  const getTopicName = (id: string) => TOPICS.find((t) => t.id === id)?.name || id || 'Tanpa Topik';

  const getTypeDistribution = (bank: any) => {
    const dist: Record<string, number> = {};
    if (Array.isArray(bank.questions)) {
      bank.questions.forEach((q: any) => {
        dist[q.type] = (dist[q.type] || 0) + 1;
      });
    }
    return dist;
  };

  const handleBankClick = (bank: any) => {
    setSelectedQuestionBank(bank);
  };

  const handleBackToList = () => {
    setSelectedQuestionBank(null);
  };

  const handleCreateQuestion = () => {
    setView('teacher_question_editor');
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus soal ini?')) {
      if (!selectedQuestionBank) return;
      
      const bank = selectedQuestionBank;
      const updatedQuestions = Array.isArray(bank.questions) 
        ? bank.questions.filter((q: any) => q.id !== questionId) 
        : [];
      
      const res = await updateQuestionBank(bank.id, {
        questions: updatedQuestions,
        questionCount: updatedQuestions.length
      });

      if (res.success) {
        const updatedBank = { ...bank, questions: updatedQuestions, questionCount: updatedQuestions.length };
        setBanks(prev => prev.map(b => b.id === bank.id ? updatedBank : b));
        setSelectedQuestionBank(updatedBank);
      } else {
        alert('Gagal menghapus soal');
      }
    }
  };

  const handleDeleteBank = async (e: React.MouseEvent, bankId: string) => {
    e.stopPropagation();
    if (window.confirm('Apakah Anda yakin ingin menghapus bank soal ini?')) {
      const res = await deleteQuestionBank(bankId);
      if (res.success) {
        setBanks(prev => prev.filter(b => b.id !== bankId));
      } else {
        alert('Gagal menghapus bank soal');
      }
    }
  };

  // If a bank is selected, show its questions
  if (selectedQuestionBank) {
    const bank = selectedQuestionBank;
    const typeDist = getTypeDistribution(bank);

    return (
      <div className="space-y-6 max-w-6xl">
        {/* Back button and bank info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBackToList}>
              <Icon icon="chevron-left" size="md" />
            </Button>
            <div>
              <h2 className="text-lg font-bold text-[#2D3436]">{bank.name}</h2>
              <p className="text-sm text-[#636E72]">
                {getSubjectName(bank.subjectId)} / {getClassName(bank.classGradeId)} / {getTopicName(bank.topicId)}
              </p>
            </div>
          </div>
          <Button onClick={handleCreateQuestion}>
            <Icon icon="plus" size="sm" />
            Tambah Soal
          </Button>
        </div>

        {/* Bank metadata */}
        <div className="flex flex-wrap gap-3">
          <Badge variant="secondary" className="gap-1.5">
            <Icon icon="book" size="sm" />
            {bank.questionCount} Soal
          </Badge>
          {Object.entries(typeDist).map(([type, count]) => (
            <Badge key={type} variant="outline" className="gap-1.5">
              <Icon icon={QUESTION_TYPE_ICONS[type as keyof typeof QUESTION_TYPE_ICONS]} size="sm" />
              {count} {QUESTION_TYPE_LABELS[type as keyof typeof QUESTION_TYPE_LABELS]}
            </Badge>
          ))}
        </div>

        {/* Questions list */}
        <div className="space-y-3">
          {!Array.isArray(bank.questions) || bank.questions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Icon icon="folder-open" size="lg" className="text-[#94A3B8] mx-auto mb-3" />
                <p className="text-[#636E72]">Belum ada soal dalam bank ini.</p>
                <Button className="mt-4" onClick={handleCreateQuestion}>
                  <Icon icon="plus" size="sm" />
                  Buat Soal Baru
                </Button>
              </CardContent>
            </Card>
          ) : (
            bank.questions.map((q: any, index: number) => (
              <Card key={q.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Question number */}
                    <div className="w-9 h-9 rounded-lg bg-[#5B6ABF]/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-[#5B6ABF]">{index + 1}</span>
                    </div>

                    {/* Question content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant="outline" className="gap-1 text-xs py-0">
                          <Icon icon={QUESTION_TYPE_ICONS[q.type]} size="sm" />
                          {QUESTION_TYPE_LABELS[q.type]}
                        </Badge>
                        <span
                          className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ${DIFFICULTY_COLORS[q.difficulty]}`}
                        >
                          {DIFFICULTY_LABELS[q.difficulty]}
                        </span>
                        <Badge variant="secondary" className="text-xs py-0">
                          {q.points} poin
                        </Badge>
                      </div>
                      <p className="text-sm text-[#2D3436] leading-relaxed line-clamp-2">
                        {q.text}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Icon icon="pen-to-square" size="sm" className="text-[#636E72]" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleDeleteQuestion(q.id)}
                      >
                        <Icon icon="trash-can" size="sm" className="text-[#FF6B6B]" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  // Default: show bank list with filters
  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#2D3436]">Bank Soal</h2>
          <p className="text-sm text-[#636E72]">Kelola koleksi soal berdasarkan mata pelajaran</p>
        </div>
        <Button onClick={handleCreateQuestion}>
          <Icon icon="plus" size="sm" />
          Buat Bank Baru
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Subject filter */}
            <Select
              value={filterSubject || 'all'}
              onValueChange={(v) => {
                setFilterSubject(v === 'all' ? '' : v);
                setFilterTopic('');
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Mata Pelajaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Mapel</SelectItem>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Class filter */}
            <Select
              value={filterClass || 'all'}
              onValueChange={(v) => setFilterClass(v === 'all' ? '' : v)}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {CLASS_GRADES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Topic filter */}
            <Select
              value={filterTopic || 'all'}
              onValueChange={(v) => setFilterTopic(v === 'all' ? '' : v)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Topik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Topik</SelectItem>
                {filteredTopics.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative flex-1">
              <Icon
                icon="magnifying-glass"
                size="sm"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />
              <Input
                placeholder="Cari bank soal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Cards */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-[#636E72]">Memuat data bank soal...</p>
          </CardContent>
        </Card>
      ) : filteredBanks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Icon icon="folder-open" size="lg" className="text-[#94A3B8] mx-auto mb-3" />
            <p className="text-[#636E72]">Tidak ada bank soal yang ditemukan.</p>
            <p className="text-sm text-[#94A3B8] mt-1">Coba ubah filter atau buat bank soal baru.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBanks.map((bank) => {
            const typeDist = getTypeDistribution(bank);
            return (
              <Card
                key={bank.id}
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => handleBankClick(bank)}
              >
                <CardContent className="p-5">
                  {/* Bank name */}
                  <h3 className="text-sm font-semibold text-[#2D3436] mb-2 line-clamp-2 group-hover:text-[#5B6ABF] transition-colors">
                    {bank.name}
                  </h3>

                  {/* Metadata */}
                  <div className="flex items-center gap-2 text-xs text-[#636E72] mb-3">
                    <span>{getSubjectName(bank.subjectId)}</span>
                    <span className="text-[#CBD5E1]">/</span>
                    <span>{getClassName(bank.classGradeId)}</span>
                  </div>

                  {/* Description */}
                  {bank.description && (
                    <p className="text-xs text-[#94A3B8] mb-3 line-clamp-2">{bank.description}</p>
                  )}

                  {/* Question count */}
                  <div className="flex items-center gap-1.5 text-xs text-[#636E72] mb-3">
                    <Icon icon="book" size="sm" className="text-[#94A3B8]" />
                    <span>{bank.questionCount} soal</span>
                  </div>

                  {/* Type distribution badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(typeDist).map(([type, count]) => (
                      <Badge
                        key={type}
                        variant="outline"
                        className="text-[10px] py-0 px-1.5 gap-1"
                      >
                        <Icon
                          icon={QUESTION_TYPE_ICONS[type as keyof typeof QUESTION_TYPE_ICONS]}
                          size="sm"
                        />
                        {count}
                      </Badge>
                    ))}
                  </div>

                  {/* Actions & Arrow indicator */}
                  <div className="flex justify-between items-center mt-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-red-50 hover:text-red-500 text-[#CBD5E1]"
                      onClick={(e) => handleDeleteBank(e, bank.id)}
                    >
                      <Icon icon="trash-can" size="sm" />
                    </Button>
                    <Icon
                      icon="chevron-right"
                      size="sm"
                      className="text-[#CBD5E1] group-hover:text-[#5B6ABF] transition-colors"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload,
  faChartBar,
  faChevronLeft,
  faCheckCircle,
  faTimesCircle,
  faFileAlt,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MOCK_EXAMS, MOCK_SESSIONS } from '@/lib/mock-data';
import type { Exam } from '@/lib/types';

export default function TeacherReports() {
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  // Completed exams (with at least some sessions)
  const completedExams = MOCK_EXAMS.filter(e => 
    e.status === 'completed' || e.status === 'active'
  );

  if (selectedExam) {
    const examSessions = MOCK_SESSIONS.filter(s => s.examId === selectedExam.id && s.status === 'completed');
    
    return (
      <div className="space-y-6 page-enter max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedExam(null)}>
            <FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-charcoal">Laporan Nilai: {selectedExam.title}</h2>
            <p className="text-sm text-charcoal-light">Rekapitulasi hasil ujian siswa</p>
          </div>
          <Button className="ml-auto bg-slate-blue text-white hover:bg-[#4F5AB0]">
            <FontAwesomeIcon icon={faDownload} className="mr-2 text-sm" />
            Export Excel
          </Button>
        </div>

        <Card className="border-cool-gray-200">
          <CardHeader>
            <CardTitle className="text-base text-charcoal">Daftar Nilai Siswa</CardTitle>
          </CardHeader>
          <CardContent>
            {examSessions.length === 0 ? (
              <div className="text-center py-8 text-charcoal-light">Belum ada siswa yang menyelesaikan ujian ini.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-cool-gray-50/50">
                    <TableHead className="text-charcoal-light">Nama Siswa</TableHead>
                    <TableHead className="text-charcoal-light">Kelas</TableHead>
                    <TableHead className="text-charcoal-light">Waktu Selesai</TableHead>
                    <TableHead className="text-charcoal-light text-right">Poin</TableHead>
                    <TableHead className="text-charcoal-light text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examSessions.map(session => {
                    // For mock, calculate random score if undefined
                    const score = session.score ?? Math.floor((selectedExam.passingScore / 100) * selectedExam.totalPoints) + 10;
                    const passed = (score / selectedExam.totalPoints) * 100 >= selectedExam.passingScore;
                    return (
                      <TableRow key={session.id} className="hover:bg-cool-gray-50">
                        <TableCell className="font-medium text-charcoal">{session.student.name}</TableCell>
                        <TableCell className="text-charcoal-light text-sm">{session.student.classGrade}</TableCell>
                        <TableCell className="text-charcoal-light text-sm">
                          {session.endTime ? new Date(session.endTime).toLocaleTimeString('id-ID') : '-'}
                        </TableCell>
                        <TableCell className="font-semibold text-charcoal text-right">{score} / {selectedExam.totalPoints}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={passed ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0' : 'bg-red-100 text-red-700 hover:bg-red-100 border-0'}>
                            <FontAwesomeIcon icon={passed ? faCheckCircle : faTimesCircle} className="mr-1.5" />
                            {passed ? 'Lulus' : 'Remedial'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold text-charcoal">Laporan Ujian</h2>
        <p className="text-sm text-charcoal-light">Pilih ujian untuk melihat rekap nilai dan statistik kelulusan.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {completedExams.map(exam => {
          const sessionsCount = MOCK_SESSIONS.filter(s => s.examId === exam.id && s.status === 'completed').length;
          return (
            <Card key={exam.id} className="cursor-pointer hover:shadow-md transition-shadow border-cool-gray-200" onClick={() => setSelectedExam(exam)}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-blue/10 flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={faChartBar} className="text-slate-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-charcoal line-clamp-2 leading-tight">{exam.title}</h3>
                    <div className="text-xs text-charcoal-light mt-1.5 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faFileAlt} /> {exam.questions.length} soal
                      </span>
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faUsers} /> {sessionsCount} selesai
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { ExamStatus } from '@/lib/types';

export async function publishExam(examData: any) {
  try {
    // Basic conversion from frontend Exam shape to Prisma Exam shape
    const { id, title, description, subjectId, classGradeId, status, durationMinutes, totalPoints, passingScore, token, questions } = examData;

    // Check if exam already exists
    const existing = await db.exam.findUnique({
      where: { id: id.startsWith('e-') ? undefined : id } // Handle mock IDs gracefully if needed, or just upsert
    });

    const dbExam = await db.exam.upsert({
      where: { id: existing ? existing.id : 'new-id' },
      update: {
        title,
        description,
        subjectId,
        classGradeId,
        status,
        durationMinutes,
        totalPoints,
        passingScore,
        token,
      },
      create: {
        id: id.startsWith('e-') ? undefined : id, // Let Prisma generate if it's a mock id like e-1234
        title,
        description,
        subjectId,
        classGradeId,
        status,
        durationMinutes,
        totalPoints,
        passingScore,
        token,
      }
    });

    // Create exam questions
    if (questions && questions.length > 0) {
      // First delete existing exam questions
      await db.examQuestion.deleteMany({
        where: { examId: dbExam.id }
      });

      // Then create new ones
      await db.examQuestion.createMany({
        data: questions.map((q: any) => ({
          examId: dbExam.id,
          questionId: q.questionId,
          order: q.order,
          points: q.points,
        }))
      });
    }

    revalidatePath('/');
    return { success: true, examId: dbExam.id };
  } catch (error) {
    console.error('Error publishing exam:', error);
    return { success: false, error: 'Gagal menyimpan ujian ke database' };
  }
}

export async function getActiveExams() {
  try {
    const exams = await db.exam.findMany({
      where: { status: { in: ['published', 'active'] } },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: exams };
  } catch (error) {
    console.error('Error fetching active exams:', error);
    return { success: false, error: 'Gagal mengambil data ujian' };
  }
}

'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function saveGeneratedQuestions(questions: any[], subject: string, grade: string, topic: string) {
  try {
    const dataToInsert = questions.map((q) => ({
      subject,
      grade,
      topic,
      difficulty: q.difficulty || 'sedang',
      type: q.type,
      content: q,
    }));

    await db.question.createMany({
      data: dataToInsert,
    });

    // Find existing bank for this subject, grade, and topic
    const existingBank = await db.questionBank.findFirst({
      where: {
        subjectId: subject,
        classGradeId: grade,
        topicId: topic
      }
    });

    if (existingBank) {
      // Append to existing
      const currentQuestions = Array.isArray(existingBank.questions) ? existingBank.questions : [];
      const updatedQuestions = [...currentQuestions, ...questions];
      await db.questionBank.update({
        where: { id: existingBank.id },
        data: {
          questions: updatedQuestions,
          questionCount: updatedQuestions.length
        }
      });
    } else {
      // Create new bank
      await db.questionBank.create({
        data: {
          name: `Bank Soal: ${topic}`,
          description: `Soal untuk ${subject} - ${grade}`,
          subjectId: subject,
          classGradeId: grade,
          topicId: topic,
          questionCount: questions.length,
          questions: questions,
        }
      });
    }

    revalidatePath('/');
    
    return { success: true, count: dataToInsert.length };
  } catch (error) {
    console.error('Error saving questions:', error);
    return { success: false, error: 'Gagal menyimpan soal ke database' };
  }
}

export async function getQuestions() {
  try {
    const data = await db.question.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil data soal' };
  }
}

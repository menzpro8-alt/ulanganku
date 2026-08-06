'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// -- Existing functions --
export async function publishExam(examData: any) {
  try {
    const { id, title, description, subjectId, classGradeId, status, durationMinutes, totalPoints, passingScore, token, questions } = examData;

    let dbExam;
    const isMockId = !id || id.startsWith('e-');

    if (!isMockId) {
      // Update existing
      dbExam = await db.exam.update({
        where: { id },
        data: { title, description, subjectId, classGradeId, status, durationMinutes, totalPoints, passingScore, token }
      });
    } else {
      // Create new
      dbExam = await db.exam.create({
        data: { title, description, subjectId, classGradeId, status, durationMinutes, totalPoints, passingScore, token }
      });
    }

    if (questions && questions.length > 0) {
      await db.examQuestion.deleteMany({
        where: { examId: dbExam.id }
      });
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
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menyimpan ujian ke database' };
  }
}

export async function getActiveExams() {
  try {
    const exams = await db.exam.findMany({
      where: { status: { in: ['published', 'active'] } },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: exams };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil data ujian' };
  }
}

// -- General CRUD functions --
export async function getExams() {
  try {
    const data = await db.exam.findMany({
      include: { questions: true },
      orderBy: { createdAt: 'desc' }
    });

    // We need to fetch all questions for these exams because of Prisma missing relation
    const allQuestionIds = new Set<string>();
    data.forEach(exam => exam.questions.forEach(eq => allQuestionIds.add(eq.questionId)));
    
    if (allQuestionIds.size > 0) {
      const actualQuestions = await db.question.findMany({
        where: { id: { in: Array.from(allQuestionIds) } }
      });
      const qMap = new Map(actualQuestions.map(q => [q.id, q]));
      
      data.forEach(exam => {
        exam.questions = exam.questions.map((eq: any) => ({
          ...eq,
          question: qMap.get(eq.questionId) || null
        }));
      });
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getExam(id: string) {
  try {
    const data = await db.exam.findUnique({
      where: { id },
      include: { questions: true }
    })
    
    if (data && data.questions) {
      const qIds = data.questions.map(q => q.questionId);
      const actualQuestions = await db.question.findMany({
        where: { id: { in: qIds } }
      });
      const qMap = new Map(actualQuestions.map(q => [q.id, q]));
      
      // Attach the full question object to eq.question
      data.questions = data.questions.map((eq: any) => ({
        ...eq,
        question: qMap.get(eq.questionId) || null
      }));
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createExam(data: any) {
  try {
    const { questions, ...examData } = data
    
    const createData: any = { ...examData }
    if (questions && Array.isArray(questions) && questions.length > 0) {
      createData.questions = {
        create: questions
      }
    }

    const result = await db.exam.create({
      data: createData,
      include: { questions: true }
    })
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateExam(id: string, data: any) {
  try {
    const { questions, ...examData } = data
    const result = await db.exam.update({
      where: { id },
      data: examData
    })
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteExam(id: string) {
  try {
    const result = await db.exam.delete({ where: { id } })
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function addExamQuestion(examId: string, data: any) {
  try {
    const result = await db.examQuestion.create({
      data: {
        ...data,
        examId
      }
    })
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteExamQuestion(id: string) {
  try {
    const result = await db.examQuestion.delete({ where: { id } })
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

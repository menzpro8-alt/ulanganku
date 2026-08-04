'use server';

import { db } from '@/lib/db';

export async function getDashboardStats() {
  try {
    const totalQuestions = await db.question.count();
    
    // Count active exams
    const activeExams = await db.exam.count({
      where: { status: 'active' }
    });
    
    // Count online students (sessions that are active)
    const onlineStudents = await db.studentExamSession.count({
      where: { status: 'active' }
    });

    // We can't easily calculate average score if we don't have scores yet, 
    // but let's mock the number to 0 or something realistic from DB
    const completedSessions = await db.studentExamSession.findMany({
      where: { status: 'completed' },
      select: { score: true }
    });
    
    let avgScore = 0;
    if (completedSessions.length > 0) {
      const validScores = completedSessions.filter(s => s.score !== null);
      if (validScores.length > 0) {
        avgScore = validScores.reduce((acc, s) => acc + (s.score || 0), 0) / validScores.length;
      }
    }

    // Recent activity (we can fake this based on latest questions or exams created, but let's do a simple one)
    const latestQuestions = await db.question.findMany({
      orderBy: { createdAt: 'desc' },
      take: 2,
      select: { createdAt: true, subject: true, topic: true }
    });
    
    const latestExams = await db.exam.findMany({
      orderBy: { createdAt: 'desc' },
      take: 2,
      select: { createdAt: true, title: true }
    });

    // Combine and sort activities
    const activities = [
      ...latestQuestions.map(q => ({
        id: `q-${q.createdAt.toISOString()}`,
        text: `Soal baru ditambahkan: ${q.subject} - ${q.topic}`,
        time: q.createdAt,
        type: 'question'
      })),
      ...latestExams.map(e => ({
        id: `e-${e.createdAt.toISOString()}`,
        text: `Ujian dibuat/diedit: ${e.title}`,
        time: e.createdAt,
        type: 'exam'
      }))
    ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5);

    // Compute AVG_SCORE_DATA (since we have no completed exams, let's group by subject if available)
    const sessionsWithSubject = await db.studentExamSession.findMany({
      where: { status: 'completed', score: { not: null } },
      include: { exam: true }
    });

    const subjectScores: Record<string, { total: number, count: number }> = {};
    sessionsWithSubject.forEach(s => {
      const sub = s.exam.subject;
      if (!subjectScores[sub]) subjectScores[sub] = { total: 0, count: 0 };
      subjectScores[sub].total += (s.score || 0);
      subjectScores[sub].count += 1;
    });

    let avgScoreData = Object.entries(subjectScores).map(([sub, data]) => ({
      subject: sub,
      score: Math.round(data.total / data.count)
    }));

    if (avgScoreData.length === 0) {
      avgScoreData = []; // No chart data
    }

    // Compute QUESTION_TYPE_DATA
    const questionCounts = await db.question.groupBy({
      by: ['type'],
      _count: { type: true }
    });

    const TYPE_LABELS: Record<string, string> = {
      'pilihan_ganda': 'Pilihan Ganda',
      'pilihan_ganda_kompleks': 'PG Kompleks',
      'menjodohkan': 'Menjodohkan',
      'isian_singkat': 'Isian Singkat',
      'essay': 'Essay'
    };

    let questionTypeData = questionCounts.map(q => ({
      name: TYPE_LABELS[q.type] || q.type,
      value: q._count.type
    }));
    
    if (questionTypeData.length === 0) {
      questionTypeData = [];
    }

    return {
      success: true,
      data: {
        totalQuestions,
        activeExams,
        onlineStudents,
        avgScore: avgScore.toFixed(1),
        activities: activities.map(a => ({
          ...a,
          time: a.time.toISOString() // We will format this on the client
        })),
        avgScoreData,
        questionTypeData
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return { success: false, error: 'Gagal memuat statistik dasbor' };
  }
}


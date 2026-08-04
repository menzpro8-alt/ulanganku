'use server';

import { db } from '@/lib/db';
import { StudentExamStatus, MonitoringData } from '@/lib/types';

export async function getLiveMonitoringData(examId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const exam = await db.exam.findUnique({
      where: { id: examId }
    });
    
    if (!exam) return { success: false, error: 'Ujian tidak ditemukan' };

    const sessions = await db.studentExamSession.findMany({
      where: { examId },
      include: { student: true }
    });

    // Format to match frontend
    const formattedSessions = sessions.map(s => ({
      ...s,
      student: {
        id: s.student.id,
        name: s.student.name,
        classGrade: s.student.classGrade,
        avatar: s.student.avatar
      },
      status: s.status as StudentExamStatus,
      answers: typeof s.answers === 'string' ? JSON.parse(s.answers) : s.answers,
    }));

    // Aggregate stats
    const total = sessions.length;
    const active = sessions.filter(s => s.status === 'active').length;
    const disconnected = sessions.filter(s => s.status === 'disconnected').length;
    const completed = sessions.filter(s => s.status === 'completed' || s.status === 'auto_submitted').length;
    const flagged = sessions.filter(s => s.status === 'flagged').length;
    const not_started = sessions.filter(s => s.status === 'not_started').length;

    // Collect alerts (anti-cheat alerts)
    let alerts: any[] = [];
    sessions.forEach(s => {
      if (s.alerts) {
        const parsedAlerts = typeof s.alerts === 'string' ? JSON.parse(s.alerts) : s.alerts;
        if (Array.isArray(parsedAlerts)) {
          alerts = alerts.concat(parsedAlerts.map(a => ({
            ...a,
            studentName: s.student.name
          })));
        }
      }
    });

    return { 
      success: true, 
      data: {
        examId,
        examTitle: exam.title,
        totalStudents: total,
        activeStudents: active,
        disconnectedStudents: disconnected,
        flaggedStudents: flagged,
        completedStudents: completed,
        sessions: formattedSessions,
        alerts: alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      }
    };
  } catch (error) {
    console.error('Error fetching live monitoring data:', error);
    return { success: false, error: 'Gagal mengambil data monitoring' };
  }
}

'use server'

import { db } from '@/lib/db'

export async function getAdminStats() {
  const [teachers, students, activeExams] = await Promise.all([
    db.user.count({ where: { role: 'teacher' } }),
    db.student.count(),
    db.exam.count({ where: { status: 'active' } }),
  ])
  return { teachers, students, activeExams }
}

export async function getStudentExamSessions() {
  return await db.studentExamSession.findMany({
    include: {
      student: true,
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 100,
  })
}

export async function createTeacher(data: any) {
  try {
    const teacher = await db.user.create({
      data: {
        name: data.name,
        username: data.username,
        password: data.password, 
        role: 'teacher'
      }
    })
    return { success: true, teacher }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createStudent(data: any) {
  try {
    const student = await db.student.create({
      data: {
        name: data.name,
        nis: data.nis,
        password: data.password, 
        classGrade: data.classGrade,
        avatar: data.avatar || null
      }
    })
    return { success: true, student }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

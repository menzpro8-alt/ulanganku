'use server'

import { db } from '@/lib/db'

export async function getSessions(examId?: string) {
  try {
    const where = examId ? { examId } : {}
    const data = await db.studentExamSession.findMany({
      where,
      include: { student: true },
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getSession(id: string) {
  try {
    const data = await db.studentExamSession.findUnique({
      where: { id },
      include: { student: true }
    })
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createSession(data: any) {
  try {
    const result = await db.studentExamSession.create({ data })
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateSession(id: string, data: any) {
  try {
    const result = await db.studentExamSession.update({ where: { id }, data })
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteSession(id: string) {
  try {
    const result = await db.studentExamSession.delete({ where: { id } })
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

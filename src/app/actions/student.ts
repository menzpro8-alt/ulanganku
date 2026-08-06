'use server'

import { db } from '@/lib/db'

export async function getStudents() {
  try {
    const data = await db.student.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getStudent(id: string) {
  try {
    const data = await db.student.findUnique({
      where: { id },
      include: { sessions: true }
    })
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createStudent(data: any) {
  try {
    const result = await db.student.create({ data })
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateStudent(id: string, data: any) {
  try {
    const result = await db.student.update({ where: { id }, data })
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteStudent(id: string) {
  try {
    const result = await db.student.delete({ where: { id } })
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

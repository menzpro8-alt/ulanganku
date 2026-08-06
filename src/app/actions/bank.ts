'use server'

import { db } from '@/lib/db'

export async function getQuestionBanks() {
  try {
    const data = await db.questionBank.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getQuestionBank(id: string) {
  try {
    const data = await db.questionBank.findUnique({ where: { id } })
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createQuestionBank(data: any) {
  try {
    const result = await db.questionBank.create({ data })
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateQuestionBank(id: string, data: any) {
  try {
    const result = await db.questionBank.update({ where: { id }, data })
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteQuestionBank(id: string) {
  try {
    const result = await db.questionBank.delete({ where: { id } })
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

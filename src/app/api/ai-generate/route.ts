import { NextRequest, NextResponse } from 'next/server';
import puter from 'puter';
import { Difficulty, QuestionType, AIGeneratedQuestion } from '@/lib/types';

function generateFallbackQuestions(
  subject: string,
  grade: string,
  difficulty: Difficulty,
  questionCount: number,
  questionTypes: QuestionType[],
  topic: string
): AIGeneratedQuestion[] {
  const questions: AIGeneratedQuestion[] = [];
  const topicLabel = topic || subject;

  for (let i = 0; i < questionCount; i++) {
    const id = `ai-${Date.now()}-${i}`;
    const tempId = `temp-${Date.now()}-${i}`;
    const qType = questionTypes[i % questionTypes.length] || 'pilihan_ganda';

    if (qType === 'pilihan_ganda') {
      const optionLabels = ['A', 'B', 'C', 'D', 'E'];
      const correctIdx = Math.floor(Math.random() * 5);
      questions.push({
        id,
        tempId,
        type: 'pilihan_ganda',
        text: `Soal ${topicLabel} ${difficulty} #${i + 1}: Pertanyaan pilihan ganda tentang ${topicLabel} untuk kelas ${grade}.`,
        difficulty,
        options: optionLabels.map((label, idx) => ({
          id: `${id}-opt-${idx}`,
          label,
          text: `Opsi ${label} untuk soal ${i + 1}`,
          isCorrect: idx === correctIdx,
        })),
        points: difficulty === 'mudah' ? 5 : difficulty === 'sedang' ? 10 : 15,
        isSelected: true,
      });
    } else if (qType === 'pilihan_ganda_kompleks') {
      const optionLabels = ['A', 'B', 'C', 'D', 'E'];
      questions.push({
        id,
        tempId,
        type: 'pilihan_ganda_kompleks',
        text: `Soal ${topicLabel} ${difficulty} #${i + 1}: Pilih semua pernyataan yang benar tentang ${topicLabel}.`,
        difficulty,
        options: optionLabels.map((label, idx) => ({
          id: `${id}-opt-${idx}`,
          label,
          text: `Pernyataan ${label} tentang ${topicLabel}`,
          isCorrect: idx < 2,
        })),
        points: difficulty === 'mudah' ? 10 : difficulty === 'sedang' ? 15 : 20,
        isSelected: true,
      });
    } else if (qType === 'menjodohkan') {
      questions.push({
        id,
        tempId,
        type: 'menjodohkan',
        text: `Soal ${topicLabel} ${difficulty} #${i + 1}: Cocokkan item di kolom kiri dengan item di kolom kanan yang sesuai.`,
        difficulty,
        matchingPairs: [
          { id: `${id}-p1`, premise: `Item kiri 1`, response: `Item kanan 1` },
          { id: `${id}-p2`, premise: `Item kiri 2`, response: `Item kanan 2` },
          { id: `${id}-p3`, premise: `Item kiri 3`, response: `Item kanan 3` },
          { id: `${id}-p4`, premise: `Item kiri 4`, response: `Item kanan 4` },
        ],
        points: 20,
        isSelected: true,
      });
    }
  }

  return questions;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, grade, difficulty, questionCount, questionTypes, topic } = body as {
      subject: string;
      grade: string;
      difficulty: Difficulty;
      questionCount: number;
      questionTypes: QuestionType[];
      topic?: string;
      prompt?: string;
      model?: string;
    };

    const clampedCount = Math.min(Math.max(questionCount || 5, 1), 20);

    const typeLabels: Record<QuestionType, string> = {
      pilihan_ganda: 'Pilihan Ganda (single choice with options A-E)',
      pilihan_ganda_kompleks: 'Pilihan Ganda Kompleks (multiple correct answers with options A-E)',
      menjodohkan: 'Menjodohkan (matching pairs - left premise to right response)',
    };

    const requestedTypes: QuestionType[] = questionTypes && questionTypes.length > 0 ? questionTypes : ['pilihan_ganda'];
    const typesDescription = requestedTypes.map(t => `${t} (${typeLabels[t as QuestionType]})`).join(', ');

    const generatedPrompt = `Generate ${clampedCount} Indonesian education questions with the following specifications:
- Subject: ${subject}
- Class/Grade: ${grade}
- Topic: ${topic || subject}
- Difficulty: ${difficulty}
- Question Types to include: ${typesDescription}

Return ONLY a valid JSON array. DO NOT wrap in \`\`\`json markdown blocks. NO explanations. Each element must be an object with a "type" field.

For type "pilihan_ganda":
{"type":"pilihan_ganda","text":"question","difficulty":"${difficulty}","options":[{"label":"A","text":"opt","isCorrect":false},{"label":"B","text":"opt","isCorrect":true}],"points":10}

For type "pilihan_ganda_kompleks":
{"type":"pilihan_ganda_kompleks","text":"question","difficulty":"${difficulty}","options":[{"label":"A","text":"opt","isCorrect":true},{"label":"B","text":"opt","isCorrect":true}],"points":15}

For type "menjodohkan":
{"type":"menjodohkan","text":"question","difficulty":"${difficulty}","matchingPairs":[{"premise":"left","response":"right"},{"premise":"left2","response":"right2"}],"points":20}

All questions must be in Bahasa Indonesia and appropriate for the specified grade level. Generate exactly ${clampedCount} questions.`;

    const finalPrompt = body.prompt || generatedPrompt;

    try {
      const messages = body.prompt
        ? finalPrompt
        : [
            {
              role: 'system',
              content:
                'You are an expert Indonesian education question generator. Generate questions in Bahasa Indonesia. Return ONLY valid JSON array without any markdown formatting or code blocks.',
            },
            { role: 'user', content: finalPrompt },
          ];

      const result = await puter.ai.chat(messages, body.model ? { model: body.model } : undefined);

      let parsed: unknown[];
      try {
        const content = typeof result === 'string' ? result : (result?.message?.content || '');
        // Try to extract JSON array from the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON array found in response');
        }
      } catch (err) { console.error("PUTER AI ERROR:", err);
        // Fallback to mock data
        return NextResponse.json({
          questions: generateFallbackQuestions(
            subject,
            grade,
            difficulty,
            clampedCount,
            requestedTypes,
            topic || ''
          ),
          source: 'fallback',
        });
      }

      const questions: AIGeneratedQuestion[] = (parsed as Record<string, unknown>[]).map(
        (q, i) => {
          const id = `ai-${Date.now()}-${i}`;
          const tempId = `temp-${Date.now()}-${i}`;

          return {
            id,
            tempId,
            type: (q.type as QuestionType) || requestedTypes[i % requestedTypes.length] || 'pilihan_ganda',
            text: (q.text as string) || `Soal tentang ${topic || subject}`,
            difficulty,
            options: (q.options as AIGeneratedQuestion['options'])?.map((opt, oi) => ({
              ...opt,
              id: `${id}-opt-${oi}`,
            })),
            matchingPairs: (q.matchingPairs as AIGeneratedQuestion['matchingPairs'])?.map(
              (pair, pi) => ({
                ...pair,
                id: `${id}-p${pi}`,
              })
            ),
            points: (q.points as number) || 10,
            isSelected: true,
          };
        }
      );

      return NextResponse.json({ questions, source: 'ai' });
    } catch (err) { console.error("PUTER AI ERROR:", err);
      // Fallback if AI call fails entirely
      return NextResponse.json({
        questions: generateFallbackQuestions(
          subject,
          grade,
          difficulty,
          clampedCount,
          requestedTypes,
          topic || ''
        ),
        source: 'fallback',
      });
    }
  } catch (err) { console.error("PUTER AI ERROR:", err);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, techStack, responses, resumeText, isPro, userId } = body;

    console.log('📥 Received API request:', {
      sessionId,
      techStack,
      responseCount: responses?.length,
      isPro,
      hasResumeText: !!resumeText
    });
    
    // Log the first response to see the structure
    if (responses && responses.length > 0) {
      console.log('🔍 First response structure:', responses[0]);
    }

    if (!sessionId || !techStack || !responses || !Array.isArray(responses)) {
      console.error('❌ Missing required fields:', { sessionId, techStack, responses });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Prepare rows for insertion
    const rows = responses.map((resp: any) => ({
      session_id: sessionId,
      tech_stack: techStack,
      question_id: resp.questionId,
      question_text: resp.questionText,
      question_type: resp.questionType,
      user_answer: resp.answer, // <-- Fix: use resp.answer
      time_spent: resp.timeSpent || 0,
      is_pro_user: isPro || false,
      resume_text: resumeText || null,
      user_id: userId || null,
      created_at: new Date().toISOString(),
    }));

    // Insert all responses
    console.log('💾 Inserting responses into database:', rows.length, 'rows');
    const { error: insertError } = await supabase.from('user_responses').insert(rows);
    if (insertError) {
      console.error('❌ Database insertion error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    console.log('✅ Successfully inserted responses into database');

    // If pro user, enqueue for AI evaluation
    if (isPro) {
      // Filter out MCQ questions and prepare long/short answers for AI evaluation
      const longShortAnswers = responses
        .filter((resp: any) => resp.questionType !== 'mcq')
        .map((resp: any) => ({
          questionId: resp.questionId,
          questionText: resp.questionText,
          questionType: resp.questionType,
          userAnswer: resp.answer,
          timeSpent: resp.timeSpent || 0
        }));

      const { error: queueError } = await supabase.from('mistral_queue').insert({
        session_id: sessionId,
        tech_stack: techStack,
        long_short_answers: longShortAnswers, // Required field
        status: 'pending',
        enqueued_at: new Date().toISOString(),
      });
      if (queueError) {
        console.error('Queue error:', queueError);
        return NextResponse.json({ error: queueError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, inserted: rows.length });
  } catch (error: any) {
    console.error('Submission error:', error); // This will print the full error object
    return NextResponse.json({ error: error, message: error.message }, { status: 500 });
  }
} 
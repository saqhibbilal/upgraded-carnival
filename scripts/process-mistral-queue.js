// scripts/process-mistral-queue.js
require('dotenv').config();
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Loaded' : 'Missing');
console.log('MISTRAL_API_KEY:', process.env.MISTRAL_API_KEY ? 'Loaded' : 'Missing');
const { createClient } = require('@supabase/supabase-js');
// Remove node-fetch import - Node.js v20+ has built-in fetch

// Use the main app's Supabase configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';

console.log('🚀 Starting Mistral Queue Processor...');
console.log('📊 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Missing');
console.log('🔑 Mistral API Key:', MISTRAL_API_KEY ? 'Configured' : 'Missing');

async function callMistralAPI(longShortAnswers, techStack) {
  console.log(`🤖 Calling Mistral API for ${techStack} with ${longShortAnswers.length} questions`);
  
  const questionsWithAnswers = longShortAnswers.map((resp, idx) => 
    `Question ${idx + 1} (${resp.questionType}):\nQ: ${resp.questionText}\nCandidate's Answer: "${resp.userAnswer}"\nTime Spent: ${resp.timeSpent} seconds`
  ).join('\n\n');
  
  const evaluationPrompt = `You are a strict technical interviewer evaluating a ${techStack} developer's interview performance. 

CANDIDATE RESPONSES:
${questionsWithAnswers}

EVALUATION REQUIREMENTS:
1. Be STRICT and REALISTIC in your assessment
2. Evaluate technical accuracy, depth, and completeness of answers
3. Consider if answers demonstrate practical knowledge vs just theoretical understanding
4. Score based on actual answer quality, not just length or effort

PROVIDE EVALUATION IN THIS EXACT JSON FORMAT:
{
  "overallScore": <0-100 number based on actual performance>,
  "longShortScore": <0-100 score for short/long answers>,
  "totalQuestions": ${longShortAnswers.length},
  "strengths": [<array of specific strengths demonstrated>],
  "weaknesses": [<array of specific areas needing improvement>],
  "technicalAccuracy": <1-10 rating>,
  "practicalKnowledge": <1-10 rating>,
  "communicationClarity": <1-10 rating>,
  "detailedFeedback": {
    "questionAnalysis": [<array of analysis for each question>],
    "recommendations": [<specific learning recommendations>],
    "nextSteps": [<career/skill development suggestions>]
  },
  "passFailStatus": "<PASS/FAIL based on >= 60% overall score>"
}

BE STRICT: Empty, wrong, or nonsensical answers should receive low scores. Only reward actual technical knowledge.`;

  try {
    const response = await fetch(MISTRAL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          {
            role: 'system',
            content: 'You are a strict technical interviewer and evaluator. You provide honest, realistic assessments based on actual technical knowledge demonstrated. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: evaluationPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 3000
      })
    });
    
    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.status} - ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ Mistral API response received');
    
    try {
      const evaluationText = result.choices[0]?.message?.content;
      if (!evaluationText) {
        throw new Error('No content in Mistral response');
      }
      
      // Extract JSON from response (handle markdown)
      const cleanedJson = evaluationText.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      const jsonStart = cleanedJson.indexOf('{');
      const jsonEnd = cleanedJson.lastIndexOf('}') + 1;
      const jsonContent = cleanedJson.substring(jsonStart, jsonEnd);
      
      const parsedEvaluation = JSON.parse(jsonContent);
      console.log('✅ Evaluation JSON parsed successfully');
      return parsedEvaluation;
      
    } catch (parseError) {
      console.error('❌ Failed to parse evaluation JSON:', parseError);
      console.error('Raw response:', result.choices[0]?.message?.content);
      
      // Return fallback evaluation
      return {
        overallScore: 50,
        longShortScore: 50,
        totalQuestions: longShortAnswers.length,
        strengths: ["Attempted all questions"],
        weaknesses: ["Answers need more technical detail"],
        technicalAccuracy: 3,
        practicalKnowledge: 3,
        communicationClarity: 4,
        detailedFeedback: {
          questionAnalysis: longShortAnswers.map((_, idx) => `Question ${idx + 1}: Answer provided but needs technical review`),
          recommendations: ["Study fundamental concepts", "Practice technical explanations"],
          nextSteps: ["Review technology documentation", "Practice coding examples"]
        },
        passFailStatus: "FAIL"
      };
    }
  } catch (apiError) {
    console.error('❌ Mistral API call failed:', apiError.message);
    throw apiError;
  }
}

async function processQueue() {
  console.log('🔍 Fetching pending jobs from mistral_queue...');
  
  const { data: jobs, error } = await supabase
    .from('mistral_queue')
    .select('*')
    .eq('status', 'pending')
    .limit(5);
    
  if (error) {
    console.error('❌ Error fetching queue:', error);
    return;
  }
  
  if (!jobs || jobs.length === 0) {
    console.log('✅ No pending jobs found');
    return;
  }
  
  console.log(`📋 Found ${jobs.length} pending jobs`);
  
  for (const job of jobs) {
    console.log(`\n🔄 Processing job ${job.id} for session ${job.session_id}`);
    
    try {
      // Update status to processing
      await supabase.from('mistral_queue').update({ 
        status: 'processing', 
        updated_at: new Date().toISOString() 
      }).eq('id', job.id);
      
      console.log(`📝 Job ${job.id} status updated to 'processing'`);
      
      // Call Mistral API
      const evaluationText = await callMistralAPI(job.long_short_answers, job.tech_stack);
      
      // Parse and structure the evaluation
      const evaluationData = {
        evaluation: evaluationText,
        rawEvaluation: evaluationText,
        processed_at: new Date().toISOString(),
        model: 'mistral-large-latest'
      };
      
      console.log(`💾 Storing evaluation data for session ${job.session_id}`);
      
      // Store in response_evaluations
      const { error: evalError } = await supabase.from('response_evaluations').insert({
        session_id: job.session_id,
        tech_stack: job.tech_stack,
        evaluation_data: evaluationData,
        created_at: new Date().toISOString()
      });
      
      if (evalError) {
        console.error('❌ Error storing evaluation:', evalError);
        throw evalError;
      }
      
      console.log(`✅ Evaluation stored in response_evaluations`);
      
      // Update final_reports.long_short_evaluation (if final_reports table exists)
      try {
        const { error: reportError } = await supabase
          .from('final_reports')
          .update({ long_short_evaluation: evaluationData })
          .eq('session_id', job.session_id);
          
        if (reportError) {
          console.warn('⚠️ Could not update final_reports (table might not exist):', reportError.message);
        } else {
          console.log(`✅ Final report updated`);
        }
      } catch (reportUpdateError) {
        console.warn('⚠️ Final reports update skipped:', reportUpdateError.message);
      }
      
      // Mark as done
      await supabase.from('mistral_queue').update({ 
        status: 'done', 
        updated_at: new Date().toISOString() 
      }).eq('id', job.id);
      
      console.log(`✅ Job ${job.id} completed successfully`);
      
    } catch (err) {
      console.error(`❌ Error processing job ${job.id}:`, err.message);
      
      await supabase.from('mistral_queue').update({ 
        status: 'error', 
        updated_at: new Date().toISOString() 
      }).eq('id', job.id);
      
      console.error(`❌ Job ${job.id} marked as 'error'`);
    }
  }
}

// Main execution
processQueue().then(() => {
  console.log('\n🎉 Queue processing complete.');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Queue processing failed:', error);
  process.exit(1);
}); 
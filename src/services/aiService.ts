import { GoogleGenAI } from '@google/genai';
import { 
  StudyNote, 
  Flashcard, 
  Quiz, 
  QuizQuestion, 
  StudyPlan, 
  TutorMode, 
  TutorMessage, 
  EssayFeedback, 
  ExplainerVideo,
  AudioLesson,
  InteractiveLesson
} from '../types';

// Valid model per gemini-api skill instructions (gemini-3.1-flash-lite offers high speed and reliability)
const MODEL_NAME = 'gemini-3.1-flash-lite';

const getApiKey = (): string => {
  return (
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    (typeof window !== 'undefined' && (window as any).__GEMINI_API_KEY__) ||
    ''
  );
};

export class AIService {
  /**
   * Helper to clean JSON response from code markdown blocks
   */
  public static cleanJson(text: string): string {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    return cleaned.trim();
  }

  /**
   * Robust JSON extractor that handles markdown wrappers, preambles, and conversational text
   */
  public static extractJson<T = any>(text: string): T | null {
    if (!text || typeof text !== 'string') return null;
    const trimmed = text.trim();

    // 1. Direct parse attempt
    try {
      return JSON.parse(trimmed);
    } catch (_) {}

    // 2. Extract from markdown code fence
    const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const fenceMatch = trimmed.match(fenceRegex);
    if (fenceMatch && fenceMatch[1]) {
      try {
        return JSON.parse(fenceMatch[1].trim());
      } catch (_) {}
    }

    // 3. Extract outermost { ... }
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
      } catch (_) {}
    }

    // 4. Extract outermost [ ... ]
    const firstBracket = trimmed.indexOf('[');
    const lastBracket = trimmed.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(trimmed.slice(firstBracket, lastBracket + 1));
      } catch (_) {}
    }

    return null;
  }

  /**
   * Helper to get parsed JSON result or fallback
   */
  public static parseJsonResult<T = any>(res: { text: string; data?: any }, fallback?: T): T {
    if (res.data !== undefined && res.data !== null) {
      return res.data as T;
    }
    const extracted = this.extractJson<T>(res.text);
    if (extracted !== null && extracted !== undefined) {
      return extracted;
    }
    if (fallback !== undefined) {
      return fallback;
    }
    // As last resort, try cleanJson
    try {
      return JSON.parse(this.cleanJson(res.text));
    } catch (e) {
      if (fallback !== undefined) return fallback;
      throw new Error('Could not parse AI response: ' + (res.text?.slice(0, 100) || 'empty'));
    }
  }

  /**
   * Unified generation dispatcher that tries the backend /api/ai/generate proxy route first
   * and falls back to client SDK if direct key is present in browser.
   */
  private static async callGemini(options: {
    prompt: string;
    model?: string;
    json?: boolean;
    inlineData?: { data: string; mimeType: string };
  }): Promise<{ text: string; data?: any }> {
    const model = options.model || MODEL_NAME;
    const json = options.json ?? false;

    // 1. Try server-side proxy route first (secure, has process.env.GEMINI_API_KEY with auto-fallback)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: options.prompt,
          model,
          json,
          inlineData: options.inlineData
        })
      });

      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          return { text: body.text || '', data: body.data };
        }
      } else {
        const errorBody = await res.json().catch(() => ({}));
        console.warn('Backend /api/ai/generate returned status', res.status, errorBody);
      }
    } catch (e) {
      console.warn('Failed to reach /api/ai/generate proxy:', e);
    }

    // 2. Direct client-side SDK fallback if client key exists
    const clientKey = getApiKey();
    if (clientKey) {
      const client = new GoogleGenAI({ apiKey: clientKey });
      const candidateModels = [
        model,
        'gemini-3.1-flash-lite',
        'gemini-flash-latest',
        'gemini-3.8-flash'
      ].filter((m, idx, arr) => arr.indexOf(m) === idx);

      let lastError: any = null;

      for (const modelToTry of candidateModels) {
        try {
          let contents: any = options.prompt;
          if (options.inlineData) {
            contents = [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      data: options.inlineData.data,
                      mimeType: options.inlineData.mimeType
                    }
                  },
                  { text: options.prompt }
                ]
              }
            ];
          }

          const config: any = {};
          if (json) {
            config.responseMimeType = 'application/json';
          }

          const response = await client.models.generateContent({
            model: modelToTry,
            contents,
            config
          });

          const text = response.text || '';
          let data = null;
          if (json) {
            data = this.extractJson(text);
          }

          return { text, data };
        } catch (err: any) {
          console.warn(`Client Gemini fallback model ${modelToTry} failed:`, err?.message || err);
          lastError = err;
        }
      }

      if (lastError) {
        throw lastError;
      }
    }

    throw new Error('AI generation is currently unable to reach model services. Please check connection and retry.');
  }

  /**
   * Generate structured study notes from raw material
   */
  static async generateNotes(params: {
    materialTitle: string;
    materialContent: string;
    noteType: 'quick-summary' | 'standard' | 'comprehensive';
  }): Promise<{ summary: string; sections: any[]; sourceReferences: any[] }> {
    const prompt = `
You are Nora, the expert educational AI for Learnora. Analyze the following study material and generate structured notes of type "${params.noteType}".

Material Title: ${params.materialTitle}
Material Content:
"""
${params.materialContent.slice(0, 30000)}
"""

CRITICAL INSTRUCTIONS:
- Ground all facts in the provided material.
- If information is not in the material, do not invent facts.
- Return ONLY a JSON object adhering to this schema:
{
  "summary": "High-level 2-3 sentence distillation",
  "sections": [
    {
      "id": "s1",
      "heading": "Section Heading",
      "content": "Rich explanatory text",
      "subsections": [{"title": "Sub concept", "content": "Details"}],
      "keyTerms": [{"term": "Term", "definition": "Definition"}],
      "formulasOrDates": ["Formula or key date"],
      "keyTakeaways": ["Bullet point takeaway"],
      "citations": [{"sourceName": "${params.materialTitle}", "quote": "Direct brief reference"}]
    }
  ],
  "sourceReferences": [
    {"sourceName": "${params.materialTitle}", "quote": "General theme citation"}
  ]
}
`;

    const res = await this.callGemini({
      prompt,
      model: MODEL_NAME,
      json: true
    });

    return this.parseJsonResult(res);
  }

  /**
   * Generate Flashcards with spaced repetition metadata
   */
  static async generateFlashcards(params: {
    materialTitle: string;
    materialContent: string;
    count?: number;
  }): Promise<Omit<Flashcard, 'id' | 'studySetId' | 'userId' | 'createdAt'>[]> {
    const count = params.count || 10;
    const prompt = `
You are Nora, the expert tutor in Learnora. Generate ${count} high-yield flashcards from this material.
Include a variety of types: 'term-def', 'qa', 'multiple-choice', 'fill-blank', 'concept'.

Material Title: ${params.materialTitle}
Material Content:
"""
${params.materialContent.slice(0, 25000)}
"""

Return a JSON array of flashcards with this exact schema:
[
  {
    "type": "qa",
    "front": "Question, prompt, or term",
    "back": "Answer, definition, or explanation",
    "options": ["A", "B", "C", "D"],
    "explanation": "Why this is correct and conceptual context",
    "citation": {"sourceName": "${params.materialTitle}", "quote": "Quote from text"},
    "difficulty": "medium",
    "mastery": "new",
    "intervalDays": 1,
    "repetitionCount": 0,
    "easeFactor": 2.5,
    "nextReviewDate": ${Date.now()},
    "timesReviewed": 0,
    "timesCorrect": 0,
    "timesMissed": 0
  }
]
`;

    const res = await this.callGemini({
      prompt,
      model: MODEL_NAME,
      json: true
    });

    return this.parseJsonResult(res, []);
  }

  /**
   * Generate Quiz Questions
   */
  static async generateQuiz(params: {
    materialTitle: string;
    materialContent: string;
    questionCount: number;
    difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  }): Promise<QuizQuestion[]> {
    const prompt = `
You are Nora, the educational engine for Learnora. Create a ${params.questionCount}-question quiz at "${params.difficulty}" difficulty.
Types: 'multiple_choice', 'true_false', 'short_answer', 'fill_blank', 'scenario'.

Material:
"""
${params.materialContent.slice(0, 25000)}
"""

Return a JSON array of questions with this schema:
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Clear explanation of why this answer is correct and others are wrong",
    "topic": "Specific subtopic",
    "citation": {"sourceName": "${params.materialTitle}", "quote": "Source quote"}
  }
]
`;

    const res = await this.callGemini({
      prompt,
      model: MODEL_NAME,
      json: true
    });

    return this.parseJsonResult(res, []);
  }

  /**
   * Nora AI Tutor conversational response with Self-Learning and Continuous Adaptation
   */
  static async tutorChat(params: {
    userMessage: string;
    mode: TutorMode;
    studyMaterialContext?: string;
    teachingStyle?: string;
    chatHistory: { sender: 'user' | 'nora'; content: string }[];
    studentName?: string;
    cognitiveMemory?: any;
    quizContext?: {
      lastConcept?: string;
      wasCorrect?: boolean;
      userSubmittedAnswer?: string;
    };
  }): Promise<{ 
    content: string; 
    questionToStudent?: string; 
    citations?: any[]; 
    interactiveOptions?: string[];
    chatQuiz?: {
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
      concept: string;
    };
    selfReflection?: {
      studentGraspObserved: 'struggling' | 'partially-understood' | 'mastered';
      identifiedGap?: string;
      demonstratedStrength?: string;
      tutorAdjustmentMade: string;
    };
  }> {
    const name = params.studentName || 'Student';
    const memory = params.cognitiveMemory;
    
    // Cognitive context for Nora to personalize and evolve her teaching
    const cognitiveContext = memory ? `
STUDENT COGNITIVE PROFILE & YOUR CURRENT TEACHING ADAPTATION STRATEGY:
- Known Knowledge Gaps to Be Mindful Of: ${memory.learnedKnowledgeGaps?.length ? memory.learnedKnowledgeGaps.join(', ') : 'None identified yet.'}
- Demonstrated Strengths: ${memory.demonstratedStrengths?.length ? memory.demonstratedStrengths.join(', ') : 'Observing baseline capabilities.'}
- Preferred Explanations: Technical Depth = ${memory.preferredExplanations?.technicalDepth || 'balanced'}, Uses Analogies = ${memory.preferredExplanations?.usesAnalogies !== false ? 'Yes' : 'No'}, Pacing = ${memory.preferredExplanations?.pacingSpeed || 'standard'}.
- Effective Hooks: ${memory.preferredExplanations?.effectiveHooks?.join(', ') || 'Relatable real-world analogies.'}
- Your Current Pedagogical Strategy: "${memory.noraPedagogicalStrategy?.strategyName || 'Adaptive Socratic Mentorship'}" (Evolution Level: ${memory.noraPedagogicalStrategy?.adaptationLevel || 1}/100)
- Recent Self-Adjustment You Made: "${memory.noraPedagogicalStrategy?.recentSelfAdjustment || 'Calibrating to student pacing'}"

SELF-LEARNING DIRECTIVE:
You are not a static model. You continuously observe how the student responds:
1. Did they struggle with the previous concept or terminology? If so, identify the gap, soften your jargon, introduce a relatable hook, or scaffold with simpler steps.
2. Did they answer correctly with high confidence? If so, acknowledge their mastery, reinforce the strength, and increase depth or challenge.
3. In every response, along with your teaching answer, self-reflect on what you observed and state the concrete adjustment you made in your pedagogical approach.
` : '';

    const systemPrompt = `
You are Nora, a brilliant, warm, patient, and pedagogically sound personal AI lecturer on Learnora.
Student name: ${name}
Active Tutor Mode: ${params.mode}
Teaching Style: ${params.teachingStyle || 'Balanced, Socratic, encouraging, clear'}
${cognitiveContext}

Pedagogical Rules:
1. Ground your answers in the student's study material whenever present.
2. In 'Explain' or 'Teach Me' mode: Explain clearly with relatable analogies, then provide a concrete example, and provide an interactive check-for-understanding quiz question directly in the chat.
3. In 'Quiz Me' mode: Always provide an in-chat interactive quiz question with structured options, checkmarks, and explicit correct answer index.
4. Mastery-First Rule:
   - When the student submits an answer to a question:
     a) If they got it WRONG or struggled: DO NOT skip ahead to a brand-new concept! First explain the misunderstanding gently with a vivid analogy or intuitive hook. Then test them on that exact same core concept again (rephrased or scaffolded) until they master it.
     b) If they got it RIGHT: Enthusiastically validate their correct intuition, highlight why their logic succeeded, and seamlessly introduce the next progressive concept with a fresh in-chat quiz question.
5. In 'Give Me a Hint' mode: Never give away the answer outright; give a conceptual stepping stone.
6. In 'Explain Simply' mode: Explain like I'm 10 years old with zero jargon.
7. In 'Go Deeper' mode: Explore advanced nuances, real-world edge cases, and academic rigor.
8. Clean Markdown Rule: Never indent lines with leading spaces or add spaces before lines or paragraphs. Start every paragraph and line flushed to the margin. Separate paragraphs with clean double newlines without any whitespace on empty lines.

${params.quizContext ? `RECENT QUIZ ATTEMPT FEEDBACK:
- Concept Tested: "${params.quizContext.lastConcept || 'Core Concept'}"
- Student Was Correct: ${params.quizContext.wasCorrect ? 'YES (Mastered this step!)' : 'NO (Struggled or missed it!)'}
- Student Submitted Answer: "${params.quizContext.userSubmittedAnswer || ''}"
Instruction based on this attempt: ${params.quizContext.wasCorrect ? 'Acknowledge their mastery of this concept, celebrate their reasoning, and advance to the next logical concept in the sequence with a new question.' : 'Focus on remedying their specific confusion on this concept. Explain the misconception clearly, and give another question on this same concept to confirm they truly master it before advancing.'}
` : ''}

Provided Study Material:
"""
${params.studyMaterialContext ? params.studyMaterialContext.slice(0, 15000) : 'No specific document attached; use sound academic pedagogy.'}
"""

Format response strictly as JSON:
{
  "content": "Your main explanation, encouragement, and teaching response (use markdown formatting)",
  "questionToStudent": "Optional follow-up question prompt to test understanding",
  "chatQuiz": {
    "question": "Clear, direct multiple-choice question testing the current concept",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Clear explanation of why the correct option is right and why others are wrong",
    "concept": "Short concept name (e.g. 'Photosynthesis Light Reactions' or 'Ohm\\'s Law')"
  },
  "interactiveOptions": ["Can you give an analogy?", "Explain simply", "Next challenge"],
  "citations": [{"sourceName": "Material", "quote": "Brief quote if grounded in context"}],
  "selfReflection": {
    "studentGraspObserved": "struggling" | "partially-understood" | "mastered",
    "identifiedGap": "Specific concept they had difficulty with (or empty string)",
    "demonstratedStrength": "Specific concept they mastered (or empty string)",
    "tutorAdjustmentMade": "Explicit self-adjustment Nora made to teach this student better"
  }
}
`;

    const conversation = params.chatHistory.map(m => `${m.sender.toUpperCase()}: ${m.content}`).join('\n');
    const prompt = `${systemPrompt}\n\nRecent Conversation:\n${conversation}\nUSER: ${params.userMessage}\nNORA (in JSON):`;

    const res = await this.callGemini({
      prompt,
      model: MODEL_NAME,
      json: true
    });

    const parsed = res.data || this.extractJson(res.text);
    if (parsed && typeof parsed === 'object') {
      const rawContent = parsed.content || res.text || 'Let us continue exploring this topic.';
      // Clean any spaces before another line or paragraph
      const cleanContent = rawContent
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .split('\n')
        .map((l: string) => (l.startsWith('```') ? l : l.trimStart()))
        .join('\n')
        .trim();

      return {
        content: cleanContent,
        questionToStudent: parsed.questionToStudent,
        chatQuiz: parsed.chatQuiz,
        interactiveOptions: Array.isArray(parsed.interactiveOptions) && parsed.interactiveOptions.length > 0 
          ? parsed.interactiveOptions 
          : ['Can you give an analogy?', 'Test me with a question', 'Explain simply'],
        citations: Array.isArray(parsed.citations) ? parsed.citations : [],
        selfReflection: parsed.selfReflection
      };
    }

    // Graceful recovery: if the model responded conversationally in text/markdown instead of strict JSON
    if (res.text && res.text.trim()) {
      const cleanFallback = res.text
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .split('\n')
        .map((l: string) => (l.startsWith('```') ? l : l.trimStart()))
        .join('\n')
        .trim();

      return {
        content: cleanFallback,
        interactiveOptions: ['Can you give an analogy?', 'Test me with a question', 'Explain simply'],
        citations: []
      };
    }

    return {
      content: 'I am here to help you master this! Could you elaborate on what you would like to explore or clarify?',
      interactiveOptions: ['Give me an overview', 'Test my understanding', 'Give me a relatable analogy']
    };
  }

  /**
   * Deep Self-Reflection & Synthesis Engine:
   * Periodically synthesizes multiple interactions to evolve Nora's cognitive profile of the student.
   */
  static async synthesizeCognitiveEvolution(params: {
    studentName: string;
    recentLogs: { interactionSummary: string; studentGraspObserved: string; identifiedGap?: string; tutorAdjustmentMade: string }[];
    currentMemory: any;
    quizAccuracy?: number;
  }): Promise<{
    strategyName: string;
    focusAreas: string[];
    recentSelfAdjustment: string;
    adaptationLevel: number;
    newGaps: string[];
    resolvedStrengths: string[];
    optimalDepth: 'simplified' | 'balanced' | 'rigorous';
    optimalPacing: 'deliberate' | 'standard' | 'accelerated';
    recommendedHooks: string[];
    evolutionNarrative: string;
  }> {
    const prompt = `
You are the Meta-Cognitive Self-Improvement System for Nora, the AI tutor on Learnora.
Analyze the student's recent performance and interaction logs to evolve your teaching strategy.

Student: ${params.studentName}
Recent Interactions & Observations:
${JSON.stringify(params.recentLogs.slice(0, 10), null, 2)}

Current Memory Profile:
- Strategy: ${params.currentMemory.noraPedagogicalStrategy?.strategyName}
- Current Adaptation Level: ${params.currentMemory.noraPedagogicalStrategy?.adaptationLevel || 1}
- Known Gaps: ${JSON.stringify(params.currentMemory.learnedKnowledgeGaps || [])}
- Strengths: ${JSON.stringify(params.currentMemory.demonstratedStrengths || [])}
- Recent Quiz Accuracy: ${params.quizAccuracy !== undefined ? `${params.quizAccuracy}%` : 'N/A'}

TASK:
Self-reflect on how effectively Nora has been teaching this student.
Synthesize actionable adjustments to improve your explanation style, adapt pacing, and overcome persistent misconceptions.

Return JSON strictly:
{
  "strategyName": "Updated evolved strategy name (e.g., 'Targeted Retrieval & Concrete Grounding')",
  "focusAreas": ["Updated focus area 1", "Focus area 2"],
  "recentSelfAdjustment": "Concise 1-2 sentence statement of what Nora has learned and changed about herself to teach this student better",
  "adaptationLevel": ${Math.min(100, (params.currentMemory.noraPedagogicalStrategy?.adaptationLevel || 1) + 2)},
  "newGaps": ["Any newly confirmed gaps to review"],
  "resolvedStrengths": ["Concepts the student has demonstrably mastered"],
  "optimalDepth": "simplified" | "balanced" | "rigorous",
  "optimalPacing": "deliberate" | "standard" | "accelerated",
  "recommendedHooks": ["Analogies or hooks that resonate best with this student"],
  "evolutionNarrative": "A warm, transparent 2-3 sentence update for the student explaining how Nora has adapted to their personal learning style."
}
`;

    const res = await this.callGemini({
      prompt,
      model: MODEL_NAME,
      json: true
    });

    return this.parseJsonResult(res);
  }

  /**
   * Tutor Me Interactive Lesson Builder
   */
  static async generateInteractiveLesson(params: {
    topic: string;
    materialContext?: string;
  }): Promise<Omit<InteractiveLesson, 'id' | 'studySetId' | 'userId' | 'currentStepIndex' | 'completed'>> {
    const prompt = `
Create an interactive multi-step Socratic lesson for Learnora on the topic: "${params.topic}".
Material context:
"""
${(params.materialContext || '').slice(0, 15000)}
"""

Return JSON format:
{
  "topic": "${params.topic}",
  "learningObjective": "Clear outcome",
  "prerequisites": ["Prereq 1", "Prereq 2"],
  "steps": [
    {
      "stepNumber": 1,
      "title": "Foundation Concept",
      "lecture": "Bite-sized high-impact explanation (150 words)",
      "analogies": "A memorable real-world analogy",
      "question": "Engaging check-for-understanding question",
      "expectedConcept": "Key takeaway that must be in their response",
      "hint": "A subtle clue if they struggle"
    },
    {
      "stepNumber": 2,
      "title": "Mechanisms and Application",
      "lecture": "Next progression of the concept",
      "analogies": "Another clarifying analogy",
      "question": "Scenario or application question",
      "expectedConcept": "Core reasoning",
      "hint": "Guiding question"
    },
    {
      "stepNumber": 3,
      "title": "Synthesis & Mastery",
      "lecture": "Advanced implication or connection",
      "analogies": "Mastery analogy",
      "question": "Synthesis question connecting steps 1 & 2",
      "expectedConcept": "Holistic grasp",
      "hint": "Synthesize earlier lessons"
    }
  ]
}
`;

    const res = await this.callGemini({
      prompt,
      model: MODEL_NAME,
      json: true
    });

    return this.parseJsonResult(res);
  }

  /**
   * Evaluate interactive lesson response
   */
  static async evaluateLessonAnswer(params: {
    step: any;
    studentAnswer: string;
  }): Promise<{ isCorrect: boolean; feedback: string; nextRecommendation: string }> {
    const prompt = `
Evaluate the student's answer to this lesson question:
Question: ${params.step.question}
Expected Concept: ${params.step.expectedConcept}
Student Answer: "${params.studentAnswer}"

Evaluate constructively. Return JSON:
{
  "isCorrect": true,
  "feedback": "Warm, constructive evaluation of what was right and any minor misunderstanding.",
  "nextRecommendation": "Guidance on how to solidify understanding or ready to proceed."
}
`;
    const res = await this.callGemini({
      prompt,
      model: MODEL_NAME,
      json: true
    });
    return this.parseJsonResult(res);
  }

  /**
   * Essay Grader & Feedback Generator
   */
  static async gradeEssay(params: {
    essayTitle: string;
    essayContent: string;
    subject: string;
    assignmentType: string;
    rubric?: string;
  }): Promise<Omit<EssayFeedback, 'id' | 'userId' | 'createdAt'>> {
    const prompt = `
You are an expert academic evaluator on Learnora. Provide rigorous, objective, and supportive analysis of this student essay.
Title: ${params.essayTitle}
Subject: ${params.subject}
Assignment Type: ${params.assignmentType}
Rubric: ${params.rubric || 'Standard collegiate academic rubric'}

Essay Text:
"""
${params.essayContent.slice(0, 20000)}
"""

Evaluate strictly as JSON:
{
  "title": "${params.essayTitle}",
  "subject": "${params.subject}",
  "assignmentType": "${params.assignmentType}",
  "originalText": "${params.essayContent.slice(0, 1000)}...",
  "estimatedScore": 88,
  "maxScore": 100,
  "structureScore": 85,
  "argumentScore": 90,
  "clarityScore": 86,
  "grammarScore": 92,
  "evidenceScore": 87,
  "strengths": ["Clear thesis statement", "Robust topic sentences", "Effective conclusion"],
  "areasToImprove": ["Deepen counterargument analysis", "Reduce passive voice in paragraph 3"],
  "suggestedRevision": "Specific actionable rewrite advice for weak paragraphs",
  "feedbackSummary": "A balanced, encouraging 2-3 paragraph academic overview (Markdown format)"
}
`;
    const res = await this.callGemini({
      prompt,
      model: MODEL_NAME,
      json: true
    });
    return this.parseJsonResult(res);
  }

  /**
   * Generate Explainer Slide Video Pipeline with Rich Interactive Canvas and Audio
   */
  static async generateExplainerVideo(params: {
    topic: string;
    materialContent?: string;
  }): Promise<Omit<ExplainerVideo, 'id' | 'studySetId' | 'userId' | 'createdAt'>> {
    const prompt = `
Create an engaging StudyFetch-style animated Explainer Video lesson with 4 distinct scenes for Learnora.
Topic: ${params.topic}
Context: ${(params.materialContent || '').slice(0, 15000)}

Each scene represents an audiovisual lesson slide with:
1. Clear titular concept and subtitle
2. High-yield core bullet points
3. Visual diagram blueprint (e.g. flowchart, cycle, comparison, hierarchy, formula) with 3-4 structured nodes for animated visual playback
4. Spoken lecture narration (natural, conversational, engaging audio script)
5. Nora avatar expression ('explaining', 'enthusiastic', 'questioning', 'celebrating')
6. Interactive comprehension check on key scenes

Return strictly JSON adhering to this schema:
{
  "topic": "${params.topic}",
  "summary": "Concise overview of this visual explainer video",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "slides": [
    {
      "title": "Core Foundations of ${params.topic}",
      "subtitle": "Conceptual blueprint & fundamental principles",
      "bulletPoints": ["Primary defining mechanism", "Why this concept is crucial", "Key prerequisite intuition"],
      "narration": "Welcome to this visual explainer. Today, we're breaking down ${params.topic} step-by-step so you retain it effortlessly...",
      "visualDescription": "High contrast minimal architectural diagram illustrating the primary mechanism",
      "durationSeconds": 16,
      "diagramType": "hierarchy",
      "diagramNodes": [
        {"label": "Root Concept", "desc": "Foundational premise", "highlight": true},
        {"label": "Core Mechanism", "desc": "Primary transformation", "highlight": false},
        {"label": "Applied Outcome", "desc": "Observable consequence", "highlight": false}
      ],
      "avatarExpression": "enthusiastic"
    },
    {
      "title": "Mechanics & Deep Process Flow",
      "subtitle": "Step-by-step operational sequence",
      "bulletPoints": ["Trigger phase and inputs", "Intermediate metabolic/logical transition", "Final product and stability check"],
      "narration": "Now observe how the pieces connect. When the initial stage engages, it drives an immediate cascade...",
      "visualDescription": "Interactive flowchart demonstrating transition across stages",
      "durationSeconds": 20,
      "diagramType": "flowchart",
      "diagramNodes": [
        {"label": "Step 1: Input", "desc": "Activation event", "highlight": false},
        {"label": "Step 2: Processing", "desc": "Catalytic transformation", "highlight": true},
        {"label": "Step 3: Output", "desc": "Equilibrium state", "highlight": false}
      ],
      "avatarExpression": "explaining",
      "interactiveCheck": {
        "question": "What is the critical bottleneck in this mechanism?",
        "options": ["Step 1 activation", "Step 2 transformation", "Final equilibrium"],
        "correctIndex": 1,
        "explanation": "Step 2 requires the greatest activation energy and dictates the overall velocity of the system."
      }
    },
    {
      "title": "Real-World Context & Comparison",
      "subtitle": "Theory vs Applied Reality",
      "bulletPoints": ["Common misconceptions vs actual behavior", "High-stakes exam pitfall", "Practical application scenario"],
      "narration": "Let's test this in a realistic context. Many students confuse the theoretical model with real-world edge cases...",
      "visualDescription": "Comparative matrix contrasting ideal conditions with applied realities",
      "durationSeconds": 18,
      "diagramType": "comparison",
      "diagramNodes": [
        {"label": "Common Pitfall", "desc": "Superficial memorization", "highlight": false},
        {"label": "True Dynamic", "desc": "Underlying causality", "highlight": true}
      ],
      "avatarExpression": "questioning"
    },
    {
      "title": "Synthesis & Memory Anchors",
      "subtitle": "Key takeaways for 100% recall",
      "bulletPoints": ["The golden rule to remember", "Rapid mental test for exam day", "Final summary formula"],
      "narration": "To wrap up our lesson, always remember this core governing rule. If you see this on an exam, anchor back to...",
      "visualDescription": "Summary cycle reinforcing retention",
      "durationSeconds": 15,
      "diagramType": "cycle",
      "diagramNodes": [
        {"label": "Inspect Inputs", "desc": "Check conditions", "highlight": false},
        {"label": "Apply Rule", "desc": "Execute formula", "highlight": true},
        {"label": "Verify Result", "desc": "Confirm answer", "highlight": false}
      ],
      "avatarExpression": "celebrating"
    }
  ]
}
`;
    const res = await this.callGemini({
      prompt,
      model: MODEL_NAME,
      json: true
    });
    return this.parseJsonResult(res);
  }

  /**
   * Generate Audio Lesson Script
   */
  static async generateAudioLesson(params: {
    title: string;
    materialContent: string;
    mode: 'Quick recap' | 'Detailed lecture' | 'Conversation' | 'Exam revision';
  }): Promise<Omit<AudioLesson, 'id' | 'studySetId' | 'userId' | 'createdAt'>> {
    const prompt = `
Generate a natural, engaging educational audio lesson script for Learnora.
Title: ${params.title}
Mode: ${params.mode}
Material:
"""
${params.materialContent.slice(0, 15000)}
"""

Return JSON:
{
  "title": "${params.title}",
  "mode": "${params.mode}",
  "script": "Full narrative script written for spoken delivery with clear pacing and tone",
  "audioDurationSeconds": 180,
  "scenes": [
    {
      "speaker": "Nora",
      "text": "Introductory spoken segment",
      "timestampSeconds": 0
    },
    {
      "speaker": "Nora",
      "text": "Core concept breakdown segment",
      "timestampSeconds": 45
    },
    {
      "speaker": "Nora",
      "text": "Application and exam tips segment",
      "timestampSeconds": 110
    }
  ]
}
`;
    const res = await this.callGemini({
      prompt,
      model: MODEL_NAME,
      json: true
    });
    return this.parseJsonResult(res);
  }

  /**
   * Analyze uploaded image / diagram
   */
  static async analyzeDiagram(params: {
    imageDataUrl: string;
    prompt: string;
    studyContext?: string;
  }): Promise<string> {
    const base64Data = params.imageDataUrl.split(',')[1] || params.imageDataUrl;
    const mimeMatch = params.imageDataUrl.match(/data:([^;]+);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const fullPrompt = `You are Nora, the AI lecturer at Learnora. The student uploaded this educational diagram/image.
Student query: "${params.prompt}"
Context: ${params.studyContext || 'Educational study'}.
Provide a clear, pedagogical breakdown:
1. What this diagram represents
2. Key labeled parts or trends explained simply
3. Significance for exams or practical application
4. A quick comprehension question for the student.`;

    const res = await this.callGemini({
      prompt: fullPrompt,
      model: MODEL_NAME,
      inlineData: {
        data: base64Data,
        mimeType
      }
    });

    return res.text || 'Unable to process image at this time.';
  }

  /**
   * Generate Personalized Study Plan
   */
  static async generateStudyPlan(params: {
    subject: string;
    examDate?: string;
    hoursPerWeek: number;
    currentConfidence: 'low' | 'medium' | 'high';
    importantTopics?: string[];
  }): Promise<Omit<StudyPlan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> {
    const prompt = `
Create a realistic 7-day personalized study schedule for Learnora.
Subject: ${params.subject}
Exam Date: ${params.examDate || 'In 3 weeks'}
Hours per week: ${params.hoursPerWeek}
Confidence: ${params.currentConfidence}
Key Topics: ${(params.importantTopics || []).join(', ') || 'Core curriculum'}

Return JSON:
{
  "title": "${params.subject} Mastery Plan",
  "examDate": "${params.examDate || ''}",
  "targetSubject": "${params.subject}",
  "hoursPerWeek": ${params.hoursPerWeek},
  "currentConfidence": "${params.currentConfidence}",
  "schedule": [
    {
      "dayName": "Monday",
      "date": "Day 1",
      "tasks": [
        {
          "id": "t1",
          "topic": "Fundamentals & Key Definitions",
          "activityType": "read-notes",
          "estimatedMinutes": 30,
          "completed": false
        },
        {
          "id": "t2",
          "topic": "Flashcard Retention",
          "activityType": "flashcards",
          "estimatedMinutes": 15,
          "completed": false
        }
      ]
    },
    {
      "dayName": "Tuesday",
      "date": "Day 2",
      "tasks": [
        {
          "id": "t3",
          "topic": "Practice Questions & Nora Tutor",
          "activityType": "quiz",
          "estimatedMinutes": 30,
          "completed": false
        }
      ]
    },
    {
      "dayName": "Wednesday",
      "date": "Day 3",
      "tasks": [
        {
          "id": "t4",
          "topic": "Deep Dive into Difficult Areas",
          "activityType": "tutor-review",
          "estimatedMinutes": 45,
          "completed": false
        }
      ]
    },
    {
      "dayName": "Thursday",
      "date": "Day 4",
      "tasks": [
        {
          "id": "t5",
          "topic": "Flashcard Spaced Review",
          "activityType": "flashcards",
          "estimatedMinutes": 20,
          "completed": false
        }
      ]
    },
    {
      "dayName": "Friday",
      "date": "Day 5",
      "tasks": [
        {
          "id": "t6",
          "topic": "Comprehensive Practice Test Simulation",
          "activityType": "practice-test",
          "estimatedMinutes": 45,
          "completed": false
        }
      ]
    },
    {
      "dayName": "Saturday",
      "date": "Day 6",
      "tasks": [
        {
          "id": "t7",
          "topic": "Weak Area Correction & Synthesis",
          "activityType": "tutor-review",
          "estimatedMinutes": 30,
          "completed": false
        }
      ]
    },
    {
      "dayName": "Sunday",
      "date": "Day 7",
      "tasks": [
        {
          "id": "t8",
          "topic": "Weekly Mastery Review & Rest",
          "activityType": "read-notes",
          "estimatedMinutes": 20,
          "completed": false
        }
      ]
    }
  ]
}
`;
    const res = await this.callGemini({
      prompt,
      model: MODEL_NAME,
      json: true
    });
    return this.parseJsonResult(res);
  }
}

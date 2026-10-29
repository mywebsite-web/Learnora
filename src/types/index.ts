export type EducationLevel = 
  | 'Secondary School'
  | 'University'
  | 'Professional Certification'
  | 'Medical'
  | 'Law'
  | 'Technology'
  | 'Business'
  | 'Language Learning'
  | string;

export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Exam preparation';

export type LearningGoal = 
  | 'Understand classes'
  | 'Understand my classes'
  | 'Prepare for exams'
  | 'Improve grades'
  | 'Improve my grades'
  | 'Learn a subject'
  | 'Learn a new subject'
  | 'Prepare for certification'
  | 'Prepare for a certification'
  | 'Build practical skills'
  | string;

export type LearningStyle = 
  | 'Reading'
  | 'Watching explanations'
  | 'Listening'
  | 'Practice questions'
  | 'Flashcards'
  | 'Interactive tutoring'
  | 'A mixture of everything';

export type StudyTimePerDay = '15 minutes' | '30 minutes' | '1 hour' | '2 hours' | '3+ hours';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  educationLevel: EducationLevel;
  customEducation?: string;
  proficiencyLevel: ProficiencyLevel;
  primaryGoal: LearningGoal;
  learningStyles: LearningStyle[];
  dailyStudyTime: StudyTimePerDay;
  tutorNickname: string;
  onboardingCompleted: boolean;
  streakDays: number;
  totalStudyMinutes: number;
  points: number;
  createdAt: number;
  updatedAt: number;
  selectedTheme?: 'light' | 'dark' | 'system';
  role?: 'student' | 'admin' | 'mentor';
  status?: 'active' | 'suspended';
  suspensionReason?: string;
  suspendedAt?: number;
  tier?: 'free' | 'pro' | 'elite';
  notesCount?: number;
  studySetsCount?: number;
  lastActiveAt?: number;
  isOnline?: boolean;
}

export const ADMIN_EMAIL = 'adedayoademola171@gmail.com';
export const isAdminEmail = (email?: string | null): boolean => 
  Boolean(email && email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase());

/**
 * Returns true if a user has recorded activity within the last 5 minutes
 * and is not currently suspended.
 */
export const isUserOnline = (user?: UserProfile | null, now = Date.now()): boolean => {
  if (!user) return false;
  if (user.status === 'suspended') return false;
  const lastActive = user.lastActiveAt || user.updatedAt || 0;
  if (lastActive > 0 && now - lastActive <= 5 * 60 * 1000) {
    return true;
  }
  if (user.isOnline && lastActive > 0 && now - lastActive <= 15 * 60 * 1000) {
    return true;
  }
  return false;
};

/**
 * Human-readable relative time formatter for Last Seen status
 */
export const formatLastSeen = (timestamp?: number): string => {
  if (!timestamp) return 'Never';
  const now = Date.now();
  const diff = Math.max(0, now - timestamp);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export interface StudyMaterial {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'pptx' | 'txt' | 'youtube' | 'audio' | 'image' | 'text' | 'recording';
  size?: number;
  url?: string;
  content: string; // extracted text or source text
  pageCount?: number;
  uploadedAt: number;
}

export type ProcessingStatus = 'idle' | 'uploading' | 'reading' | 'understanding' | 'generating' | 'ready' | 'error';

export interface StudySet {
  id: string;
  userId: string;
  title: string;
  subject: string;
  description?: string;
  materials: StudyMaterial[];
  status: ProcessingStatus;
  progressPercent: number;
  createdAt: number;
  updatedAt: number;
  weakTopics: string[];
  tags: string[];
  isFavorite?: boolean;
}

export interface CitationRef {
  sourceName: string;
  pageOrTimestamp?: string;
  quote?: string;
}

export interface NoteSection {
  id: string;
  heading: string;
  content: string;
  subsections?: { title: string; content: string }[];
  keyTerms?: { term: string; definition: string }[];
  formulasOrDates?: string[];
  keyTakeaways?: string[];
  citations?: CitationRef[];
}

export interface StudyNote {
  id: string;
  studySetId: string;
  userId: string;
  title: string;
  type: 'quick-summary' | 'standard' | 'comprehensive';
  sections: NoteSection[];
  summary: string;
  sourceReferences: CitationRef[];
  createdAt: number;
  updatedAt: number;
}

export type FlashcardType = 
  | 'term-def' 
  | 'qa' 
  | 'multiple-choice' 
  | 'fill-blank' 
  | 'cloze' 
  | 'concept' 
  | 'formula';

export interface Flashcard {
  id: string;
  studySetId: string;
  userId: string;
  type: FlashcardType;
  front: string;
  back: string;
  options?: string[]; // for multiple choice
  explanation?: string;
  citation?: CitationRef;
  difficulty: 'easy' | 'medium' | 'hard';
  // Spaced repetition fields
  mastery: 'new' | 'learning' | 'mastered';
  intervalDays: number;
  repetitionCount: number;
  easeFactor: number;
  nextReviewDate: number;
  timesReviewed: number;
  timesCorrect: number;
  timesMissed: number;
  createdAt: number;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_blank' | 'scenario';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string | boolean;
  explanation: string;
  citation?: CitationRef;
  topic?: string;
}

export interface Quiz {
  id: string;
  studySetId: string;
  userId: string;
  title: string;
  questions: QuizQuestion[];
  difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  createdAt: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studySetId: string;
  userId: string;
  answers: Record<string, string | boolean>;
  score: number;
  totalQuestions: number;
  accuracy: number;
  weakTopics: string[];
  strongTopics: string[];
  recommendedRevision: string;
  completedAt: number;
}

export interface PracticeTest {
  id: string;
  studySetId: string;
  userId: string;
  title: string;
  durationMinutes: number;
  questions: QuizQuestion[];
  difficulty: string;
  createdAt: number;
}

export interface PracticeTestAttempt {
  id: string;
  testId: string;
  studySetId: string;
  userId: string;
  answers: Record<string, string | boolean>;
  score: number;
  total: number;
  timeUsedSeconds: number;
  weakAreas: string[];
  topicBreakdown: Record<string, { total: number; correct: number }>;
  recommendedRevisionPlan: string[];
  completedAt: number;
}

export type TutorMode = 'Explain' | 'Teach Me' | 'Quiz Me' | 'Give Me a Hint' | 'Explain Simply' | 'Go Deeper';

export interface TutorMessage {
  id: string;
  sessionId: string;
  sender: 'user' | 'nora';
  content: string;
  mode?: TutorMode;
  citations?: CitationRef[];
  interactiveOptions?: string[]; // for interactive follow-up
  questionToStudent?: string;
  chatQuiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    concept: string;
    studentAnswerIndex?: number;
    isCorrect?: boolean;
    submitted?: boolean;
  };
  selfReflection?: {
    studentGraspObserved: 'struggling' | 'partially-understood' | 'mastered';
    identifiedGap?: string;
    demonstratedStrength?: string;
    tutorAdjustmentMade: string;
  };
  timestamp: number;
  imageUrl?: string;
}

export interface TutorSession {
  id: string;
  studySetId?: string;
  userId: string;
  title: string;
  activeMode: TutorMode;
  teachingStyleId?: string;
  identifiedWeakTopics: string[];
  createdAt: number;
  updatedAt: number;
}

export interface InteractiveLessonStep {
  stepNumber: number;
  title: string;
  lecture: string;
  analogies?: string;
  question: string;
  expectedConcept: string;
  hint: string;
}

export interface InteractiveLesson {
  id: string;
  studySetId?: string;
  userId: string;
  topic: string;
  learningObjective: string;
  prerequisites: string[];
  currentStepIndex: number;
  steps: InteractiveLessonStep[];
  completed: boolean;
}

export interface StudyPlanDay {
  dayName: string;
  date: string;
  tasks: {
    id: string;
    topic: string;
    activityType: 'read-notes' | 'flashcards' | 'quiz' | 'tutor-review' | 'practice-test';
    estimatedMinutes: number;
    completed: boolean;
  }[];
}

export interface StudyPlan {
  id: string;
  userId: string;
  studySetId?: string;
  title: string;
  examDate?: string;
  targetSubject: string;
  hoursPerWeek: number;
  currentConfidence: 'low' | 'medium' | 'high';
  schedule: StudyPlanDay[];
  createdAt: number;
  updatedAt: number;
}

export interface AudioLessonScene {
  speaker: string;
  text: string;
  timestampSeconds: number;
}

export interface AudioLesson {
  id: string;
  studySetId: string;
  userId: string;
  title: string;
  mode: 'Quick recap' | 'Detailed lecture' | 'Conversation' | 'Exam revision';
  script: string;
  audioDurationSeconds: number;
  scenes: AudioLessonScene[];
  createdAt: number;
}

export interface ExplainerSlide {
  title: string;
  subtitle?: string;
  bulletPoints: string[];
  narration: string;
  visualDescription: string;
  durationSeconds: number;
  diagramType?: 'flowchart' | 'comparison' | 'hierarchy' | 'formula' | 'timeline' | 'cycle';
  diagramNodes?: { label: string; desc?: string; highlight?: boolean }[];
  avatarExpression?: 'explaining' | 'enthusiastic' | 'questioning' | 'celebrating';
  interactiveCheck?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface ExplainerVideo {
  id: string;
  studySetId: string;
  userId: string;
  topic: string;
  slides: ExplainerSlide[];
  summary: string;
  keyPoints: string[];
  createdAt: number;
}

export interface EssayFeedback {
  id: string;
  userId: string;
  title: string;
  subject: string;
  assignmentType: string;
  originalText: string;
  estimatedScore: number;
  maxScore: number;
  strengths: string[];
  areasToImprove: string[];
  structureScore: number;
  argumentScore: number;
  clarityScore: number;
  grammarScore: number;
  evidenceScore: number;
  suggestedRevision: string;
  feedbackSummary: string;
  createdAt: number;
}

export interface TeachingStyle {
  id: string;
  userId: string;
  name: string;
  description: string;
  skillLevel: 'Beginner' | 'High School' | 'College/University' | 'Postgrad/PhD';
  tone: 'Enthusiastic' | 'Socratic & Challenging' | 'Patient & Gentle' | 'Academic Professor' | 'ELI5 Simple';
  questionDifficulty: 'Easy' | 'Moderate' | 'Demanding';
  explanationDepth: 'Concise' | 'Balanced' | 'Deep Dive';
  isPublic: boolean;
  isDefault?: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number;
  progress: number;
  target: number;
}

export type NotificationType = 
  | 'announcement'
  | 'spaced-review'
  | 'study-reminder'
  | 'streak'
  | 'exam-alert'
  | 'material-ready'
  | 'achievement'
  | 'chat'
  | 'system';

export interface NotificationItem {
  id: string;
  userId: string; // Specific user UID or 'all' for platform broadcasts
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: number;
  priority?: 'normal' | 'high' | 'urgent';
  actionUrl?: string; // Target view like 'review-queue', 'tutor', 'weekly-run', 'library'
  actionLabel?: string; // e.g. "Review Now", "Start Lesson", "View Details"
  sender?: string; // e.g. "Platform Admin", "Nora AI Tutor", "System Alert"
}

export interface UserSubscription {
  userId: string;
  plan: 'free' | 'student' | 'pro';
  status: 'active' | 'trialing' | 'cancelled';
  renewalDate: number;
  limits: {
    monthlyGenerations: number;
    fileUploadsRemaining: number;
    audioLessonsRemaining: number;
    storageUsedMB: number;
    storageLimitMB: number;
  };
}

export interface StudentCognitiveMemory {
  id: string; // usually userId
  userId: string;
  learnedKnowledgeGaps: string[]; // e.g. ["Trouble with osmotic pressure formulas", "Confuses meiosis vs mitosis"]
  demonstratedStrengths: string[]; // e.g. ["Mastered citric acid cycle", "Quick with constitutional law citations"]
  preferredExplanations: {
    usesAnalogies: boolean;
    technicalDepth: 'simplified' | 'balanced' | 'rigorous';
    pacingSpeed: 'deliberate' | 'standard' | 'accelerated';
    effectiveHooks: string[]; // e.g. ["Sports analogies", "Code snippets", "Medical case studies"]
  };
  recurringMistakesCount: Record<string, number>; // topic -> mistakes count
  noraPedagogicalStrategy: {
    strategyName: string;
    focusAreas: string[];
    recentSelfAdjustment: string; // What Nora changed to teach this student better
    adaptationLevel: number; // 1-100 evolution level
    totalInteractionsReflected: number;
  };
  lastSelfReflectionAt: number;
  updatedAt: number;
}

export interface TeachingEvolutionLog {
  id: string;
  userId: string;
  interactionSummary: string;
  studentGraspObserved: 'struggling' | 'partially-understood' | 'mastered';
  identifiedGap?: string;
  tutorAdjustmentMade: string; // What Nora changed about her approach
  timestamp: number;
}

// Spaced Repetition Review Queue (Anki-style 1, 3, 7 days)
export type SpacedRepetitionStage = 1 | 2 | 3 | 4; // 1 = Day 1 (1d ago), 2 = Day 3 (3d ago), 3 = Day 7 (7d ago), 4 = Mastered

export type AnkiRating = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewLessonItem {
  id: string;
  userId: string;
  studySetId?: string;
  title: string;
  subject: string;
  lessonType: 'interactive-lesson' | 'study-set' | 'notes-summary' | 'audio-lecture' | 'flashcards' | 'quiz';
  completedAt: number; // timestamp when lesson was originally completed
  repetitionStage: SpacedRepetitionStage; // 1, 2, 3, 4
  targetIntervalDays: number; // 1, 3, 7, 14, etc.
  lastReviewedAt?: number;
  nextReviewDate: number; // timestamp when review is due
  easeFactor: number; // standard Anki starting factor 2.5
  timesReviewed: number;
  timesCorrect: number;
  timesAgain: number;
  retentionScore: number; // 0 - 100%
  keyConcepts: string[];
  summarySnippet: string;
  promptQuestion?: string;
  promptAnswer?: string;
}

export * from './weeklyRun';

export interface MaintenanceModeConfig {
  isActive: boolean;
  title: string;
  message: string;
  estimatedDuration?: string;
  startTime?: number;
  expectedEndTime?: number;
  updatedAt: number;
  updatedBy?: string;
  reasonCategory?: 'scheduled' | 'emergency' | 'upgrade' | 'optimization';
}

export interface PushNotificationPreferences {
  dailyStudyReminder: boolean;
  preferredStudyTime: string; // e.g. "09:00", "18:00", "20:00"
  spacedReviewAlerts: boolean; // Anki 1, 3, 7 day reviews
  streakProtectionAlerts: boolean; // Remind before streak resets at midnight
  tutorCheckIns: boolean; // Socratic voice dialogue / Nora check-ins
  adminAnnouncements: boolean; // Urgent maintenance & platform updates
  quietHoursEnabled: boolean; // Mute during quiet hours
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "08:00"
}

export const DEFAULT_PUSH_PREFERENCES: PushNotificationPreferences = {
  dailyStudyReminder: true,
  preferredStudyTime: '18:00',
  spacedReviewAlerts: true,
  streakProtectionAlerts: true,
  tutorCheckIns: true,
  adminAnnouncements: true,
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00'
};

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushDeviceRecord {
  id: string;
  userId: string;
  userEmail?: string;
  endpoint: string;
  keys?: PushSubscriptionKeys;
  fcmToken?: string;
  deviceType: 'android' | 'ios' | 'desktop' | 'mobile' | 'unknown';
  browser: string;
  userAgent: string;
  enabled: boolean;
  preferences: PushNotificationPreferences;
  createdAt: number;
  updatedAt: number;
  lastSeenAt: number;
}

export interface PushSendPayload {
  title: string;
  message: string;
  url?: string;
  actionUrl?: string;
  actionLabel?: string;
  type?: NotificationType;
  priority?: 'normal' | 'high' | 'urgent';
  icon?: string;
  badge?: string;
  tag?: string;
  targetUserId?: string; // 'all' or specific userId
}

export interface LastStudyActivity {
  type: 'lesson' | 'quiz' | 'flashcards' | 'tutor' | 'reading' | 'audio-lesson' | 'practice-test' | 'study-plan';
  courseId?: string;
  courseTitle?: string;
  subject: string;
  topic: string;
  lessonId?: string;
  lessonTitle?: string;
  sectionHeading?: string;
  sectionIndex?: number;
  totalSections?: number;
  isCompleted: boolean;
  score?: number; // e.g. quiz accuracy %
  timestamp: number;
}

export interface WeakLearningArea {
  topic: string;
  subject: string;
  accuracy?: number;
  identifiedFrom: 'quiz' | 'tutor' | 'practice-test';
  timestamp: number;
}

export interface RecommendedNextStep {
  action: 'resume-lesson' | 'review-weakness' | 'spaced-review' | 'start-plan-session' | 'continue-subject';
  title: string;
  subject: string;
  topic: string;
  targetUrl: string;
  rationale: string;
}

export interface StudentLearningMemory {
  userId: string;
  userEmail?: string;
  currentCourse?: {
    id: string;
    title: string;
    subject: string;
  };
  currentSubject: string;
  currentTopic: string;
  lastLessonAccessed?: {
    id: string;
    title: string;
    courseId?: string;
    courseTitle?: string;
    subject: string;
    topic?: string;
    sectionHeading?: string;
    sectionIndex: number;
    totalSections: number;
    isCompleted: boolean;
    timestamp: number;
  };
  completedLessons: Array<{
    lessonId: string;
    title: string;
    subject: string;
    topic?: string;
    completedAt: number;
  }>;
  unfinishedLessons: Array<{
    lessonId: string;
    title: string;
    subject: string;
    topic?: string;
    sectionIndex: number;
    totalSections: number;
    lastAccessedAt: number;
  }>;
  lastStudyActivity?: LastStudyActivity;
  weakAreas: WeakLearningArea[];
  recommendedNextStep?: RecommendedNextStep;
  preferredStudyTimes?: string[];
  timeZone?: string;
  lastReminderSentAt?: number;
  lastReminderType?: string;
  remindersPaused?: boolean;
  updatedAt: number;
}

export type ReminderRuleCategory = 
  | 'resume_lesson' 
  | 'practice_weakness' 
  | 'spaced_review_due' 
  | 'planned_study_due' 
  | 'streak_protection'
  | 'general_revision';

export interface AutomatedReminderLog {
  id: string;
  userId: string;
  userEmail?: string;
  ruleCategory: ReminderRuleCategory;
  groundedFacts: {
    subject: string;
    topic: string;
    lessonTitle?: string;
    weakArea?: string;
    lastActiveHoursAgo: number;
  };
  generatedTitle: string;
  generatedMessage: string;
  actionUrl: string;
  actionLabel: string;
  devicesDelivered: number;
  status: 'delivered' | 'failed' | 'quiet_hours_skipped' | 'rate_limited';
  timestamp: number;
}

// User Complaints & Issue Reporting Types
export type ComplaintCategory = 
  | 'technical_bug' 
  | 'ai_tutor' 
  | 'content_material' 
  | 'account_billing' 
  | 'feature_request' 
  | 'other';

export type ComplaintPriority = 'low' | 'medium' | 'high';

export type ComplaintStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';

export interface UserComplaint {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  title: string;
  description: string;
  relatedSetTitle?: string;
  status: ComplaintStatus;
  adminResponse?: string;
  adminResponderEmail?: string;
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
}

// Community & Study Group Chat Types
export type CommunityRoomId = 
  | 'general-lounge' 
  | 'exam-prep' 
  | 'study-partners' 
  | 'nora-tips' 
  | 'stem-hub' 
  | 'humanities-law';

export interface CommunityRoom {
  id: CommunityRoomId;
  name: string;
  topic: string;
  icon: string;
  category: 'campus' | 'academics' | 'ai';
  description: string;
  badge?: string;
}

export interface CommunityMessage {
  id: string;
  roomId: CommunityRoomId;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatarUrl?: string;
  isAdmin: boolean;
  userRole?: string;
  userCourse?: string;
  text: string;
  reactions?: Record<string, string[]>; // emoji: [userId, ...]
  replyTo?: {
    messageId: string;
    userName: string;
    textSnippet: string;
    isAdmin?: boolean;
  };
  attachment?: {
    type: 'study_set' | 'flashcards' | 'topic';
    title: string;
    id?: string;
  };
  createdAt: number;
  updatedAt?: number;
}

export interface UserPresence {
  uid: string;
  email?: string;
  displayName: string;
  avatarUrl?: string;
  isAdmin?: boolean;
  activeRoomId?: CommunityRoomId;
  lastSeen: number;
}


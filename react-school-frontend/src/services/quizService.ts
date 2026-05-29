import api from "@/services/api";


export interface QuizQuestion {
  id: number;
  questionText: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  points: number;
  orderNumber: number;
  options: Array<{ id: number; optionText: string; optionIndex: number }>;
  correctAnswer: string | number[];
  givenAnswer?: string;
  isCorrect?: boolean;
}

export interface QuizDetails {
  id: number;
  title: string;
  description: string;
  type: string;
  totalPoints: number;
  totalQuestions: number;
  showCorrectAnswers: boolean;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: number;
  status: string;
  scorePercent: number | null;
  pointsAwarded: number | null;
  startedAt: string;
  submittedAt: string;
}

export interface QuizSummary {
  id: number;
  title: string;
  description: string;
  type: string;
  courseId: number | null;
  courseTitle: string;
  lessonId: number | null;
  lessonTitle: string;
  totalPoints: number;
  showCorrectAnswers: boolean;
  totalQuestions: number;
}

// Returned by startQuizAttempt — covers all backend response shapes
export interface StartAttemptResult {
  success: false;
  message: string;
}

export interface StartAttemptSuccess {
  success: true;
  id: number;
  status: string;
  scorePercent: number | null;
  pointsAwarded: number | null;
  startedAt: string;
  submittedAt: string;
  resumed: boolean;
}

export type StartAttemptResponse = StartAttemptResult | StartAttemptSuccess;

type RawQuestion = {
  id?: number | null;
  questionText?: string | null;
  type?: string | null;
  questionType?: string | null;
  points?: number | null;
  orderNumber?: number | null;
  options?: Array<string | { id?: number | null; optionText?: string | null; optionIndex?: number | null }> | null;
  correctAnswer?: string | number[] | null;
  givenAnswer?: string | number[] | null;
  isCorrect?: boolean | null;
};

type RawQuiz = {
  id?: number | null;
  title?: string | null;
  description?: string | null;
  type?: string | null;
  quizType?: string | null;
  courseId?: number | null;
  courseTitle?: string | null;
  lessonId?: number | null;
  lessonTitle?: string | null;
  questionCount?: number | null;
  totalPoints?: number | null;
  totalePoints?: number | null;
  showCorrectAnswers?: boolean | null;
  totalQuestions?: number | null;
  questions?: RawQuestion[] | null;
};

type RawAttempt = {
  id?: number | null;
  status?: string | null;
  scorePercent?: number | null;
  pointsAwarded?: number | null;
  startedAt?: string | null;
  submittedAt?: string | null;
};

const normalizeQuestion = (question: RawQuestion): QuizQuestion => ({
  id: question.id ?? 0,
  questionText: question.questionText ?? "",
  type: (question.type ?? question.questionType ?? "SHORT_ANSWER") as QuizQuestion["type"],
  points: question.points ?? 0,
  orderNumber: question.orderNumber ?? 0,
  options: Array.isArray(question.options)
    ? question.options.map((option, index) =>
        typeof option === "string"
          ? { id: index, optionText: option, optionIndex: index }
          : {
              id: option.id ?? index,
              optionText: option.optionText ?? "",
              optionIndex: option.optionIndex ?? index,
            }
      )
    : [],
  correctAnswer: question.correctAnswer ?? "",
  givenAnswer:
    typeof question.givenAnswer === "string"
      ? question.givenAnswer
      : Array.isArray(question.givenAnswer)
        ? question.givenAnswer.join(",")
        : undefined,
  isCorrect: question.isCorrect ?? undefined,
});

const normalizeAttempt = (attempt: RawAttempt): QuizAttempt => ({
  id: attempt.id ?? 0,
  status: attempt.status ?? "",
  scorePercent: attempt.scorePercent ?? null,
  pointsAwarded: attempt.pointsAwarded ?? null,
  startedAt: attempt.startedAt ?? "",
  submittedAt: attempt.submittedAt ?? "",
});

export const completeCourse = async (
  studentId: number,
  courseId: number
): Promise<void> => {
  await api.post(`/courses/${courseId}/complete`, null, {
    params: { studentId },
  });
};

const resolveTotalQuestions = (quiz: RawQuiz): number => {
  if (Array.isArray(quiz.questions)) return quiz.questions.length;
  return quiz.questionCount ?? quiz.totalQuestions ?? 0;
};

export const getQuizById = async (quizId: number, studentId: number, attemptId?: number) => {
  const { data } = await api.get(`/quizzes/${quizId}`, {
    params: { studentId, ...(attemptId ? { attemptId } : {}) },
  });
  const quiz = (data ?? {}) as RawQuiz;

  return {
    id: quiz.id ?? quizId,
    title: quiz.title ?? "Quiz",
    description: quiz.description ?? "",
    type: quiz.quizType ?? quiz.type ?? "",
    totalPoints: quiz.totalPoints ?? quiz.totalePoints ?? 0,
    totalQuestions: resolveTotalQuestions(quiz),
    showCorrectAnswers: Boolean(quiz.showCorrectAnswers),
    questions: Array.isArray(quiz.questions) ? quiz.questions.map(normalizeQuestion) : [],
  } satisfies QuizDetails;
};

export const getQuizzesByLesson = async (lessonId: number) => {
  const { data } = await api.get(`/lessons/${lessonId}/quizzes`);
  const list = Array.isArray(data) ? (data as RawQuiz[]) : [];
  return list.map((quiz) => ({
    id: quiz.id ?? 0,
    title: quiz.title ?? "Quiz",
    description: quiz.description ?? "",
    type: quiz.quizType ?? quiz.type ?? "",
    courseId: quiz.courseId ?? null,
    courseTitle: quiz.courseTitle ?? "",
    lessonId: quiz.lessonId ?? null,
    lessonTitle: quiz.lessonTitle ?? "",
    totalPoints: quiz.totalPoints ?? quiz.totalePoints ?? 0,
    showCorrectAnswers: Boolean(quiz.showCorrectAnswers),
    totalQuestions: resolveTotalQuestions(quiz),
  })) satisfies QuizSummary[];
};

export const getQuizzesByCourse = async (courseId: number) => {
  const { data } = await api.get(`/courses/${courseId}/quizzes`);
  const list = Array.isArray(data) ? (data as RawQuiz[]) : [];

  return list.map((quiz) => ({
    id: quiz.id ?? 0,
    title: quiz.title ?? "Quiz",
    description: quiz.description ?? "",
    type: quiz.quizType ?? quiz.type ?? "",
    courseId: quiz.courseId ?? null,
    courseTitle: quiz.courseTitle ?? "",
    lessonId: quiz.lessonId ?? null,
    lessonTitle: quiz.lessonTitle ?? "",
    totalPoints: quiz.totalPoints ?? quiz.totalePoints ?? 0,
    showCorrectAnswers: Boolean(quiz.showCorrectAnswers),
    totalQuestions: resolveTotalQuestions(quiz),
  })) satisfies QuizSummary[];
};

export const startQuizAttempt = async (
  quizId: number,
  studentId: number,
  // FIX: renamed from previousAttemptId — this is the attemptId the backend
  // controller uses to filter wrong questions for retake mode.
  // The backend @RequestParam is just "studentId", so we only pass that.
  // The retake context (which questions to show) is handled by getQuizById,
  // not by startAttempt.
  _previousAttemptId?: number
): Promise<StartAttemptResponse> => {
  const { data } = await api.post(`/quizzes/${quizId}/attempts`, null, {
    // FIX: only send studentId — backend controller only accepts this param.
    // Sending unknown params caused silent failures on some accounts.
    params: { studentId },
  });

  console.log("startAttempt raw response:", JSON.stringify(data, null, 2));

  // Backend returns { success: false, message: "..." } when student already
  // scored 100% — pass through as-is so the frontend shows the right screen
  if (data?.success === false) {
    return { success: false, message: data.message ?? "Already completed." };
  }

  // Normal response: { attempt: {...}, resumed: bool } or the attempt directly
  const attemptData = data?.attempt ?? data;

  console.log("attemptData being normalized:", JSON.stringify(attemptData, null, 2));

  const normalized = normalizeAttempt(attemptData);

  console.log("normalized attempt:", normalized);

  // Guard: if the resumed attempt is already submitted/completed, we cannot
  // use it for submission — return a clear error so the UI can handle it
  if (
    data?.resumed === true &&
    (attemptData?.status === "SUBMITTED" || attemptData?.status === "COMPLETED")
  ) {
    console.warn("Resumed attempt is already submitted — treating as completed");
    return { success: false, message: "Your previous attempt was already submitted." };
  }

  return {
    success: true,
    ...normalized,
    resumed: data?.resumed ?? false,
  };
};

export const submitQuizAttempt = async (
  attemptId: number,
  answers: Record<number, string | number[]>
) => {
  const backendAnswers: Record<number, string | number[]> = {};
  for (const [qId, answer] of Object.entries(answers)) {
    const id = Number(qId);
    if (Array.isArray(answer)) {
      backendAnswers[id] = [...answer].sort((a, b) => a - b);
    } else {
      backendAnswers[id] = String(answer);
    }
  }

  console.log("Submitting attemptId:", attemptId, "answers:", backendAnswers);

  const { data } = await api.post("/quizzes/submit", {
    attemptId,
    answers: backendAnswers,
  });

  console.log("SUBMIT RESPONSE:", JSON.stringify(data, null, 2));

  const quiz = (data ?? {}) as RawQuiz;

  const result = {
    id: quiz.id ?? 0,
    title: quiz.title ?? "Quiz",
    description: quiz.description ?? "",
    type: quiz.quizType ?? quiz.type ?? "",
    totalPoints: quiz.totalPoints ?? quiz.totalePoints ?? 0,
    totalQuestions: resolveTotalQuestions(quiz),
    showCorrectAnswers: Boolean(quiz.showCorrectAnswers),
    questions: Array.isArray(quiz.questions)
      ? quiz.questions.map(normalizeQuestion)
      : [],
  } satisfies QuizDetails;

  const allCorrect =
    result.questions.length > 0 &&
    result.questions.every((q) => q.isCorrect === true);

  if (allCorrect) {
    window.dispatchEvent(new CustomEvent("student-notifications-changed"));
  }

  return result;
};

export const getWrongQuestions = async (attemptId: number) => {
  const { data } = await api.get(`/attempts/${attemptId}/wrong-questions`);
  return Array.isArray(data) ? data.map((id) => Number(id)) : [];
};

export const getQuizHistory = async (quizId: number, studentId: number) => {
  const { data } = await api.get(`/quizzes/${quizId}/history`, {
    params: { studentId },
  });
  return Array.isArray(data) ? data.map(normalizeAttempt) : [];
};

export const getBestQuizAttempt = async (quizId: number, studentId: number) => {
  try {
    const { data } = await api.get(`/quizzes/${quizId}/best`, {
      params: { studentId },
    });
    return normalizeAttempt(data);
  } catch {
    return null;
  }
};
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  RotateCcw,
  Trophy,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getUser } from "@/services/authStorage";
import {
  getQuizById,
  getQuizHistory,
  getWrongQuestions,
  startQuizAttempt,
  submitQuizAttempt,
  type QuizAttempt,
  type QuizDetails,
} from "@/services/quizService";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getBestFromHistory = (history: QuizAttempt[]): QuizAttempt | null => {
  if (!history || history.length === 0) return null;

  return history.reduce<QuizAttempt>((best, current) => {
    const bestScore = best.scorePercent ?? -1;
    const currentScore = current.scorePercent ?? -1;
    return currentScore > bestScore ? current : best;
  }, history[0]);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const QuizPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = getUser();
  const studentId = Number(user?.userId ?? 0);
  const retakeAttemptId = Number(searchParams.get("attemptId") ?? 0) || null;

  // ========================================================================
  // STATE
  // ========================================================================

  const [quiz, setQuiz] = useState<QuizDetails | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [bestAttempt, setBestAttempt] = useState<QuizAttempt | null>(null);
  // Use null as the "not set" sentinel — 0 is falsy and would block submission
  const [attemptId, setAttemptId] = useState<number | null>(null);
  // FIX: tracks when the student already scored 100% and cannot retake
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | number[]>>({});
  const [submitted, setSubmitted] = useState(false);
  // FIX: prevents double-submission
  const [submitting, setSubmitting] = useState(false);
  const [latestResult, setLatestResult] = useState<QuizAttempt | null>(null);
  const [submissionDetails, setSubmissionDetails] = useState<QuizDetails | null>(null);
  const [wrongQuestionIds, setWrongQuestionIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ========================================================================
  // EFFECTS
  // ========================================================================

  useEffect(() => {
    if (!id || !studentId) {
      navigate("/login");
      return;
    }

    loadQuizData();
  }, [id, navigate, retakeAttemptId, studentId]);

  // ========================================================================
  // DATA LOADING
  // ========================================================================

  const loadQuizData = async () => {
    setLoading(true);
    setError(null);
    try {
      const quizId = Number(id);

      if (isNaN(quizId) || quizId <= 0) {
        setError("Invalid quiz ID");
        return;
      }

      const [quizData, history, wrongQuestions] = await Promise.all([
        getQuizById(quizId, studentId, retakeAttemptId ?? undefined),
        getQuizHistory(quizId, studentId),
        retakeAttemptId ? getWrongQuestions(retakeAttemptId) : Promise.resolve([]),
      ]);

      if (!quizData) {
        setError("Quiz not found or you don't have access to it");
        return;
      }

      if (!quizData.questions || quizData.questions.length === 0) {
        setError("Quiz has no questions");
        return;
      }

      setQuiz(quizData);
      setAttempts(Array.isArray(history) ? history : []);
      setBestAttempt(getBestFromHistory(Array.isArray(history) ? history : []));
      setWrongQuestionIds(Array.isArray(wrongQuestions) ? wrongQuestions : []);
    } catch (err) {
      console.error("Failed to load quiz:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load quiz. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // QUIZ HANDLERS
  // ========================================================================

  const latestScore = latestResult?.scorePercent ?? null;
  const isPerfect = latestScore === 100;

  const startQuiz = useCallback(async () => {
    if (!quiz) return;
    try {
      setError(null);
      const startedAttempt = await startQuizAttempt(
        quiz.id,
        studentId,
        retakeAttemptId ?? undefined
      );

      // Backend returns { success: false } when student already scored 100%
      if (startedAttempt.success === false) {
        setAlreadyCompleted(true);
        return;
      }

      // success: true — id is directly on the normalized attempt object
      const resolvedId = startedAttempt.id ?? null;

      if (resolvedId === null) {
        console.error("startQuizAttempt returned no valid ID:", startedAttempt);
        setError("Failed to start quiz: server returned an invalid attempt ID.");
        return;
      }

      setAttemptId(resolvedId);
      setStarted(true);
      setCurrentQ(0);
      setAnswers({});
      setSubmitted(false);
      setLatestResult(null);
      setSubmissionDetails(null);
    } catch (err) {
      console.error("Failed to start quiz:", err);
      setError("Failed to start quiz. Please try again.");
      // Reset so the user sees the error and can retry
      setStarted(false);
    }
  }, [quiz, studentId, retakeAttemptId]);

  const setAnswer = (questionId: number, value: string) => {
    setAnswers((previous) => ({ ...previous, [questionId]: value }));
  };

  const setIndexedAnswer = (questionId: number, value: number[]) => {
    setAnswers((previous) => ({ ...previous, [questionId]: value }));
  };

  const submitQuiz = async () => {
    // FIX: strict null check — 0 is a valid ID but falsy, never use !attemptId
    // Also guard against double-submission with submitting flag
    if (attemptId === null || !quiz || submitting) return;
    try {
      setSubmitting(true);
      setError(null);
      const submission = await submitQuizAttempt(attemptId, answers);

      const history = await getQuizHistory(quiz.id, studentId);
      setAttempts(Array.isArray(history) ? history : []);
      setBestAttempt(getBestFromHistory(Array.isArray(history) ? history : []));

      // Use first history entry; fall back to building one from submission data
      const latest = history?.[0] ?? {
        id: attemptId,
        status: "completed",
        scorePercent: null as number | null,
        pointsAwarded: null,
        startedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
      };

      // Calculate score from submission if history doesn't include it yet
      if (latest.scorePercent === null && submission.questions.length > 0) {
        const correctCount = submission.questions.filter((q) => q.isCorrect).length;
        latest.scorePercent = Math.round(
          (correctCount / submission.questions.length) * 100
        );
      }

      setLatestResult(latest);
      setSubmissionDetails(submission);
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit quiz:", err);
      setError("Failed to submit quiz. Please try again.");
      // FIX: unlock only on error so the student can retry
      setSubmitting(false);
    }
  };

  const retryWrongQuestions = async () => {
    if (!quiz || !latestResult) return;
    try {
      setError(null);
      const [wrongOnlyQuiz, wrongIds] = await Promise.all([
        getQuizById(quiz.id, studentId, latestResult.id),
        getWrongQuestions(latestResult.id),
      ]);
      const startedAttempt = await startQuizAttempt(quiz.id, studentId, latestResult.id);

      // success: false means already completed — shouldn't happen in retry flow,
      // but guard anyway
      if (startedAttempt.success === false) {
        setError(startedAttempt.message ?? "Cannot retry this quiz.");
        return;
      }

      const resolvedId = startedAttempt.id ?? null;

      if (resolvedId === null) {
        console.error("startQuizAttempt (retry) returned no valid ID:", startedAttempt);
        setError("Failed to start retry: server returned an invalid attempt ID.");
        return;
      }

      setQuiz(wrongOnlyQuiz);
      setWrongQuestionIds(Array.isArray(wrongIds) ? wrongIds : []);
      setAttemptId(resolvedId);
      setStarted(true);
      setCurrentQ(0);
      setAnswers({});
      setSubmitted(false);
      setSubmitting(false);
      setLatestResult(null);
      setSubmissionDetails(null);
      navigate(`/quiz/${quiz.id}?attemptId=${latestResult.id}`, { replace: true });
    } catch (err) {
      console.error("Failed to retry wrong questions:", err);
      setError("Failed to load wrong questions. Please try again.");
    }
  };

  const currentQuestion = useMemo(
    () => (quiz ? quiz.questions[currentQ] : null),
    [currentQ, quiz]
  );

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (loading) {
    return (
      <StudentLayout activeItem="Courses">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </StudentLayout>
    );
  }

  // ========================================================================
  // ERROR STATE
  // ========================================================================

  if (error || !quiz) {
    return (
      <StudentLayout activeItem="Courses">
        <Card className="rounded-2xl shadow-md border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-red-700 mb-2">
              {error || "Quiz not found"}
            </h1>
            <Button onClick={() => navigate(-1)} className="rounded-2xl mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </StudentLayout>
    );
  }

  // ========================================================================
  // ALREADY COMPLETED STATE (scored 100% — cannot retake)
  // ========================================================================

  if (alreadyCompleted) {
    return (
      <StudentLayout activeItem="Courses">
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Quiz Already Completed!
            </h1>
            <p className="text-muted-foreground mb-6">
              You already submitted this quiz and scored{" "}
              <span className="font-bold text-green-600">100%</span>. All your
              answers are correct — there is nothing left to retry!
            </p>
            {bestAttempt && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 inline-block">
                <p className="text-green-800 font-semibold text-lg">
                  🏆 Best Score: {bestAttempt.scorePercent ?? 0}%
                </p>
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="rounded-2xl"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </StudentLayout>
    );
  }

  // ========================================================================
  // QUIZ INFO STATE (Before Starting)
  // ========================================================================

  if (!started) {
    return (
      <StudentLayout activeItem="Courses">
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-8 text-center">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {quiz.title}
            </h1>
            {quiz.type && (
              <Badge className="rounded-full px-3 py-1 mb-3">
                {quiz.type.replace(/_/g, " ")}
              </Badge>
            )}
            <p className="text-muted-foreground mb-4">
              {quiz.totalQuestions} questions
            </p>

            {retakeAttemptId && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-left">
                <p className="text-sm text-amber-800 font-medium mb-2">
                  📝 Retake Mode
                </p>
                <p className="text-sm text-amber-700">
                  You will answer only the wrong questions from your previous
                  attempt.
                </p>
                {wrongQuestionIds.length > 0 && (
                  <p className="text-sm text-amber-700 mt-2">
                    Questions to retry: {wrongQuestionIds.length}
                  </p>
                )}
              </div>
            )}

            {quiz.description && (
              <p className="text-sm text-muted-foreground mb-4">
                {quiz.description}
              </p>
            )}

            {bestAttempt && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-left">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Best Score:</span>{" "}
                  {bestAttempt.scorePercent ?? 0}%
                </p>
              </div>
            )}

            <Button onClick={startQuiz} className="rounded-2xl px-8" size="lg">
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      </StudentLayout>
    );
  }

  // ========================================================================
  // QUIZ SUBMITTED STATE (Results)
  // ========================================================================

  if (submitted) {
    return (
      <StudentLayout activeItem="Courses">
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-8 text-center">
            {isPerfect ? (
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            ) : (
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            )}

            <h1 className="text-2xl font-bold text-foreground mb-2">
              {isPerfect ? "Perfect Score! 🎉" : "Quiz Complete"}
            </h1>

            <div className="bg-primary/10 rounded-lg p-4 mb-4">
              <p className="text-5xl font-bold text-primary">
                {latestResult ? (latestScore ?? 0) : "..."}%
              </p>
            </div>

            {latestResult && (
              <p className="text-muted-foreground mb-2">
                Status:{" "}
                <span className="font-semibold capitalize">
                  {latestResult.status}
                </span>
              </p>
            )}

            {latestResult?.pointsAwarded !== null &&
              latestResult?.pointsAwarded !== undefined && (
                <p className="text-sm text-muted-foreground mb-4">
                  Points awarded: {latestResult.pointsAwarded}
                </p>
              )}

            {submissionDetails && submissionDetails.questions.length > 0 && (
              <div className="text-left bg-muted/40 rounded-xl p-4 mb-4">
                <p className="font-semibold mb-3">Your Answers</p>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {submissionDetails.questions.map((question, index) => (
                    <div
                      key={question.id}
                      className={`text-sm p-2 rounded ${
                        question.isCorrect
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      <span className="font-medium">Q{index + 1}:</span>{" "}
                      {question.isCorrect ? "✓ Correct" : "✗ Wrong"}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bestAttempt && latestResult && latestResult.id !== bestAttempt.id && (
              <p className="text-sm text-muted-foreground mb-4">
                Your best score: {bestAttempt.scorePercent ?? 0}%
              </p>
            )}

            <div className="flex flex-col gap-2 mt-6">
              {!isPerfect && latestResult && (
                <Button
                  variant="secondary"
                  onClick={retryWrongQuestions}
                  className="rounded-2xl gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retry Wrong Questions
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setStarted(false)}
                className="rounded-2xl"
              >
                Back to Info
              </Button>
            </div>
          </CardContent>
        </Card>
      </StudentLayout>
    );
  }

  if (!currentQuestion) {
    return (
      <StudentLayout activeItem="Courses">
        <Card className="rounded-2xl shadow-md border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-red-700">
              Question not found
            </h1>
            <Button onClick={() => setStarted(false)} className="rounded-2xl mt-4">
              Back to Quiz
            </Button>
          </CardContent>
        </Card>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout activeItem="Courses">
      <Card className="rounded-2xl shadow-md">
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <Badge variant="secondary" className="rounded-full capitalize">
                {currentQuestion.type.replace(/_/g, " ")}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="rounded-full">
                {quiz.type.replace(/_/g, " ")}
              </Badge>
              <span className="text-sm text-muted-foreground font-medium">
                Q {currentQ + 1}/{quiz.questions.length}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` } as React.CSSProperties}
            />
          </div>

          {/* Question */}
          <h2 className="text-lg font-semibold text-foreground">
            {currentQuestion.questionText}
          </h2>

          {/* Answer Input/Options */}
          {currentQuestion.type === "SHORT_ANSWER" ? (
            <textarea
              placeholder="Type your answer... (Enter for new line)"
              rows={3}
              value={
                typeof answers[currentQuestion.id] === "string"
                  ? (answers[currentQuestion.id] as string)
                  : ""
              }
              onChange={(event) =>
                setAnswer(currentQuestion.id, event.target.value)
              }
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          ) : currentQuestion.type === "MULTIPLE_CHOICE" ? (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const selectedAnswers = Array.isArray(answers[currentQuestion.id])
                  ? (answers[currentQuestion.id] as number[])
                  : [];
                const isSelected = selectedAnswers.includes(option.optionIndex);

                return (
                  <label
                    key={`${currentQuestion.id}-${index}`}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setIndexedAnswer(currentQuestion.id, [
                            ...selectedAnswers,
                            option.optionIndex,
                          ]);
                        } else {
                          setIndexedAnswer(
                            currentQuestion.id,
                            selectedAnswers.filter((a) => a !== option.optionIndex)
                          );
                        }
                      }}
                      className="w-4 h-4 cursor-pointer accent-primary"
                    />
                    <span className="font-semibold text-primary mr-2">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span className="text-foreground flex-1">
                      {option.optionText}
                    </span>
                    {isSelected && (
                      <span className="text-xs font-semibold text-primary bg-primary/20 px-2 py-1 rounded-full">
                        Selected
                      </span>
                    )}
                  </label>
                );
              })}
              {answers[currentQuestion.id] && (
                <div className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-2 mt-2">
                  {Array.isArray(answers[currentQuestion.id])
                    ? (answers[currentQuestion.id] as number[]).length
                    : 0}{" "}
                  answer(s) selected
                </div>
              )}
            </div>
          ) : (
            // True/False
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={`${currentQuestion.id}-${index}`}
                  onClick={() =>
                    setIndexedAnswer(currentQuestion.id, [option.optionIndex])
                  }
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    Array.isArray(answers[currentQuestion.id]) &&
                    (answers[currentQuestion.id] as number[]).includes(
                      option.optionIndex
                    )
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="font-semibold text-primary mr-3">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span className="text-foreground">{option.optionText}</span>
                </button>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentQ((value) => value - 1)}
              disabled={currentQ === 0}
              className="rounded-2xl"
            >
              ← Previous
            </Button>

            {currentQ < quiz.questions.length - 1 ? (
              <Button
                onClick={() => setCurrentQ((value) => value + 1)}
                className="rounded-2xl"
              >
                Next →
              </Button>
            ) : (
              <Button
                onClick={submitQuiz}
                disabled={submitting}
                className="rounded-2xl"
              >
                {submitting ? "Submitting..." : "Submit Quiz"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </StudentLayout>
  );
};

export default QuizPage;
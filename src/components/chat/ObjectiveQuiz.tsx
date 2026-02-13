"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { authFetch } from "@/lib/api/authFetch";
import { Button } from "@/components/ui";
import type { QuizQuestion, ObjectiveQuiz as ObjectiveQuizType } from "@/types";

// ===================================
// Objective Quiz Component
// ===================================
// Renders an inline, step-by-step quiz for a single learning objective.
// 4 questions: MC → TF → MC → Short Answer (essay)
// Q1-Q3 auto-graded, Q4 AI-graded via /api/quiz/grade-essay
// ≥3/4 = pass → objective marked complete

interface ObjectiveQuizProps {
  quiz: ObjectiveQuizType;
  onComplete: (quiz: ObjectiveQuizType) => void;
  onCancel: () => void;
}

// ===================================
// Question Type Labels & Icons
// ===================================

const questionMeta: Record<string, { label: string; icon: string }> = {
  multiple_choice: { label: "Multiple Choice", icon: "🔘" },
  true_false: { label: "True / False", icon: "⚖️" },
  short_answer: { label: "Explain It", icon: "✍️" },
};

// ===================================
// Single Question View
// ===================================

interface QuestionViewProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: number | string) => void;
  isGrading: boolean;
  result: { isCorrect: boolean; feedback?: string } | null;
  onNext: () => void;
  isLast: boolean;
}

function QuestionView({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  isGrading,
  result,
  onNext,
  isLast,
}: QuestionViewProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [essayText, setEssayText] = useState("");
  const meta = questionMeta[question.type] || { label: "Question", icon: "❓" };

  const hasAnswered = result !== null;

  const handleSubmit = () => {
    if (question.type === "short_answer") {
      if (essayText.trim().length > 0) {
        onAnswer(essayText.trim());
      }
    } else if (selectedOption !== null) {
      onAnswer(selectedOption);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">{meta.icon}</span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {meta.label}
          </span>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {questionNumber} of {totalQuestions}
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {Array.from({ length: totalQuestions }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < questionNumber - 1
                ? "bg-green-400 dark:bg-green-500"
                : i === questionNumber - 1
                ? "bg-blue-500 dark:bg-blue-400"
                : "bg-gray-200 dark:bg-gray-700"
            }`}
          />
        ))}
      </div>

      {/* Question text */}
      <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
        {question.question}
      </p>

      {/* Answer area */}
      {question.type === "short_answer" ? (
        <div className="space-y-2">
          <textarea
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
            disabled={hasAnswered || isGrading}
            placeholder="Explain in your own words... (at least a couple of sentences)"
            rows={4}
            className="w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
            style={{ fontSize: "16px" }}
          />
          {!hasAnswered && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {essayText.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {question.options?.map((option, i) => {
            let optionStyle = "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10";

            if (hasAnswered) {
              if (i === question.correctAnswer) {
                optionStyle = "border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20";
              } else if (i === selectedOption && !result.isCorrect) {
                optionStyle = "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20";
              } else {
                optionStyle = "border-gray-200 dark:border-gray-700 opacity-50";
              }
            } else if (i === selectedOption) {
              optionStyle = "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20";
            }

            return (
              <button
                key={i}
                onClick={() => !hasAnswered && !isGrading && setSelectedOption(i)}
                disabled={hasAnswered || isGrading}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm transition-all ${optionStyle} disabled:cursor-default`}
              >
                <span className="flex items-center gap-3">
                  {hasAnswered ? (
                    i === question.correctAnswer ? (
                      <span className="text-green-600 dark:text-green-400 text-base">✓</span>
                    ) : i === selectedOption && !result.isCorrect ? (
                      <span className="text-red-500 dark:text-red-400 text-base">✗</span>
                    ) : (
                      <span className="w-4" />
                    )
                  ) : (
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                        i === selectedOption
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {i === selectedOption && (
                        <span className="block w-2 h-2 bg-white rounded-full m-0.5" />
                      )}
                    </span>
                  )}
                  <span className="text-gray-800 dark:text-gray-200">{option}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Result feedback */}
      {hasAnswered && (
        <div
          className={`px-4 py-3 rounded-lg text-sm ${
            result.isCorrect
              ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800"
              : "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800"
          }`}
        >
          <span className="font-medium">
            {result.isCorrect ? "✓ Correct!" : "✗ Not quite."}
          </span>
          {result.feedback && (
            <p className="mt-1 text-sm opacity-90">{result.feedback}</p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-2 pt-1">
        {!hasAnswered && (
          <Button
            onClick={handleSubmit}
            disabled={
              isGrading ||
              (question.type === "short_answer"
                ? essayText.trim().length === 0
                : selectedOption === null)
            }
            className="px-4 py-2 text-sm"
          >
            {isGrading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span> Grading…
              </span>
            ) : (
              "Submit Answer"
            )}
          </Button>
        )}
        {hasAnswered && (
          <Button
            onClick={onNext}
            className="px-4 py-2 text-sm"
          >
            {isLast ? "See Results" : "Next Question →"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ===================================
// Quiz Results View
// ===================================

interface QuizResultsProps {
  quiz: ObjectiveQuizType;
  onDismiss: () => void;
  onRetry: () => void;
}

function QuizResults({ quiz, onDismiss, onRetry }: QuizResultsProps) {
  const passed = quiz.passed;

  return (
    <div className="space-y-4 text-center">
      {/* Score display */}
      <div className="py-4">
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold ${
            passed
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
              : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
          }`}
        >
          {quiz.score}/4
        </div>
        <h3
          className={`mt-3 text-lg font-semibold ${
            passed
              ? "text-green-700 dark:text-green-300"
              : "text-amber-700 dark:text-amber-300"
          }`}
        >
          {passed ? "🎉 Objective Mastered!" : "Almost there!"}
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {passed
            ? `You've demonstrated solid understanding of "${quiz.objectiveText.length > 50 ? quiz.objectiveText.slice(0, 50) + "…" : quiz.objectiveText}".`
            : "Review the concepts and try again when you're ready. You need at least 3/4 to pass."}
        </p>
      </div>

      {/* Per-question summary */}
      <div className="space-y-1.5 text-left">
        {quiz.questions.map((q, i) => {
          const meta = questionMeta[q.type] || { label: "Q", icon: "❓" };
          return (
            <div
              key={i}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                q.isCorrect
                  ? "bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-300"
                  : "bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300"
              }`}
            >
              <span>{q.isCorrect ? "✓" : "✗"}</span>
              <span>{meta.icon} {meta.label}</span>
              <span className="ml-auto font-medium">{q.isCorrect ? "Correct" : "Incorrect"}</span>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-3 pt-2">
        {passed ? (
          <Button onClick={onDismiss} className="px-6 py-2 text-sm">
            Continue Learning →
          </Button>
        ) : (
          <>
            <button
              onClick={onDismiss}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Continue chatting
            </button>
            <Button onClick={onRetry} className="px-4 py-2 text-sm">
              🔄 Retry Quiz
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ===================================
// Main Quiz Component
// ===================================

export function ObjectiveQuizComponent({ quiz: initialQuiz, onComplete, onCancel }: ObjectiveQuizProps) {
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<ObjectiveQuizType>(initialQuiz);
  const [currentResult, setCurrentResult] = useState<{ isCorrect: boolean; feedback?: string } | null>(null);
  const [isGrading, setIsGrading] = useState(false);

  const currentQuestion = quiz.questions[quiz.currentQuestionIndex];
  const isLastQuestion = quiz.currentQuestionIndex === quiz.questions.length - 1;

  const handleAnswer = async (answer: number | string) => {
    if (!currentQuestion) return;

    const updatedQuestion = { ...currentQuestion, userAnswer: answer };

    if (currentQuestion.type === "short_answer") {
      // AI-grade the essay question
      setIsGrading(true);
      try {
        const response = await authFetch(user!, "/api/quiz/grade-essay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            objective: quiz.objectiveText,
            question: currentQuestion.question,
            modelAnswer: currentQuestion.modelAnswer,
            userAnswer: answer as string,
          }),
        });

        if (response.ok) {
          const gradeResult = await response.json();
          updatedQuestion.isCorrect = gradeResult.correct;
          updatedQuestion.aiFeedback = gradeResult.feedback;
          setCurrentResult({
            isCorrect: gradeResult.correct,
            feedback: gradeResult.feedback,
          });
        } else {
          // On API failure, be lenient
          updatedQuestion.isCorrect = true;
          updatedQuestion.aiFeedback = "We couldn't grade this automatically, but your effort is noted!";
          setCurrentResult({ isCorrect: true, feedback: updatedQuestion.aiFeedback });
        }
      } catch (err) {
        console.error("Essay grading failed:", err);
        updatedQuestion.isCorrect = true;
        updatedQuestion.aiFeedback = "Grading unavailable — we'll count this one.";
        setCurrentResult({ isCorrect: true, feedback: updatedQuestion.aiFeedback });
      } finally {
        setIsGrading(false);
      }
    } else {
      // Auto-grade MC or TF
      const isCorrect = answer === currentQuestion.correctAnswer;
      updatedQuestion.isCorrect = isCorrect;
      setCurrentResult({
        isCorrect,
        feedback: isCorrect
          ? undefined
          : `The correct answer was: ${currentQuestion.options?.[currentQuestion.correctAnswer!]}`,
      });
    }

    // Update the question in the quiz
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === prev.currentQuestionIndex ? updatedQuestion : q
      ),
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Calculate final score
      const updatedQuestions = quiz.questions.map((q, i) =>
        i === quiz.currentQuestionIndex ? { ...q, ...quiz.questions[i] } : q
      );
      const score = updatedQuestions.filter((q) => q.isCorrect).length;
      const passed = score >= 3;

      const completedQuiz: ObjectiveQuizType = {
        ...quiz,
        status: "completed",
        score,
        passed,
      };
      setQuiz(completedQuiz);
      setCurrentResult(null);
      onComplete(completedQuiz);
    } else {
      // Move to next question
      setQuiz((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
      setCurrentResult(null);
    }
  };

  const handleRetry = () => {
    // Reset quiz state but keep the same questions
    setQuiz((prev) => ({
      ...prev,
      currentQuestionIndex: 0,
      status: "in_progress",
      score: 0,
      passed: false,
      questions: prev.questions.map((q) => ({
        ...q,
        userAnswer: undefined,
        isCorrect: undefined,
        aiFeedback: undefined,
      })),
    }));
    setCurrentResult(null);
  };

  return (
    <div className="mx-9 sm:mx-12 my-3">
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 sm:p-5 shadow-sm">
        {/* Quiz header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📝</span>
            <div>
              <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                Objective Quiz
              </h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 max-w-xs truncate" title={quiz.objectiveText}>
                {quiz.objectiveText}
              </p>
            </div>
          </div>
          {quiz.status !== "completed" && (
            <button
              onClick={onCancel}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors px-2 py-1"
              aria-label="Cancel quiz"
            >
              ✕ Cancel
            </button>
          )}
        </div>

        {/* Quiz content */}
        {quiz.status === "completed" ? (
          <QuizResults
            quiz={quiz}
            onDismiss={onCancel}
            onRetry={handleRetry}
          />
        ) : currentQuestion ? (
          <QuestionView
            question={currentQuestion}
            questionNumber={quiz.currentQuestionIndex + 1}
            totalQuestions={quiz.questions.length}
            onAnswer={handleAnswer}
            isGrading={isGrading}
            result={currentResult}
            onNext={handleNext}
            isLast={isLastQuestion}
          />
        ) : null}
      </div>
    </div>
  );
}

export default ObjectiveQuizComponent;

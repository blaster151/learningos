"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { completeOnboarding } from "@/lib/api/userProfile";
import { Button, Card, CardContent } from "@/components/ui";
import { BrainIcon, ChevronRightIcon, CheckIcon, BookIcon, MessageCircleIcon } from "@/components/icons";

// ===================================
// Types
// ===================================

interface OnboardingData {
  learningGoal: string;
  experienceLevel: string;
  selectedTopics: string[];
  preferredPace: string;
}

// ===================================
// Learning Goals
// ===================================

const learningGoals = [
  {
    id: "career",
    title: "Career Growth",
    description: "Learn skills to advance in my professional career",
    icon: "💼",
  },
  {
    id: "project",
    title: "Build a Project",
    description: "Learn what I need for a specific project",
    icon: "🚀",
  },
  {
    id: "curiosity",
    title: "Personal Interest",
    description: "Explore topics I'm curious about",
    icon: "💡",
  },
  {
    id: "academic",
    title: "Academic Studies",
    description: "Support my school or university learning",
    icon: "🎓",
  },
];

// ===================================
// Experience Levels
// ===================================

const experienceLevels = [
  {
    id: "beginner",
    title: "Beginner",
    description: "I'm new to this and starting fresh",
  },
  {
    id: "intermediate",
    title: "Intermediate",
    description: "I know the basics and want to go deeper",
  },
  {
    id: "advanced",
    title: "Advanced",
    description: "I have solid knowledge and want to master it",
  },
];

// ===================================
// Topics
// ===================================

const availableTopics = [
  { id: "programming", name: "Programming", icon: "💻" },
  { id: "web-dev", name: "Web Development", icon: "🌐" },
  { id: "data-science", name: "Data Science", icon: "📊" },
  { id: "machine-learning", name: "Machine Learning", icon: "🤖" },
  { id: "design", name: "UI/UX Design", icon: "🎨" },
  { id: "devops", name: "DevOps", icon: "⚙️" },
  { id: "mobile", name: "Mobile Development", icon: "📱" },
  { id: "security", name: "Cybersecurity", icon: "🔒" },
  { id: "databases", name: "Databases", icon: "🗄️" },
  { id: "cloud", name: "Cloud Computing", icon: "☁️" },
  { id: "blockchain", name: "Blockchain", icon: "⛓️" },
  { id: "other", name: "Something else", icon: "✨" },
];

// ===================================
// Learning Paces
// ===================================

const learningPaces = [
  {
    id: "relaxed",
    title: "Relaxed",
    description: "A few minutes when I have time",
    sessions: "1-2 sessions/week",
  },
  {
    id: "moderate",
    title: "Moderate",
    description: "Regular learning with steady progress",
    sessions: "3-4 sessions/week",
  },
  {
    id: "intensive",
    title: "Intensive",
    description: "Deep focus and rapid learning",
    sessions: "Daily sessions",
  },
];

// ===================================
// Component
// ===================================

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restored, setRestored] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    learningGoal: "",
    experienceLevel: "",
    selectedTopics: [],
    preferredPace: "",
  });

  const totalSteps = 4;

  // Restore saved onboarding progress from localStorage
  useEffect(() => {
    if (restored) return;
    try {
      const saved = localStorage.getItem("onboarding_progress");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data) setData(parsed.data);
        if (parsed.step && parsed.step >= 1 && parsed.step <= totalSteps) {
          setStep(parsed.step);
        }
      }
    } catch {
      // ignore parse errors
    }
    setRestored(true);
  }, [restored]);

  // Save progress to localStorage whenever step or data changes
  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(
        "onboarding_progress",
        JSON.stringify({ step, data })
      );
    } catch {
      // ignore storage errors
    }
  }, [step, data, restored]);

  // Handle topic selection
  const toggleTopic = (topicId: string) => {
    setData((prev) => ({
      ...prev,
      selectedTopics: prev.selectedTopics.includes(topicId)
        ? prev.selectedTopics.filter((id) => id !== topicId)
        : [...prev.selectedTopics, topicId],
    }));
  };

  // Check if current step is valid
  const isStepValid = () => {
    switch (step) {
      case 1:
        return !!data.learningGoal;
      case 2:
        return !!data.experienceLevel;
      case 3:
        return data.selectedTopics.length > 0;
      case 4:
        return !!data.preferredPace;
      default:
        return false;
    }
  };

  // Handle next step
  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Submit onboarding data
      setIsSubmitting(true);
      try {
        if (user) {
          await completeOnboarding(user, data);
        }
        // Clear saved progress on successful completion
        localStorage.removeItem("onboarding_progress");
        router.push("/dashboard");
      } catch (error) {
        console.error("Failed to save onboarding data:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Handle back
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-4">
            <BrainIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Let&apos;s personalize your learning experience
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Step {step} of {totalSteps}</span>
            <div className="flex items-center gap-3">
              <span>{Math.round((step / totalSteps) * 100)}% complete</span>
              {step > 1 && (
                <button
                  onClick={() => {
                    setStep(1);
                    setData({ learningGoal: "", experienceLevel: "", selectedTopics: [], preferredPace: "" });
                    localStorage.removeItem("onboarding_progress");
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Start over
                </button>
              )}
            </div>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <Card variant="elevated">
          <CardContent>
            {/* Step 1: Learning Goal */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    What brings you to LearningOS?
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    This helps us tailor content to your needs
                  </p>
                </div>
                <div className="grid gap-3">
                  {learningGoals.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => setData((prev) => ({ ...prev, learningGoal: goal.id }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        data.learningGoal === goal.id
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{goal.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">{goal.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{goal.description}</p>
                        </div>
                        {data.learningGoal === goal.id && (
                          <CheckIcon className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Experience Level */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    What&apos;s your experience level?
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    We&apos;ll adjust the complexity to match
                  </p>
                </div>
                <div className="grid gap-3">
                  {experienceLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setData((prev) => ({ ...prev, experienceLevel: level.id }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        data.experienceLevel === level.id
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{level.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{level.description}</p>
                        </div>
                        {data.experienceLevel === level.id && (
                          <CheckIcon className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Topics */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    What do you want to learn?
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Select all topics that interest you
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableTopics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => toggleTopic(topic.id)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        data.selectedTopics.includes(topic.id)
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <span className="text-2xl block mb-1">{topic.icon}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {topic.name}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-2">
                  {data.selectedTopics.length} topic{data.selectedTopics.length !== 1 ? "s" : ""} selected
                </p>
              </div>
            )}

            {/* Step 4: Learning Pace */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    How often do you want to learn?
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    We&apos;ll remind you based on your preference
                  </p>
                </div>
                <div className="grid gap-3">
                  {learningPaces.map((pace) => (
                    <button
                      key={pace.id}
                      onClick={() => setData((prev) => ({ ...prev, preferredPace: pace.id }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        data.preferredPace === pace.id
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{pace.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{pace.description}</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{pace.sessions}</p>
                        </div>
                        {data.preferredPace === pace.id && (
                          <CheckIcon className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={step === 1}
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
                isLoading={isSubmitting}
                rightIcon={step < totalSteps ? <ChevronRightIcon /> : undefined}
              >
                {step < totalSteps ? "Continue" : "Start Learning"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feature Highlights */}
        {step === 1 && (
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
              <BookIcon className="w-6 h-6 text-blue-600 mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white text-sm">Personalized Learning</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                AI adapts to your understanding
              </p>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
              <MessageCircleIcon className="w-6 h-6 text-blue-600 mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white text-sm">Conversational</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Learn through natural dialogue
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

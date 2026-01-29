"use client";

import type { ReflectionAnalysis } from "@/types";

interface ReflectionResultsProps {
  analysis: ReflectionAnalysis;
  onContinue: () => void;
}

export default function ReflectionResults({
  analysis,
  onContinue,
}: ReflectionResultsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Work";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with Score */}
        <div className="px-6 py-6 border-b border-gray-200 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white mb-4">
            <div className="text-3xl font-bold">{analysis.overallScore}</div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Reflection Complete!
          </h2>
          <p className={`text-lg font-semibold mt-1 ${getScoreColor(analysis.overallScore)}`}>
            {getScoreLabel(analysis.overallScore)}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                What You Did Well
              </h3>
              <ul className="space-y-2">
                {analysis.strengths.map((strength, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-gray-700 bg-green-50 p-3 rounded-lg"
                  >
                    <span className="text-green-600">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                </svg>
                Areas to Explore
              </h3>
              <ul className="space-y-2">
                {analysis.suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-gray-700 bg-blue-50 p-3 rounded-lg"
                  >
                    <span className="text-blue-600">💡</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Misconceptions */}
          {analysis.misconceptions.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-yellow-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Points to Clarify
              </h3>
              <div className="space-y-3">
                {analysis.misconceptions.map((misconception, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      misconception.severity === "significant"
                        ? "bg-red-50 border border-red-200"
                        : "bg-yellow-50 border border-yellow-200"
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className={misconception.severity === "significant" ? "text-red-600" : "text-yellow-600"}>
                        ⚠️
                      </span>
                      <p className="text-gray-700 font-medium">
                        {misconception.claim}
                      </p>
                    </div>
                    <div className="pl-7">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Clarification:</span>{" "}
                        {misconception.correction}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concept Updates */}
          {analysis.conceptUpdates.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Mastery Updates
              </h3>
              <div className="space-y-2">
                {analysis.conceptUpdates.map((update) => (
                  <div
                    key={update.conceptId}
                    className="flex items-center justify-between p-3 bg-purple-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {update.conceptName}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="capitalize">{update.previousMastery}</span>
                        {" → "}
                        <span className="capitalize font-medium text-purple-700">
                          {update.newMastery}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {update.confidenceDelta > 0 && (
                        <span className="text-sm font-medium text-green-600">
                          +{Math.round(update.confidenceDelta * 100)}%
                        </span>
                      )}
                      {update.newMastery !== update.previousMastery && (
                        <span className="text-2xl">🎉</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Encouragement */}
          {analysis.encouragement && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <p className="text-gray-700 italic">{analysis.encouragement}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onContinue}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Continue Learning
          </button>
        </div>
      </div>
    </div>
  );
}

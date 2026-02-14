"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth/AuthContext";
import { authFetch } from "@/lib/api/authFetch";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input } from "@/components/ui";
import { Spinner } from "@/components/ui/Spinner";
import { SettingsIcon, UserIcon, LogOutIcon, DownloadIcon, TrashIcon, ShieldIcon, AlertTriangleIcon } from "@/components/icons";
import Image from "next/image";
import Link from "next/link";

interface ProfileData {
  displayName: string;
  learningGoal: string;
  preferredPace: "slow" | "moderate" | "fast";
  experienceLevel: "beginner" | "intermediate" | "advanced";
  selectedTopics: string[];
  metaGoal: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [highlightsEnabled, setHighlightsEnabled] = useState(true);
  const [showUid, setShowUid] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    displayName: "",
    learningGoal: "",
    preferredPace: "moderate",
    experienceLevel: "beginner",
    selectedTopics: [],
    metaGoal: "",
  });
  const [originalData, setOriginalData] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  // Prevent hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  const loadProfile = async () => {
    try {
      if (!user) return;
      const response = await authFetch(user, `/api/users?userId=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        const profile = {
          displayName: data.user?.displayName || user?.displayName || "",
          learningGoal: data.user?.learningGoal || "",
          preferredPace: data.user?.preferredPace || "moderate",
          experienceLevel: data.user?.experienceLevel || "beginner",
          selectedTopics: data.user?.selectedTopics || [],
          metaGoal: data.user?.metaGoal || "",
        };
        setFormData(profile);
        setOriginalData(profile);
        // Load preference — default to true if not set
        setHighlightsEnabled(data.user?.highlightsEnabled !== false);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (!user) return;
      const response = await authFetch(user, `/api/users?userId=${user.uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: formData.displayName,
          learningGoal: formData.learningGoal,
          preferredPace: formData.preferredPace,
          experienceLevel: formData.experienceLevel,
          selectedTopics: formData.selectedTopics,
          metaGoal: formData.metaGoal,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      setOriginalData(formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalData) {
      setFormData(originalData);
    }
    setIsEditing(false);
  };

  const handleToggleHighlights = async () => {
    if (!user) return;
    const newVal = !highlightsEnabled;
    setHighlightsEnabled(newVal);
    try {
      await authFetch(user, `/api/users?userId=${user.uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ highlightsEnabled: newVal }),
      });
    } catch (error) {
      console.error("Failed to update highlight preference:", error);
      setHighlightsEnabled(!newVal); // revert on error
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const response = await authFetch(user, `/api/users/export?userId=${user.uid}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `learningos-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export data:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== "DELETE") return;
    setIsDeleting(true);
    try {
      const response = await authFetch(user, `/api/users/delete?userId=${user.uid}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      // Sign out and redirect — auth state will clear automatically
      router.push("/login");
    } catch (error) {
      console.error("Failed to delete account:", error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="w-6 h-6" />
            Profile
          </CardTitle>
          <CardDescription>
            Manage your account information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {user?.displayName || "User"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
            </div>

            {isEditing ? (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Display Name
                  </label>
                  <Input
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Learning Goal
                  </label>
                  <textarea
                    value={formData.learningGoal}
                    onChange={(e) => setFormData({ ...formData, learningGoal: e.target.value })}
                    placeholder="What do you want to learn?"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preferred Pace
                  </label>
                  <select
                    value={formData.preferredPace}
                    onChange={(e) => setFormData({ ...formData, preferredPace: e.target.value as ProfileData["preferredPace"] })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="slow">Slow - Take my time</option>
                    <option value="moderate">Moderate - Balanced approach</option>
                    <option value="fast">Fast - Move quickly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Experience Level
                  </label>
                  <select
                    value={formData.experienceLevel}
                    onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value as ProfileData["experienceLevel"] })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="beginner">Beginner - Starting fresh</option>
                    <option value="intermediate">Intermediate - Know the basics</option>
                    <option value="advanced">Advanced - Solid knowledge</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Topics of Interest
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
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
                      { id: "other", name: "Other", icon: "✨" },
                    ].map((topic) => {
                      const isSelected = formData.selectedTopics.includes(topic.id);
                      return (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              selectedTopics: isSelected
                                ? prev.selectedTopics.filter((t) => t !== topic.id)
                                : [...prev.selectedTopics, topic.id],
                            }));
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-all ${
                            isSelected
                              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                          }`}
                        >
                          <span>{topic.icon}</span>
                          <span>{topic.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Meta Goal
                  </label>
                  <textarea
                    value={formData.metaGoal}
                    onChange={(e) => setFormData({ ...formData, metaGoal: e.target.value })}
                    placeholder="Your higher-level learning ambition (e.g., 'Become a full-stack developer', 'Transition into data engineering')"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                {/* Display current profile info */}
                {formData.learningGoal && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Learning Goal</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5">{formData.learningGoal}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-4">
                  <div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Pace</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5 capitalize">{formData.preferredPace}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Level</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5 capitalize">{formData.experienceLevel}</p>
                  </div>
                </div>
                {formData.selectedTopics.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Topics</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {formData.selectedTopics.map((t) => (
                        <span key={t} className="px-2 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {formData.metaGoal && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Meta Goal</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5">{formData.metaGoal}</p>
                  </div>
                )}
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            Learning Stats
          </CardTitle>
          <CardDescription>
            View your learning progress and achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard/settings/stats">
            <Button variant="outline">View Stats</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            Preferences
          </CardTitle>
          <CardDescription>
            Customize your learning experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Text Highlighting</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select text in AI responses to save highlights
                </p>
              </div>
              <button
                onClick={handleToggleHighlights}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  highlightsEnabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                }`}
                role="switch"
                aria-checked={highlightsEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    highlightsEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Email Notifications</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive learning reminders and updates
                </p>
              </div>
              <span className="text-sm text-gray-500">Coming soon</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Dark Mode</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {mounted ? (
                    theme === "system"
                      ? `Using system preference (currently ${resolvedTheme})`
                      : `${theme === "dark" ? "Dark" : "Light"} theme active`
                  ) : "Loading…"}
                </p>
              </div>
              {mounted && (
                <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-0.5">
                  <button
                    onClick={() => setTheme("light")}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      theme === "light"
                        ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm font-medium"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    }`}
                    aria-label="Light mode"
                  >
                    ☀️
                  </button>
                  <button
                    onClick={() => setTheme("system")}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      theme === "system"
                        ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm font-medium"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    }`}
                    aria-label="System theme"
                  >
                    💻
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      theme === "dark"
                        ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm font-medium"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    }`}
                    aria-label="Dark mode"
                  >
                    🌙
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Developer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            Developer Information
          </CardTitle>
          <CardDescription>
            Your unique user identifier for admin access and debugging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowUid(!showUid)}
                className="flex items-center gap-2"
              >
                {showUid ? (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                    Hide UID
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Show My UID
                  </>
                )}
              </Button>

              {showUid && (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    if (user?.uid) {
                      await navigator.clipboard.writeText(user.uid);
                      setCopiedUid(true);
                      setTimeout(() => setCopiedUid(false), 2000);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  {copiedUid ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy UID
                    </>
                  )}
                </Button>
              )}
            </div>

            {showUid && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <code className="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                  {user?.uid}
                </code>
              </div>
            )}

            <p className="text-sm text-gray-600 dark:text-gray-400">
              To grant admin access, add this UID to the{" "}
              <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                ADMIN_UIDS
              </code>{" "}
              environment variable (comma-separated list).
            </p>
          </div>
        </CardContent>
      </Card>

      <Card variant="outlined" className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <LogOutIcon className="w-6 h-6" />
            Sign Out
          </CardTitle>
          <CardDescription>
            Sign out of your account on this device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="danger" onClick={handleSignOut}>
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Data Export (GDPR) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldIcon className="w-6 h-6" />
            Your Data
          </CardTitle>
          <CardDescription>
            Download or manage your personal data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <DownloadIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Export All Data
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Download a complete copy of your profile, sessions, messages,
                  concepts, reflections, and learning paths as JSON.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  isLoading={isExporting}
                  leftIcon={<DownloadIcon className="w-4 h-4" />}
                >
                  Download My Data
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Deletion */}
      <Card variant="outlined" className="border-red-300 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangleIcon className="w-6 h-6" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showDeleteConfirm ? (
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <TrashIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Delete Account
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </p>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  leftIcon={<TrashIcon className="w-4 h-4" />}
                >
                  Delete My Account
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg space-y-4">
              <div className="flex items-start gap-2">
                <AlertTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800 dark:text-red-300">
                    Are you absolutely sure?
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                    This will permanently delete your account and all data including
                    sessions, messages, concepts, reflections, and learning paths.
                    This action is <strong>irreversible</strong>.
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                  Type <strong>DELETE</strong> to confirm
                </label>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  disabled={isDeleting}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE" || isDeleting}
                  isLoading={isDeleting}
                  leftIcon={<TrashIcon className="w-4 h-4" />}
                >
                  Permanently Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

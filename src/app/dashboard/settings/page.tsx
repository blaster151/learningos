"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [formData, setFormData] = useState<ProfileData>({
    displayName: "",
    learningGoal: "",
    preferredPace: "moderate",
  });
  const [originalData, setOriginalData] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

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
        };
        setFormData(profile);
        setOriginalData(profile);
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
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
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
                  Use system preference for theme
                </p>
              </div>
              <span className="text-sm text-gray-500">Coming soon</span>
            </div>
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

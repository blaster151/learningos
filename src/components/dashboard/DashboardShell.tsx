"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  HomeIcon,
  BookIcon,
  MessageCircleIcon,
  GraphIcon,
  SettingsIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  BrainIcon,
  UserIcon,
  HighlighterIcon,
} from "@/components/icons";

// ===================================
// Navigation Items
// ===================================

const navItems = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/dashboard/learn", label: "Learn", icon: BookIcon },
  { href: "/dashboard/chat", label: "Chat", icon: MessageCircleIcon },
  { href: "/dashboard/graph", label: "Graph", icon: GraphIcon },
  { href: "/dashboard/highlights", label: "Highlights", icon: HighlighterIcon },
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];

// ===================================
// Sidebar Component
// ===================================

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BrainIcon className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white">LearningOS</span>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close menu"
            >
              <XIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                    ${isActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            {/* User Info */}
            <div className="flex items-center gap-3 mb-3 px-2">
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.displayName || "User"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
              <LogOutIcon className="w-5 h-5" />
              <span className="font-medium">Sign out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

// ===================================
// Header Component
// ===================================

interface HeaderProps {
  onMenuClick: () => void;
}

function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 mr-2"
        aria-label="Open menu"
      >
        <MenuIcon className="w-5 h-5 text-gray-500" />
      </button>

      {/* Page Title - Can be made dynamic later */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          Dashboard
        </h1>
      </div>

      {/* Header Actions - Can add notifications, etc. */}
      <div className="flex items-center gap-2">
        {/* Placeholder for future actions */}
      </div>
    </header>
  );
}

// ===================================
// Dashboard Shell Component
// ===================================

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header onMenuClick={() => setSidebarOpen(true)} />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default DashboardShell;

"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { Components } from "react-markdown";

interface MarkdownContentProps {
  content: string;
  onTermClick?: (term: string) => void;
  className?: string;
}

/**
 * Renders markdown content with LaTeX math support.
 *
 * Supports:
 * - Inline math with `$...$` or `\(...\)`
 * - Display math with `$$...$$` or `\[...\]`
 * - Bold, italic, code, lists, headings, links, tables, etc.
 * - Clickable bold terms (concept drilling) via onTermClick
 */
export function MarkdownContent({ content, onTermClick, className }: MarkdownContentProps) {
  // Custom component overrides for react-markdown
  const components = useMemo<Components>(() => ({
    // Make bold text clickable for concept drilling
    strong: ({ children }) => {
      const text = extractText(children);
      if (onTermClick && text) {
        return (
          <button
            onClick={() => onTermClick(text)}
            className="font-semibold text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 hover:underline cursor-pointer bg-transparent border-none p-0 m-0 inline text-inherit transition-colors"
            title={`Ask about "${text}"`}
            aria-label={`Learn more about ${text}`}
          >
            {children}
          </button>
        );
      }
      return <strong>{children}</strong>;
    },
    // Style inline code
    code: ({ children, className: codeClassName }) => {
      // If it has a language class, it's a code block (handled by pre)
      if (codeClassName) {
        return <code className={codeClassName}>{children}</code>;
      }
      return (
        <code className="bg-gray-100 dark:bg-gray-700 text-pink-600 dark:text-pink-300 px-1.5 py-0.5 rounded text-sm font-mono">
          {children}
        </code>
      );
    },
    // Style code blocks
    pre: ({ children }) => (
      <pre className="bg-gray-100 dark:bg-gray-900 rounded-lg p-3 my-2 overflow-x-auto text-sm font-mono border border-gray-200 dark:border-gray-700">
        {children}
      </pre>
    ),
    // Style links
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
      >
        {children}
      </a>
    ),
    // Add spacing to paragraphs
    p: ({ children }) => (
      <p className="my-1 leading-relaxed">{children}</p>
    ),
    // Style lists
    ul: ({ children }) => (
      <ul className="list-disc list-inside my-1 space-y-0.5">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside my-1 space-y-0.5">{children}</ol>
    ),
    // Style headings (unlikely in chat but just in case)
    h1: ({ children }) => <h1 className="text-lg font-bold mt-2 mb-1">{children}</h1>,
    h2: ({ children }) => <h2 className="text-base font-bold mt-2 mb-1">{children}</h2>,
    h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>,
    // Style blockquotes
    blockquote: ({ children }) => (
      <blockquote className="border-l-3 border-gray-300 dark:border-gray-600 pl-3 my-1 italic text-gray-600 dark:text-gray-400">
        {children}
      </blockquote>
    ),
    // Style tables
    table: ({ children }) => (
      <div className="overflow-x-auto my-2">
        <table className="min-w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 bg-gray-50 dark:bg-gray-800 font-semibold text-left">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
        {children}
      </td>
    ),
  }), [onTermClick]);

  return (
    <div className={`markdown-content ${className || ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Extract plain text from React children (for term click targets).
 */
function extractText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (React.isValidElement(children)) {
    const props = children.props as Record<string, unknown>;
    if (props.children) {
      return extractText(props.children as React.ReactNode);
    }
  }
  return "";
}

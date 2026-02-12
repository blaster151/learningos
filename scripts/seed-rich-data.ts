#!/usr/bin/env npx tsx

/**
 * Rich Data Seed Script for LearningOS
 *
 * Seeds Firestore with realistic data for a specific user:
 * - 25+ concepts across 3 domains with varied mastery levels
 * - 15+ concept relations forming a real knowledge graph
 * - 3 learning sessions with realistic message history
 * - 1 active learning path with milestone progress
 * - 1 completed learning path
 * - Reflection prompts and submissions
 *
 * Usage:
 *   npx tsx scripts/seed-rich-data.ts <firebaseUserId>
 *
 * The userId must be the UID of an existing Firebase Auth user.
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import * as path from "path";
import * as fs from "fs";

// ===================================
// Firebase Admin Init
// ===================================

function initAdmin() {
  if (getApps().length > 0) return getFirestore();

  // Try loading from firebase-admin-key.json first
  const keyPath = path.resolve(__dirname, "../firebase-admin-key.json");
  if (fs.existsSync(keyPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
    initializeApp({ credential: cert(serviceAccount) });
  } else {
    // Fall back to env vars
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
        privateKey: privateKey!,
      }),
    });
  }

  return getFirestore();
}

// ===================================
// Helper: Generate IDs
// ===================================

function makeId(prefix: string, name: string): string {
  return `${prefix}_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
}

function daysAgo(n: number): Timestamp {
  return Timestamp.fromDate(new Date(Date.now() - n * 86400000));
}

function hoursAgo(n: number): Timestamp {
  return Timestamp.fromDate(new Date(Date.now() - n * 3600000));
}

// ===================================
// Concept Data — TypeScript & Web Dev focus
// ===================================

interface ConceptSeed {
  name: string;
  definition: string;
  domain: string;
  category?: string;
  masteryLevel: string;
  confidence: number;
  understanding: number;
  exampleContext?: string;
  discoveredBy: string;
  isEmergent: boolean;
  daysAgoFirst: number;
  daysAgoReviewed: number;
}

const CONCEPTS: ConceptSeed[] = [
  // === JavaScript Fundamentals (mastered) ===
  {
    name: "Variables",
    definition: "Named storage locations in memory that hold values, declared with let, const, or var",
    domain: "javascript",
    category: "fundamentals",
    masteryLevel: "expert",
    confidence: 0.95,
    understanding: 0.92,
    exampleContext: "const userName = 'Alice'; let score = 0;",
    discoveredBy: "path",
    isEmergent: false,
    daysAgoFirst: 60,
    daysAgoReviewed: 3,
  },
  {
    name: "Functions",
    definition: "Reusable blocks of code that accept inputs (parameters) and can return outputs",
    domain: "javascript",
    category: "fundamentals",
    masteryLevel: "expert",
    confidence: 0.93,
    understanding: 0.90,
    exampleContext: "function greet(name) { return `Hello, ${name}!`; }",
    discoveredBy: "path",
    isEmergent: false,
    daysAgoFirst: 58,
    daysAgoReviewed: 5,
  },
  {
    name: "Arrow Functions",
    definition: "Concise function syntax using => that lexically binds 'this'",
    domain: "javascript",
    category: "fundamentals",
    masteryLevel: "comfortable",
    confidence: 0.85,
    understanding: 0.82,
    exampleContext: "const add = (a, b) => a + b;",
    discoveredBy: "system",
    isEmergent: false,
    daysAgoFirst: 55,
    daysAgoReviewed: 4,
  },
  {
    name: "Arrays",
    definition: "Ordered collections of elements accessed by index, with built-in methods like map, filter, reduce",
    domain: "javascript",
    category: "data structures",
    masteryLevel: "expert",
    confidence: 0.90,
    understanding: 0.88,
    exampleContext: "const nums = [1,2,3]; nums.map(n => n * 2);",
    discoveredBy: "path",
    isEmergent: false,
    daysAgoFirst: 56,
    daysAgoReviewed: 2,
  },
  {
    name: "Objects",
    definition: "Collections of key-value pairs representing entities with properties and methods",
    domain: "javascript",
    category: "data structures",
    masteryLevel: "comfortable",
    confidence: 0.82,
    understanding: 0.80,
    exampleContext: "const user = { name: 'Alice', age: 30, greet() { return `Hi, I'm ${this.name}`; } };",
    discoveredBy: "path",
    isEmergent: false,
    daysAgoFirst: 56,
    daysAgoReviewed: 6,
  },
  {
    name: "Promises",
    definition: "Objects representing the eventual completion or failure of an asynchronous operation",
    domain: "javascript",
    category: "async",
    masteryLevel: "practicing",
    confidence: 0.65,
    understanding: 0.60,
    exampleContext: "fetch('/api/data').then(res => res.json()).catch(err => console.error(err));",
    discoveredBy: "system",
    isEmergent: false,
    daysAgoFirst: 30,
    daysAgoReviewed: 7,
  },
  {
    name: "Async/Await",
    definition: "Syntactic sugar over Promises that makes asynchronous code look and behave like synchronous code",
    domain: "javascript",
    category: "async",
    masteryLevel: "learning",
    confidence: 0.50,
    understanding: 0.45,
    exampleContext: "async function getData() { const res = await fetch('/api'); return res.json(); }",
    discoveredBy: "system",
    isEmergent: false,
    daysAgoFirst: 25,
    daysAgoReviewed: 3,
  },
  {
    name: "Closures",
    definition: "Functions that retain access to variables from their enclosing scope even after the outer function has returned",
    domain: "javascript",
    category: "advanced",
    masteryLevel: "learning",
    confidence: 0.40,
    understanding: 0.35,
    exampleContext: "function counter() { let count = 0; return () => ++count; }",
    discoveredBy: "system",
    isEmergent: false,
    daysAgoFirst: 20,
    daysAgoReviewed: 5,
  },
  {
    name: "Destructuring",
    definition: "Syntax for unpacking values from arrays or properties from objects into distinct variables",
    domain: "javascript",
    category: "fundamentals",
    masteryLevel: "comfortable",
    confidence: 0.80,
    understanding: 0.78,
    exampleContext: "const { name, age } = user; const [first, ...rest] = items;",
    discoveredBy: "path",
    isEmergent: false,
    daysAgoFirst: 45,
    daysAgoReviewed: 4,
  },
  {
    name: "Event Loop",
    definition: "The mechanism that allows JavaScript to perform non-blocking I/O by offloading operations and processing callbacks from a queue",
    domain: "javascript",
    category: "runtime",
    masteryLevel: "exploring",
    confidence: 0.25,
    understanding: 0.20,
    exampleContext: "setTimeout(() => console.log('later'), 0); console.log('first');",
    discoveredBy: "user",
    isEmergent: true,
    daysAgoFirst: 10,
    daysAgoReviewed: 10,
  },

  // === TypeScript ===
  {
    name: "Type Annotations",
    definition: "Explicit labels that specify the type of a variable, parameter, or return value",
    domain: "typescript",
    category: "basics",
    masteryLevel: "comfortable",
    confidence: 0.78,
    understanding: 0.75,
    exampleContext: "let age: number = 25; function greet(name: string): string { ... }",
    discoveredBy: "path",
    isEmergent: false,
    daysAgoFirst: 40,
    daysAgoReviewed: 2,
  },
  {
    name: "Interfaces",
    definition: "Contracts that define the shape of objects, enabling type checking and IDE autocomplete",
    domain: "typescript",
    category: "basics",
    masteryLevel: "practicing",
    confidence: 0.68,
    understanding: 0.65,
    exampleContext: "interface User { name: string; age: number; email?: string; }",
    discoveredBy: "path",
    isEmergent: false,
    daysAgoFirst: 38,
    daysAgoReviewed: 3,
  },
  {
    name: "Generics",
    definition: "Type parameters that make functions, classes, and interfaces work with multiple types while maintaining type safety",
    domain: "typescript",
    category: "advanced",
    masteryLevel: "learning",
    confidence: 0.42,
    understanding: 0.38,
    exampleContext: "function identity<T>(arg: T): T { return arg; }",
    discoveredBy: "system",
    isEmergent: false,
    daysAgoFirst: 20,
    daysAgoReviewed: 8,
  },
  {
    name: "Union Types",
    definition: "Types that allow a value to be one of several types, expressed with the | operator",
    domain: "typescript",
    category: "type system",
    masteryLevel: "practicing",
    confidence: 0.60,
    understanding: 0.58,
    exampleContext: "type Status = 'active' | 'inactive' | 'pending';",
    discoveredBy: "system",
    isEmergent: false,
    daysAgoFirst: 35,
    daysAgoReviewed: 5,
  },
  {
    name: "Type Guards",
    definition: "Runtime checks that narrow the type of a variable within a conditional block",
    domain: "typescript",
    category: "type system",
    masteryLevel: "exploring",
    confidence: 0.30,
    understanding: 0.25,
    exampleContext: "if (typeof value === 'string') { value.toUpperCase(); }",
    discoveredBy: "user",
    isEmergent: true,
    daysAgoFirst: 12,
    daysAgoReviewed: 12,
  },
  {
    name: "Utility Types",
    definition: "Built-in TypeScript types like Partial, Required, Pick, Omit that transform other types",
    domain: "typescript",
    category: "advanced",
    masteryLevel: "exploring",
    confidence: 0.22,
    understanding: 0.18,
    exampleContext: "type UpdateUser = Partial<User>; type UserName = Pick<User, 'name'>;",
    discoveredBy: "system",
    isEmergent: false,
    daysAgoFirst: 8,
    daysAgoReviewed: 8,
  },

  // === React ===
  {
    name: "Components",
    definition: "Reusable, self-contained UI building blocks that accept props and return JSX",
    domain: "react",
    category: "core",
    masteryLevel: "comfortable",
    confidence: 0.82,
    understanding: 0.80,
    exampleContext: "function Button({ label, onClick }) { return <button onClick={onClick}>{label}</button>; }",
    discoveredBy: "path",
    isEmergent: false,
    daysAgoFirst: 35,
    daysAgoReviewed: 1,
  },
  {
    name: "Props",
    definition: "Read-only data passed from parent to child components to configure their behavior and appearance",
    domain: "react",
    category: "core",
    masteryLevel: "comfortable",
    confidence: 0.80,
    understanding: 0.78,
    exampleContext: "<UserCard name='Alice' role='admin' onEdit={handleEdit} />",
    discoveredBy: "path",
    isEmergent: false,
    daysAgoFirst: 35,
    daysAgoReviewed: 1,
  },
  {
    name: "useState",
    definition: "A React Hook that lets you add reactive state to functional components",
    domain: "react",
    category: "hooks",
    masteryLevel: "practicing",
    confidence: 0.70,
    understanding: 0.68,
    exampleContext: "const [count, setCount] = useState(0);",
    discoveredBy: "path",
    isEmergent: false,
    daysAgoFirst: 30,
    daysAgoReviewed: 1,
  },
  {
    name: "useEffect",
    definition: "A React Hook for performing side effects like data fetching, subscriptions, or DOM manipulation",
    domain: "react",
    category: "hooks",
    masteryLevel: "learning",
    confidence: 0.48,
    understanding: 0.42,
    exampleContext: "useEffect(() => { fetchData(); return () => cleanup(); }, [dependency]);",
    discoveredBy: "system",
    isEmergent: false,
    daysAgoFirst: 25,
    daysAgoReviewed: 2,
  },
  {
    name: "JSX",
    definition: "A syntax extension that lets you write HTML-like markup inside JavaScript/TypeScript",
    domain: "react",
    category: "core",
    masteryLevel: "expert",
    confidence: 0.92,
    understanding: 0.90,
    exampleContext: "return <div className='card'><h1>{title}</h1></div>;",
    discoveredBy: "path",
    isEmergent: false,
    daysAgoFirst: 36,
    daysAgoReviewed: 1,
  },
  {
    name: "Conditional Rendering",
    definition: "Techniques for showing or hiding UI elements based on state or props, using && or ternary operators",
    domain: "react",
    category: "patterns",
    masteryLevel: "practicing",
    confidence: 0.65,
    understanding: 0.62,
    exampleContext: "{isLoggedIn ? <Dashboard /> : <LoginForm />}",
    discoveredBy: "system",
    isEmergent: false,
    daysAgoFirst: 28,
    daysAgoReviewed: 3,
  },
  {
    name: "useContext",
    definition: "A React Hook that subscribes to a Context, allowing deep components to access shared state without prop drilling",
    domain: "react",
    category: "hooks",
    masteryLevel: "exploring",
    confidence: 0.30,
    understanding: 0.25,
    exampleContext: "const theme = useContext(ThemeContext);",
    discoveredBy: "user",
    isEmergent: true,
    daysAgoFirst: 14,
    daysAgoReviewed: 14,
  },
  {
    name: "Custom Hooks",
    definition: "User-defined functions starting with 'use' that encapsulate reusable stateful logic across components",
    domain: "react",
    category: "hooks",
    masteryLevel: "exploring",
    confidence: 0.28,
    understanding: 0.22,
    exampleContext: "function useWindowSize() { const [size, setSize] = useState(window.innerWidth); ... }",
    discoveredBy: "user",
    isEmergent: true,
    daysAgoFirst: 7,
    daysAgoReviewed: 7,
  },
  {
    name: "React Server Components",
    definition: "Components that render on the server, reducing client-side JavaScript and enabling direct data access",
    domain: "react",
    category: "advanced",
    masteryLevel: "exploring",
    confidence: 0.20,
    understanding: 0.15,
    exampleContext: "// app/page.tsx — this is a Server Component by default in Next.js 15",
    discoveredBy: "user",
    isEmergent: true,
    daysAgoFirst: 5,
    daysAgoReviewed: 5,
  },
];

// ===================================
// Relations between concepts
// ===================================

interface RelationSeed {
  source: string;
  target: string;
  type: string;
  strength: number;
  isEmergent: boolean;
  discoveredBy: string;
  insight?: string;
}

const RELATIONS: RelationSeed[] = [
  // JS fundamentals chain
  { source: "Variables", target: "Functions", type: "prerequisite", strength: 0.9, isEmergent: false, discoveredBy: "path" },
  { source: "Functions", target: "Arrow Functions", type: "builds_on", strength: 0.85, isEmergent: false, discoveredBy: "system" },
  { source: "Variables", target: "Arrays", type: "prerequisite", strength: 0.8, isEmergent: false, discoveredBy: "path" },
  { source: "Variables", target: "Objects", type: "prerequisite", strength: 0.8, isEmergent: false, discoveredBy: "path" },
  { source: "Arrays", target: "Destructuring", type: "builds_on", strength: 0.7, isEmergent: false, discoveredBy: "system" },
  { source: "Objects", target: "Destructuring", type: "builds_on", strength: 0.7, isEmergent: false, discoveredBy: "system" },
  { source: "Functions", target: "Closures", type: "builds_on", strength: 0.75, isEmergent: false, discoveredBy: "system" },

  // Async chain
  { source: "Functions", target: "Promises", type: "prerequisite", strength: 0.85, isEmergent: false, discoveredBy: "path" },
  { source: "Promises", target: "Async/Await", type: "builds_on", strength: 0.95, isEmergent: false, discoveredBy: "system" },
  { source: "Promises", target: "Event Loop", type: "builds_on", strength: 0.6, isEmergent: true, discoveredBy: "user",
    insight: "I realized Promises use the microtask queue in the event loop, which is why they run before setTimeout!" },

  // JS → TypeScript
  { source: "Variables", target: "Type Annotations", type: "builds_on", strength: 0.8, isEmergent: false, discoveredBy: "path" },
  { source: "Objects", target: "Interfaces", type: "builds_on", strength: 0.85, isEmergent: false, discoveredBy: "path" },
  { source: "Functions", target: "Generics", type: "builds_on", strength: 0.7, isEmergent: false, discoveredBy: "system" },
  { source: "Union Types", target: "Type Guards", type: "builds_on", strength: 0.75, isEmergent: true, discoveredBy: "user",
    insight: "Type guards are how you safely narrow union types at runtime" },
  { source: "Interfaces", target: "Utility Types", type: "builds_on", strength: 0.6, isEmergent: false, discoveredBy: "system" },
  { source: "Generics", target: "Utility Types", type: "builds_on", strength: 0.65, isEmergent: false, discoveredBy: "system" },

  // JS/TS → React
  { source: "Functions", target: "Components", type: "prerequisite", strength: 0.9, isEmergent: false, discoveredBy: "path" },
  { source: "Objects", target: "Props", type: "builds_on", strength: 0.8, isEmergent: false, discoveredBy: "path" },
  { source: "Closures", target: "useState", type: "builds_on", strength: 0.7, isEmergent: true, discoveredBy: "user",
    insight: "useState uses closures under the hood — the state persists between renders because of closure scope!" },
  { source: "Async/Await", target: "useEffect", type: "applies_to", strength: 0.75, isEmergent: false, discoveredBy: "system" },
  { source: "Components", target: "JSX", type: "builds_on", strength: 0.95, isEmergent: false, discoveredBy: "path" },
  { source: "Props", target: "Conditional Rendering", type: "builds_on", strength: 0.65, isEmergent: false, discoveredBy: "system" },
  { source: "useState", target: "Conditional Rendering", type: "applies_to", strength: 0.7, isEmergent: false, discoveredBy: "system" },
  { source: "Props", target: "useContext", type: "contrasts_with", strength: 0.6, isEmergent: true, discoveredBy: "user",
    insight: "useContext solves the problem of passing props through many layers (prop drilling)" },
  { source: "useState", target: "Custom Hooks", type: "builds_on", strength: 0.7, isEmergent: false, discoveredBy: "system" },
  { source: "useEffect", target: "Custom Hooks", type: "builds_on", strength: 0.7, isEmergent: false, discoveredBy: "system" },
  { source: "Components", target: "React Server Components", type: "builds_on", strength: 0.5, isEmergent: true, discoveredBy: "user" },
  { source: "Interfaces", target: "Props", type: "applies_to", strength: 0.75, isEmergent: false, discoveredBy: "system",
    insight: "TypeScript interfaces are used to type React component props" },
];

// ===================================
// Session & Message Data
// ===================================

interface SessionSeed {
  topic: string;
  goal: string;
  status: string;
  startedHoursAgo: number;
  messages: Array<{ role: string; content: string }>;
  conceptsCovered: string[];
}

const SESSIONS: SessionSeed[] = [
  {
    topic: "JavaScript Closures",
    goal: "Understand how closures work and when to use them",
    status: "completed",
    startedHoursAgo: 72,
    conceptsCovered: ["Functions", "Closures", "Variables"],
    messages: [
      { role: "user", content: "Can you explain closures in JavaScript? I keep hearing about them but I'm not sure I really understand them." },
      { role: "assistant", content: "Great question! A **closure** is created when a function \"remembers\" the variables from its outer scope, even after the outer function has finished executing.\n\nThink of it like this: when you create a function inside another function, the inner function gets a \"backpack\" of variables from the outer function that it carries around.\n\nHere's a classic example:\n\n```javascript\nfunction createCounter() {\n  let count = 0; // This variable is \"enclosed\"\n  return function() {\n    count++;\n    return count;\n  };\n}\n\nconst counter = createCounter();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2\nconsole.log(counter()); // 3\n```\n\nEven though `createCounter()` has already returned, the inner function still has access to `count`. That's a closure!\n\nWhat aspect would you like to explore more?" },
      { role: "user", content: "Oh interesting! So the inner function keeps access to the outer function's variables. But why is this useful in practice?" },
      { role: "assistant", content: "Closures are incredibly useful! Here are the main practical use cases:\n\n**1. Data Privacy / Encapsulation**\nYou can create private variables that can't be accessed from outside:\n\n```javascript\nfunction createBankAccount(initialBalance) {\n  let balance = initialBalance; // private!\n  return {\n    deposit(amount) { balance += amount; },\n    getBalance() { return balance; }\n  };\n}\n```\n\n**2. Factory Functions**\nCreate specialized versions of functions:\n\n```javascript\nfunction multiply(x) {\n  return function(y) { return x * y; };\n}\nconst double = multiply(2);\nconst triple = multiply(3);\n```\n\n**3. Event Handlers & Callbacks**\nIn React, closures are everywhere — every component render creates closures over the current state and props.\n\n**4. Memoization**\nCaching expensive computation results.\n\nThe key insight is: closures let you **combine data with behavior**. Would you like to try writing one yourself?" },
      { role: "user", content: "The factory function example really clicked! So closures are basically how you create functions that 'remember' their configuration. That's why React hooks like useState work — they must use closures internally!" },
      { role: "assistant", content: "🎉 Yes, exactly! That's a brilliant connection!\n\nReact's `useState` does indeed rely on closures. When you write:\n\n```javascript\nconst [count, setCount] = useState(0);\n```\n\nReact maintains an internal array of state values. Each call to `useState` creates a closure that remembers which index in that array belongs to this particular piece of state.\n\nThis is also why the **Rules of Hooks** exist — hooks must be called in the same order every render, because React uses the call order to match each hook to its slot in the internal state array.\n\nYour ability to connect closures (a JavaScript concept) to React hooks (a framework concept) shows real understanding! This kind of cross-domain connection is exactly how expertise develops.\n\nWant to explore this connection between closures and React state management more deeply?" },
      { role: "user", content: "That makes so much sense now. I think I'm good for now — this really helped connect the dots!" },
      { role: "assistant", content: "Awesome! You made a really strong connection today. Let me summarize what you learned:\n\n✅ **Closures** = inner functions retaining access to outer scope variables\n✅ **Practical uses**: data privacy, factory functions, event handlers\n✅ **Key insight**: closures combine data with behavior\n✅ **Cross-domain connection**: React `useState` uses closures internally\n\nYour understanding of closures went from conceptual awareness to seeing real-world applications. That connection to React hooks was particularly impressive — it shows you're building a mental model, not just memorizing facts.\n\nGreat session! 🚀" },
    ],
  },
  {
    topic: "TypeScript Generics",
    goal: "Learn how to write generic functions and types",
    status: "completed",
    startedHoursAgo: 48,
    conceptsCovered: ["Generics", "Type Annotations", "Interfaces", "Functions"],
    messages: [
      { role: "user", content: "I want to understand TypeScript generics. I get the basics of types but generics confuse me." },
      { role: "assistant", content: "Generics can seem intimidating, but they solve a simple problem: **how do you write a function that works with multiple types without losing type information?**\n\nLet's start with why you need them. Imagine this function:\n\n```typescript\nfunction firstElement(arr: any[]): any {\n  return arr[0];\n}\n```\n\nIt works, but TypeScript loses track of the type. `firstElement([1, 2, 3])` returns `any` instead of `number`.\n\nWith generics:\n\n```typescript\nfunction firstElement<T>(arr: T[]): T {\n  return arr[0];\n}\n\nconst num = firstElement([1, 2, 3]);    // type: number\nconst str = firstElement(['a', 'b']);    // type: string\n```\n\nThe `<T>` is like a placeholder — it means \"whatever type you give me, I'll give back the same type.\"\n\nDoes that basic idea make sense?" },
      { role: "user", content: "Yes! So T is like a variable, but for types instead of values. Can you show me a more complex example?" },
      { role: "assistant", content: "Exactly — `T` is a **type variable**! Great mental model.\n\nHere's a more practical example — a function that merges two objects:\n\n```typescript\nfunction merge<T, U>(obj1: T, obj2: U): T & U {\n  return { ...obj1, ...obj2 };\n}\n\nconst result = merge(\n  { name: 'Alice' },\n  { age: 30 }\n);\n// result type: { name: string } & { age: number }\n// TypeScript knows result.name is string AND result.age is number!\n```\n\nYou can also **constrain** generics:\n\n```typescript\nfunction getLength<T extends { length: number }>(item: T): number {\n  return item.length;\n}\n\ngetLength('hello');      // ✅ strings have .length\ngetLength([1, 2, 3]);    // ✅ arrays have .length\ngetLength(42);           // ❌ Error! numbers don't have .length\n```\n\nThe `extends` keyword says: \"T can be any type, as long as it has a `length` property.\"\n\nWant to try writing a generic function yourself?" },
      { role: "user", content: "Ok let me try. What about a function that takes an array and a predicate and returns the first matching element?\n\nfunction findFirst<T>(arr: T[], predicate: (item: T) => boolean): T | undefined {\n  return arr.find(predicate);\n}" },
      { role: "assistant", content: "🎯 **Perfect!** That's exactly right. Let's break down why it's so good:\n\n```typescript\nfunction findFirst<T>(arr: T[], predicate: (item: T) => boolean): T | undefined {\n  return arr.find(predicate);\n}\n```\n\n✅ The `T` connects the array type to the predicate's parameter type — they must match\n✅ The return type `T | undefined` correctly handles the case where nothing is found\n✅ The predicate callback is also generic — it receives `T`, not `any`\n\nUsage:\n```typescript\nconst nums = [1, 2, 3, 4, 5];\nconst firstEven = findFirst(nums, n => n % 2 === 0);\n// firstEven is type: number | undefined ✅\n\nconst users = [{ name: 'Alice', admin: true }, { name: 'Bob', admin: false }];\nconst firstAdmin = findFirst(users, u => u.admin);\n// firstAdmin is type: { name: string; admin: boolean } | undefined ✅\n```\n\nTypeScript infers `T` automatically from the arguments — you rarely need to write `findFirst<number>(...)` explicitly.\n\nYou're picking this up fast! Ready for the next level — generic interfaces?" },
    ],
  },
  {
    topic: "React Hooks Deep Dive",
    goal: "Master useEffect and learn about custom hooks",
    status: "active",
    startedHoursAgo: 2,
    conceptsCovered: ["useEffect", "useState", "Custom Hooks", "Components"],
    messages: [
      { role: "user", content: "I'm comfortable with useState but useEffect still trips me up. When does the effect run? What's the dependency array really doing?" },
      { role: "assistant", content: "Great questions — the dependency array is where most useEffect confusion lives. Let me clarify:\n\n**When does useEffect run?**\n\n```typescript\n// 1. After EVERY render\nuseEffect(() => {\n  console.log('I run after every render');\n});\n\n// 2. Only on MOUNT (first render)\nuseEffect(() => {\n  console.log('I run once');\n}, []);  // Empty dependency array\n\n// 3. When SPECIFIC values change\nuseEffect(() => {\n  console.log(`Count changed to ${count}`);\n}, [count]);  // Only re-runs when count changes\n```\n\n**The dependency array** tells React: \"Only re-run this effect if one of these values changed since last render.\"\n\nThink of it like a conditional: React compares the current values to the previous values. If they're the same → skip. If different → run the effect.\n\n**The cleanup function** runs before the effect re-runs AND when the component unmounts:\n\n```typescript\nuseEffect(() => {\n  const handler = () => console.log('resize');\n  window.addEventListener('resize', handler);\n  return () => window.removeEventListener('resize', handler);\n}, []);\n```\n\nWhat's been tripping you up specifically?" },
      { role: "user", content: "I think I get confused about what should go in the dependency array. Sometimes React's linter tells me to add things but it causes infinite loops." },
      { role: "assistant", content: "The infinite loop problem is the #1 frustration with useEffect! Here's why it happens and how to fix it:\n\n**The Infinite Loop Pattern:**\n```typescript\n// ❌ INFINITE LOOP!\nuseEffect(() => {\n  setData(fetchedData);\n}, [data]); // data changes → effect runs → sets data → data changes → ...\n```\n\n**Common causes and fixes:**\n\n**1. Object/Array dependencies** — Objects are compared by reference, not value:\n```typescript\n// ❌ New object every render → effect runs every render\nconst options = { page: 1 };\nuseEffect(() => { fetch(options); }, [options]);\n\n// ✅ Fix: useMemo or move inside effect\nuseEffect(() => {\n  const options = { page: 1 };\n  fetch(options);\n}, []);  // options is now stable\n```\n\n**2. Function dependencies:**\n```typescript\n// ❌ New function every render\nconst fetchData = () => fetch('/api');\nuseEffect(() => { fetchData(); }, [fetchData]);\n\n// ✅ Fix: useCallback\nconst fetchData = useCallback(() => fetch('/api'), []);\nuseEffect(() => { fetchData(); }, [fetchData]);\n```\n\n**Rule of thumb:** If the linter says add it, but it causes loops, the real fix is usually to stabilize the dependency with `useCallback`, `useMemo`, or restructuring.\n\nWant to see how this leads naturally into custom hooks?" },
    ],
  },
];

// ===================================
// Learning Path Data
// ===================================

interface PathSeed {
  title: string;
  description: string;
  goal: string;
  status: string;
  progress: number;
  currentMilestoneIndex: number;
  userLevel: string;
  milestones: Array<{
    title: string;
    description: string;
    conceptNames: string[];
    objectives: string[];
    estimatedMinutes: number;
    status: string;
    progress: number;
    completedDaysAgo?: number;
  }>;
}

const PATHS: PathSeed[] = [
  {
    title: "JavaScript to TypeScript Migration",
    description: "Master TypeScript by building on your JavaScript knowledge. Learn types, interfaces, generics, and advanced type system features.",
    goal: "Become proficient in TypeScript for professional web development",
    status: "active",
    progress: 0.4,
    currentMilestoneIndex: 2,
    userLevel: "intermediate",
    milestones: [
      {
        title: "TypeScript Basics & Type Annotations",
        description: "Learn the fundamental type system — annotating variables, function parameters, and return types",
        conceptNames: ["Type Annotations", "Variables", "Functions"],
        objectives: ["Annotate variables with basic types", "Type function parameters and return values", "Understand type inference"],
        estimatedMinutes: 90,
        status: "completed",
        progress: 1.0,
        completedDaysAgo: 15,
      },
      {
        title: "Interfaces & Object Types",
        description: "Define contracts for your data with interfaces, optional properties, and readonly modifiers",
        conceptNames: ["Interfaces", "Objects", "Type Annotations"],
        objectives: ["Create interfaces for object shapes", "Use optional and readonly properties", "Extend interfaces"],
        estimatedMinutes: 120,
        status: "completed",
        progress: 1.0,
        completedDaysAgo: 8,
      },
      {
        title: "Union Types & Type Guards",
        description: "Handle values that can be multiple types, and narrow them safely at runtime",
        conceptNames: ["Union Types", "Type Guards"],
        objectives: ["Create and use union types", "Implement type guard functions", "Understand discriminated unions"],
        estimatedMinutes: 90,
        status: "in_progress",
        progress: 0.4,
      },
      {
        title: "Generics & Advanced Types",
        description: "Write flexible, reusable code with generics and explore utility types",
        conceptNames: ["Generics", "Utility Types", "Interfaces"],
        objectives: ["Write generic functions", "Apply constraints to generics", "Use built-in utility types"],
        estimatedMinutes: 150,
        status: "locked",
        progress: 0,
      },
      {
        title: "TypeScript in React Projects",
        description: "Apply TypeScript to React components, hooks, and event handlers",
        conceptNames: ["Components", "Props", "useState", "Interfaces"],
        objectives: ["Type React component props", "Type useState and useEffect", "Handle event types"],
        estimatedMinutes: 120,
        status: "locked",
        progress: 0,
      },
    ],
  },
  {
    title: "React Fundamentals",
    description: "Build a solid foundation in React — components, state, props, and the component lifecycle",
    goal: "Learn to build interactive UIs with React",
    status: "completed",
    progress: 1.0,
    currentMilestoneIndex: 3,
    userLevel: "beginner",
    milestones: [
      {
        title: "Components & JSX",
        description: "Learn how to create React components and write JSX markup",
        conceptNames: ["Components", "JSX", "Functions"],
        objectives: ["Create functional components", "Write JSX expressions", "Compose components together"],
        estimatedMinutes: 60,
        status: "completed",
        progress: 1.0,
        completedDaysAgo: 30,
      },
      {
        title: "Props & Data Flow",
        description: "Pass data between components with props and understand one-way data flow",
        conceptNames: ["Props", "Components", "Objects"],
        objectives: ["Pass props to components", "Destructure props", "Understand prop types"],
        estimatedMinutes: 60,
        status: "completed",
        progress: 1.0,
        completedDaysAgo: 25,
      },
      {
        title: "State & Interactivity",
        description: "Make components interactive with useState and event handlers",
        conceptNames: ["useState", "Components", "Conditional Rendering"],
        objectives: ["Use useState for local state", "Handle user events", "Conditionally render UI"],
        estimatedMinutes: 90,
        status: "completed",
        progress: 1.0,
        completedDaysAgo: 20,
      },
      {
        title: "Side Effects & Data Fetching",
        description: "Use useEffect for side effects and fetch data from APIs",
        conceptNames: ["useEffect", "Async/Await", "Promises"],
        objectives: ["Use useEffect correctly", "Fetch data on mount", "Handle loading and error states"],
        estimatedMinutes: 120,
        status: "completed",
        progress: 1.0,
        completedDaysAgo: 14,
      },
    ],
  },
];

// ===================================
// Reflection Data
// ===================================

interface ReflectionSeed {
  type: string;
  prompt: string;
  response: string;
  conceptNames: string[];
  daysAgo: number;
}

const REFLECTIONS: ReflectionSeed[] = [
  {
    type: "conceptual",
    prompt: "How would you explain closures to a friend who has never programmed before?",
    response: "I'd say closures are like a backpack that a function carries around. When you create a function inside another function, the inner function packs up all the variables from the outer function into its backpack. Even after the outer function is done and gone, the inner function still has those variables in its backpack. It's like getting a lunchbox from home — even after you leave home, you still have your lunch!",
    conceptNames: ["Closures", "Functions", "Variables"],
    daysAgo: 5,
  },
  {
    type: "connection",
    prompt: "What connections do you see between TypeScript interfaces and React props?",
    response: "Interfaces and props are deeply connected! In React, every component receives props — which is just an object. TypeScript interfaces let you define the exact shape of that props object. So when I write `interface ButtonProps { label: string; onClick: () => void; }`, I'm creating a contract that says 'any component using Button MUST provide these props'. It's like a recipe: the interface is the ingredient list, and the component is the cooking instructions. This connection helped me understand why TypeScript is so popular in React projects — it catches prop errors at compile time instead of runtime.",
    conceptNames: ["Interfaces", "Props", "Components"],
    daysAgo: 10,
  },
  {
    type: "metacognitive",
    prompt: "What learning strategies have been most effective for you so far?",
    response: "The biggest thing that works for me is building connections between concepts. When I learned closures, it clicked when I connected it to how React useState works internally. I also find that writing code examples in my own words (not copy-pasting) forces me to actually understand. The weakest area for me is the TypeScript type system — generics and utility types still feel abstract. I think I need more hands-on practice with real projects, not just isolated examples.",
    conceptNames: ["Closures", "useState", "Generics", "Utility Types"],
    daysAgo: 3,
  },
];

// ===================================
// Main Seed Function
// ===================================

async function seedRichData(userId: string) {
  console.log(`\n🌱 Seeding rich data for user: ${userId}\n`);
  const db = initAdmin();

  // Track concept name → doc ID mapping
  const conceptIdMap: Record<string, string> = {};

  // ----- 1. Seed Concepts -----
  console.log("📚 Seeding concepts...");
  for (const c of CONCEPTS) {
    const now = Timestamp.now();
    const ref = await db.collection("concepts").add({
      userId,
      name: c.name,
      definition: c.definition,
      domain: c.domain,
      category: c.category || c.domain,
      masteryLevel: c.masteryLevel,
      confidence: c.confidence,
      understanding: c.understanding,
      exampleContext: c.exampleContext || "",
      discoveredBy: c.discoveredBy,
      isEmergent: c.isEmergent,
      firstEncountered: daysAgo(c.daysAgoFirst),
      lastReviewed: daysAgo(c.daysAgoReviewed),
      sessionIds: [],
      definitionHistory: [
        {
          definition: c.definition,
          source: "path",
          timestamp: daysAgo(c.daysAgoFirst),
        },
      ],
    });
    conceptIdMap[c.name] = ref.id;
    process.stdout.write(".");
  }
  console.log(`\n  ✅ ${CONCEPTS.length} concepts created`);

  // ----- 2. Seed Relations -----
  console.log("🔗 Seeding concept relations...");
  let relCount = 0;
  for (const r of RELATIONS) {
    const sourceId = conceptIdMap[r.source];
    const targetId = conceptIdMap[r.target];
    if (!sourceId || !targetId) {
      console.warn(`  ⚠ Skipping relation ${r.source} → ${r.target}: concept not found`);
      continue;
    }
    await db.collection("concept_relations").add({
      userId,
      sourceConceptId: sourceId,
      targetConceptId: targetId,
      relationType: r.type,
      strength: r.strength,
      isEmergent: r.isEmergent,
      discoveredBy: r.discoveredBy,
      discoveryInsight: r.insight || null,
      discoveredAt: daysAgo(Math.floor(Math.random() * 30) + 5),
    });
    relCount++;
    process.stdout.write(".");
  }
  console.log(`\n  ✅ ${relCount} relations created`);

  // ----- 3. Seed Sessions & Messages -----
  console.log("💬 Seeding sessions & messages...");
  for (const s of SESSIONS) {
    const sessionStart = hoursAgo(s.startedHoursAgo);
    const conceptIds = s.conceptsCovered
      .map((name) => conceptIdMap[name])
      .filter(Boolean);

    const sessionRef = await db.collection("sessions").add({
      userId,
      topic: s.topic,
      goal: s.goal,
      status: s.status,
      startedAt: sessionStart,
      lastActivity: s.status === "active" ? hoursAgo(0.5) : hoursAgo(s.startedHoursAgo - 1),
      endedAt: s.status === "completed" ? hoursAgo(s.startedHoursAgo - 1) : null,
      messageCount: s.messages.length,
      conceptsCovered: conceptIds,
      conceptsLearned: conceptIds.slice(0, 2),
      conceptsReviewed: [],
      initialConcepts: [],
    });

    // Add messages
    for (let i = 0; i < s.messages.length; i++) {
      const msg = s.messages[i];
      await db.collection("messages").add({
        sessionId: sessionRef.id,
        userId,
        role: msg.role,
        content: msg.content,
        timestamp: Timestamp.fromMillis(sessionStart.toMillis() + i * 120000), // 2 min apart
      });
    }
    console.log(`  ✅ Session "${s.topic}" (${s.messages.length} messages)`);
  }

  // ----- 4. Seed Learning Paths -----
  console.log("🛤️  Seeding learning paths...");
  for (const p of PATHS) {
    const milestones = p.milestones.map((m, i) => ({
      milestoneId: `milestone_${i}_${m.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      order: i,
      title: m.title,
      description: m.description,
      conceptIds: m.conceptNames.map((name) => conceptIdMap[name]).filter(Boolean),
      conceptNames: m.conceptNames,
      estimatedMinutes: m.estimatedMinutes,
      objectives: m.objectives,
      status: m.status,
      progress: m.progress,
      completedAt: m.completedDaysAgo ? daysAgo(m.completedDaysAgo) : null,
      prerequisiteMilestoneIds: i > 0 ? [`milestone_${i - 1}_${p.milestones[i - 1].title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`] : [],
    }));

    await db.collection("learning_paths").add({
      userId,
      title: p.title,
      description: p.description,
      goal: p.goal,
      status: p.status,
      progress: p.progress,
      currentMilestoneIndex: p.currentMilestoneIndex,
      milestones,
      estimatedMinutes: milestones.reduce((sum, m) => sum + m.estimatedMinutes, 0),
      generatedFrom: {
        userGoal: p.goal,
        knownConceptIds: [],
        userLevel: p.userLevel,
      },
      createdAt: daysAgo(p.status === "completed" ? 35 : 20),
      startedAt: daysAgo(p.status === "completed" ? 33 : 18),
      completedAt: p.status === "completed" ? daysAgo(14) : null,
      lastActivityAt: p.status === "active" ? hoursAgo(2) : daysAgo(14),
    });
    console.log(`  ✅ Path "${p.title}" (${p.status}, ${milestones.length} milestones)`);
  }

  // ----- 5. Seed Reflections -----
  console.log("🪞 Seeding reflections...");
  for (const r of REFLECTIONS) {
    const promptRef = await db.collection("reflection_prompts").add({
      userId,
      type: r.type,
      prompt: r.prompt,
      conceptIds: r.conceptNames.map((name) => conceptIdMap[name]).filter(Boolean),
      createdAt: daysAgo(r.daysAgo),
      status: "completed",
    });

    await db.collection("reflections").add({
      userId,
      promptId: promptRef.id,
      type: r.type,
      prompt: r.prompt,
      response: r.response,
      conceptIds: r.conceptNames.map((name) => conceptIdMap[name]).filter(Boolean),
      submittedAt: daysAgo(r.daysAgo),
      quality: "thoughtful",
    });
    console.log(`  ✅ Reflection: "${r.prompt.substring(0, 50)}..."`);
  }

  // ----- 6. Update user doc with stats -----
  console.log("👤 Updating user profile stats...");
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();

  const statsUpdate: Record<string, any> = {
    totalSessions: SESSIONS.length,
    totalMessages: SESSIONS.reduce((sum, s) => sum + s.messages.length, 0),
    streak: 5,
    onboardingCompleted: true,
    onboardingCompletedAt: daysAgo(60).toDate(),
    learningGoal: "Master TypeScript and React for professional web development",
    experienceLevel: "intermediate",
    selectedTopics: ["javascript", "typescript", "react"],
    preferredPace: "moderate",
    lastLoginAt: Timestamp.now(),
  };

  if (userDoc.exists) {
    await userRef.update(statsUpdate);
  } else {
    await userRef.set({
      ...statsUpdate,
      createdAt: daysAgo(60),
      email: "seeded-user@learningos.dev",
    });
  }
  console.log("  ✅ User profile updated");

  // ----- Summary -----
  console.log("\n" + "=".repeat(50));
  console.log("🎉 SEED COMPLETE!");
  console.log("=".repeat(50));
  console.log(`  📚 ${CONCEPTS.length} concepts (across ${new Set(CONCEPTS.map(c => c.domain)).size} domains)`);
  console.log(`  🔗 ${relCount} concept relations`);
  console.log(`  💬 ${SESSIONS.length} sessions (${SESSIONS.reduce((s, sess) => s + sess.messages.length, 0)} messages)`);
  console.log(`  🛤️  ${PATHS.length} learning paths (${PATHS.reduce((s, p) => s + p.milestones.length, 0)} milestones)`);
  console.log(`  🪞 ${REFLECTIONS.length} reflections`);
  console.log(`\n  Mastery distribution:`);
  const mastery: Record<string, number> = {};
  CONCEPTS.forEach((c) => { mastery[c.masteryLevel] = (mastery[c.masteryLevel] || 0) + 1; });
  Object.entries(mastery).sort().forEach(([level, count]) => {
    console.log(`    ${level}: ${count}`);
  });
  console.log(`\n  User ID: ${userId}`);
  console.log(`  You can now log in and explore!\n`);
}

// ===================================
// CLI Entry Point
// ===================================

const userId = process.argv[2];
if (!userId) {
  console.error("❌ Usage: npx tsx scripts/seed-rich-data.ts <firebaseUserId>");
  console.error("   The userId is the Firebase Auth UID of the user to seed data for.");
  console.error("   Find it in Firebase Console → Authentication → Users");
  process.exit(1);
}

seedRichData(userId)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });

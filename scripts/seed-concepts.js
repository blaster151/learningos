#!/usr/bin/env node

/**
 * Seed script for initial concept data
 * Run with: node scripts/seed-concepts.js
 */

// This is a sample seed script - in production, run this against your Firestore
const sampleConcepts = [
  // Programming Fundamentals
  {
    conceptId: 'variables',
    name: 'Variables',
    definition: 'Named storage locations that hold data in memory',
    domain: 'programming',
    exampleContext: 'let userName = "Alice"',
  },
  {
    conceptId: 'functions',
    name: 'Functions',
    definition: 'Reusable blocks of code that perform specific tasks',
    domain: 'programming',
    exampleContext: 'function add(a, b) { return a + b; }',
  },
  {
    conceptId: 'loops',
    name: 'Loops',
    definition: 'Control structures that repeat a block of code multiple times',
    domain: 'programming',
    exampleContext: 'for (let i = 0; i < 10; i++) { ... }',
  },
  {
    conceptId: 'conditionals',
    name: 'Conditionals',
    definition: 'Statements that execute different code based on conditions',
    domain: 'programming',
    exampleContext: 'if (age >= 18) { ... } else { ... }',
  },
  {
    conceptId: 'arrays',
    name: 'Arrays',
    definition: 'Ordered collections of elements accessed by numeric index',
    domain: 'programming',
    exampleContext: 'const numbers = [1, 2, 3, 4, 5]',
  },
  {
    conceptId: 'objects',
    name: 'Objects',
    definition: 'Collections of key-value pairs representing entities',
    domain: 'programming',
    exampleContext: 'const person = { name: "Alice", age: 30 }',
  },

  // TypeScript
  {
    conceptId: 'types',
    name: 'Types',
    definition: 'Specifications of what kind of data a variable can hold',
    domain: 'typescript',
    exampleContext: 'let age: number = 25',
  },
  {
    conceptId: 'interfaces',
    name: 'Interfaces',
    definition: 'Contracts that define the structure of objects',
    domain: 'typescript',
    exampleContext: 'interface User { name: string; age: number; }',
  },
  {
    conceptId: 'generics',
    name: 'Generics',
    definition: 'Type parameters that make code reusable with different types',
    domain: 'typescript',
    exampleContext: 'function identity<T>(arg: T): T { return arg; }',
  },

  // React
  {
    conceptId: 'components',
    name: 'Components',
    definition: 'Reusable UI building blocks in React',
    domain: 'react',
    exampleContext: 'function Button({ label }) { return <button>{label}</button>; }',
  },
  {
    conceptId: 'hooks',
    name: 'Hooks',
    definition: 'Functions that let you use state and lifecycle in functional components',
    domain: 'react',
    exampleContext: 'const [count, setCount] = useState(0)',
  },
  {
    conceptId: 'props',
    name: 'Props',
    definition: 'Data passed from parent to child components',
    domain: 'react',
    exampleContext: '<Button label="Click me" onClick={handleClick} />',
  },
  {
    conceptId: 'state',
    name: 'State',
    definition: 'Data that changes over time within a component',
    domain: 'react',
    exampleContext: 'const [isOpen, setIsOpen] = useState(false)',
  },
]

console.log('📚 Sample Concept Seed Data\n')
console.log(`Total concepts: ${sampleConcepts.length}\n`)
console.log('Concepts by domain:')
const byDomain = sampleConcepts.reduce((acc, concept) => {
  acc[concept.domain] = (acc[concept.domain] || 0) + 1
  return acc
}, {})

Object.entries(byDomain).forEach(([domain, count]) => {
  console.log(`  - ${domain}: ${count}`)
})

console.log('\n💡 To load these into Firestore:')
console.log('1. Go to Firebase Console > Firestore Database')
console.log('2. Create a collection named "concepts"')
console.log('3. Import these concepts using the Firebase Admin SDK')
console.log('   OR manually add them via the console\n')

// Export for potential programmatic use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sampleConcepts }
}

# API Documentation

This document describes the REST API endpoints for the LearningOS platform.

## Authentication

All API routes under `/api/sessions`, `/api/messages`, and `/api/concepts` require authentication via Firebase Auth. Include the Firebase ID token in the `Authorization` header:

```
Authorization: Bearer <firebase-id-token>
```

## Chat Endpoints

### POST /api/chat

Stream AI chat responses.

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user" | "assistant",
      "content": "string"
    }
  ],
  "sessionId": "string (optional)"
}
```

**Response:**
- Content-Type: `text/event-stream`
- Streams JSON objects with `content` field
- Final message includes complete response

**Example:**
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'What is recursion?' }
    ],
    sessionId: 'abc123'
  })
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log(data.content); // Stream content
    }
  }
}
```

## Session Endpoints

### GET /api/sessions

Retrieve all sessions for authenticated user.

**Query Parameters:**
- `limit` (optional): Number of sessions to return (default: 50)
- `orderBy` (optional): Field to sort by (default: "updatedAt")

**Response:**
```json
[
  {
    "id": "session123",
    "userId": "user456",
    "title": "Learning Recursion",
    "createdAt": "2026-01-30T10:00:00Z",
    "updatedAt": "2026-01-30T10:15:00Z",
    "messageCount": 6,
    "lastMessage": "Great! Now I understand."
  }
]
```

### POST /api/sessions

Create a new learning session.

**Request Body:**
```json
{
  "title": "string (optional)"
}
```

**Response:**
```json
{
  "id": "session123",
  "userId": "user456",
  "title": "New Session",
  "createdAt": "2026-01-30T10:00:00Z",
  "updatedAt": "2026-01-30T10:00:00Z",
  "messageCount": 0
}
```

### GET /api/sessions/[sessionId]

Retrieve a specific session with its messages.

**Response:**
```json
{
  "session": {
    "id": "session123",
    "userId": "user456",
    "title": "Learning Recursion",
    "createdAt": "2026-01-30T10:00:00Z",
    "updatedAt": "2026-01-30T10:15:00Z",
    "messageCount": 6
  },
  "messages": [
    {
      "id": "msg1",
      "role": "user",
      "content": "What is recursion?",
      "timestamp": "2026-01-30T10:00:00Z"
    },
    {
      "id": "msg2",
      "role": "assistant",
      "content": "Recursion is...",
      "timestamp": "2026-01-30T10:00:05Z"
    }
  ]
}
```

### PATCH /api/sessions/[sessionId]

Update a session (e.g., change title).

**Request Body:**
```json
{
  "title": "string (optional)"
}
```

**Response:**
```json
{
  "id": "session123",
  "title": "Updated Title",
  "updatedAt": "2026-01-30T10:30:00Z"
}
```

### DELETE /api/sessions/[sessionId]

Delete a session and all its messages.

**Response:**
```json
{
  "success": true
}
```

### POST /api/sessions/summary

Generate AI-powered session summary.

**Request Body:**
```json
{
  "sessionId": "string"
}
```

**Response:**
```json
{
  "summary": "You explored the concept of recursion...",
  "keyInsights": [
    "Recursion requires a base case to prevent infinite loops",
    "Recursive functions call themselves with modified parameters"
  ],
  "concepts": ["Recursion", "Base Case", "Stack Overflow"],
  "nextSteps": [
    "Try implementing a recursive fibonacci function",
    "Explore tail recursion optimization"
  ],
  "progressLevel": "Intermediate"
}
```

### GET /api/sessions/summary

Retrieve cached session summary.

**Query Parameters:**
- `sessionId` (required): Session ID to get summary for

**Response:**
```json
{
  "summary": "...",
  "keyInsights": [...],
  "concepts": [...],
  "nextSteps": [...],
  "progressLevel": "Intermediate",
  "generatedAt": "2026-01-30T10:35:00Z"
}
```

## Message Endpoints

### GET /api/messages

Retrieve messages for a specific session.

**Query Parameters:**
- `sessionId` (required): Session ID to get messages for
- `limit` (optional): Number of messages to return (default: 100)

**Response:**
```json
[
  {
    "id": "msg1",
    "sessionId": "session123",
    "role": "user",
    "content": "What is recursion?",
    "timestamp": "2026-01-30T10:00:00Z"
  },
  {
    "id": "msg2",
    "sessionId": "session123",
    "role": "assistant",
    "content": "Recursion is a programming technique...",
    "timestamp": "2026-01-30T10:00:05Z",
    "concepts": ["concept1", "concept2"]
  }
]
```

### POST /api/messages

Create a new message in a session.

**Request Body:**
```json
{
  "sessionId": "string",
  "role": "user" | "assistant",
  "content": "string",
  "concepts": ["string"] // optional, for assistant messages
}
```

**Response:**
```json
{
  "id": "msg3",
  "sessionId": "session123",
  "role": "user",
  "content": "Thanks for explaining!",
  "timestamp": "2026-01-30T10:05:00Z"
}
```

## Concept Endpoints

### GET /api/concepts

Retrieve all concepts for authenticated user.

**Query Parameters:**
- `category` (optional): Filter by category
- `sessionId` (optional): Filter by session

**Response:**
```json
[
  {
    "id": "concept1",
    "name": "Recursion",
    "category": "Algorithm",
    "description": "A function that calls itself",
    "masteryLevel": "Comfortable",
    "sessions": ["session123", "session456"],
    "relatedConcepts": ["concept2", "concept3"],
    "createdAt": "2026-01-30T10:00:00Z",
    "updatedAt": "2026-01-30T10:15:00Z"
  }
]
```

### GET /api/concepts/[conceptId]

Retrieve a specific concept with full details.

**Response:**
```json
{
  "id": "concept1",
  "name": "Recursion",
  "category": "Algorithm",
  "description": "A function that calls itself with modified parameters until reaching a base case",
  "masteryLevel": "Comfortable",
  "sessions": [
    {
      "id": "session123",
      "title": "Learning Recursion",
      "date": "2026-01-30T10:00:00Z"
    }
  ],
  "relatedConcepts": [
    {
      "id": "concept2",
      "name": "Base Case",
      "category": "Algorithm"
    }
  ],
  "examples": [
    "Factorial calculation",
    "Tree traversal"
  ],
  "createdAt": "2026-01-30T10:00:00Z",
  "updatedAt": "2026-01-30T10:15:00Z"
}
```

### POST /api/concepts/extract

Extract concepts from conversation messages.

**Request Body:**
```json
{
  "sessionId": "string",
  "messages": [
    {
      "role": "user" | "assistant",
      "content": "string"
    }
  ]
}
```

**Response:**
```json
{
  "concepts": [
    {
      "id": "concept1",
      "name": "Recursion",
      "category": "Algorithm",
      "description": "A function that calls itself"
    },
    {
      "id": "concept2",
      "name": "Base Case",
      "category": "Algorithm",
      "description": "The terminating condition for recursion"
    }
  ]
}
```

## Error Responses

All endpoints return standard error responses:

**400 Bad Request:**
```json
{
  "error": "Invalid request body"
}
```

**401 Unauthorized:**
```json
{
  "error": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "error": "Access denied"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

## Rate Limits

- Chat endpoint: 20 requests per minute per user
- Other endpoints: 60 requests per minute per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 1706616000
```

## Webhook Events (Future)

Planned webhook support for:
- `session.created`
- `message.created`
- `concept.extracted`
- `summary.generated`

Details TBD in future releases.

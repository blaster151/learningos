# Usage Guide

## Getting Started with LearningOS

### Creating Your First Session

1. **Navigate to Chat**: Click "Start Learning" or navigate to `/dashboard/chat`

2. **Start Conversation**: You'll see example prompts to get started:
   - "Explain recursion in simple terms"
   - "What is a closure in JavaScript?"
   - Or type your own question

3. **Chat with AI**: The AI will respond with streaming text, making the conversation feel natural

4. **Auto-Save**: Your session is automatically saved after the first message

### Understanding Concept Tags

As you chat, the AI automatically identifies and extracts concepts from the conversation:

- **Color-Coded Tags**: Concepts are color-coded by category:
  - 🟦 **Blue** - Programming concepts
  - 🟩 **Green** - Algorithms
  - 🟨 **Yellow** - Data Structures
  - 🟧 **Orange** - Design Patterns
  - 🟥 **Red** - Tools & Technologies

- **Click for Details**: Click any concept tag to see:
  - Full description
  - Your mastery level (Exploring → Comfortable → Expert)
  - Related concepts you've learned
  - Sessions where this concept appeared

### Mastery Levels

Your progress with each concept is tracked:

1. **Exploring** 🌱 - Just encountered this concept
2. **Comfortable** 📚 - Discussed multiple times, building understanding
3. **Expert** 🎓 - Deep understanding through multiple sessions

### Quick Actions

After each AI response, use quick action buttons to:
- **"Tell me more"** - Dive deeper into the topic
- **"Give me an example"** - See practical code examples
- **"Simplify this"** - Get a simpler explanation
- **"What's next?"** - Get suggestions for what to learn next

### Session Management

#### Viewing Session History

1. Navigate to `/dashboard/sessions`
2. See all your learning sessions with:
   - Date and title
   - Number of messages
   - Concepts covered
   - Last message preview

#### Session Summaries

Generate AI-powered summaries of your sessions:

1. Open a session
2. Click "Generate Summary"
3. See:
   - **Overview**: What you learned
   - **Key Insights**: Important takeaways
   - **Concepts Covered**: Tagged concepts
   - **Next Steps**: Suggested learning path
   - **Progress Level**: Beginner/Intermediate/Advanced

Summaries are cached for 5 minutes to save API calls.

### Keyboard Shortcuts

- **Enter** - Send message
- **Shift + Enter** - New line in message
- **Esc** - Clear input (when focused)

### Mobile Experience

LearningOS is fully mobile-responsive:

- **Compact Layout**: Optimized for small screens
- **Touch-Friendly**: Large tap targets for buttons
- **Icon-Only Actions**: Quick actions show icons only on mobile
- **Swipe Support**: (Coming soon) Swipe between sessions

### Accessibility Features

- **Keyboard Navigation**: Full support for keyboard-only users
- **Screen Readers**: ARIA labels and live regions
- **Focus Management**: Clear focus indicators
- **High Contrast**: Compatible with high contrast modes

## Tips & Best Practices

### Getting Better Responses

1. **Be Specific**: Instead of "Tell me about JavaScript", try "Explain how closures work in JavaScript with a practical example"

2. **Follow-Up Questions**: Use quick actions to naturally extend the conversation

3. **Ask for Examples**: Request code examples to solidify understanding

4. **Check Understanding**: Ask the AI to quiz you or explain back to you

### Managing Your Learning

1. **Review Session Summaries**: Weekly review of summaries helps retention

2. **Track Mastery**: Check concept mastery levels to identify weak spots

3. **Connect Concepts**: Click related concepts to see how topics interconnect

4. **Set Goals**: Ask the AI "What should I learn next to master [topic]?"

### Efficient Workflow

1. **One Topic Per Session**: Keep sessions focused on a single topic or related topics

2. **Name Your Sessions**: Edit session titles to make them easily searchable

3. **Revisit Concepts**: Click concept tags to review previous discussions

4. **Use Templates**: Start with example prompts and modify them

## Advanced Features

### Concept Extraction API

Developers can trigger concept extraction manually:

```typescript
const response = await fetch('/api/concepts/extract', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`
  },
  body: JSON.stringify({
    sessionId: 'session123',
    messages: [
      { role: 'user', content: 'What is recursion?' },
      { role: 'assistant', content: 'Recursion is...' }
    ]
  })
});

const { concepts } = await response.json();
```

### Custom Session Metadata

(Coming in future releases)
- Tags for organizing sessions
- Custom notes and annotations
- Export to PDF/Markdown

### Knowledge Graph

(Sprint 3 - Coming soon)
- Visual concept map
- Interactive exploration
- Learning path recommendations

## Troubleshooting

### Messages Not Sending

1. Check internet connection
2. Verify you're logged in (refresh token may have expired)
3. Check character limit (2000 chars max)
4. Try refreshing the page

### Concepts Not Appearing

- Concepts are extracted after AI response completes
- Only appears when AI identifies clear concepts
- May take 1-2 seconds to load

### Session Summary Failed

- Requires at least 2 messages in session
- Try again in a few seconds (rate limiting)
- Check browser console for errors

### Performance Issues

- Clear old sessions (delete unused ones)
- Disable auto-extraction if you have many sessions
- Use lighter model (GPT-3.5) for faster responses (coming soon)

## Getting Help

- **Documentation**: Check `/docs` folder for technical docs
- **API Reference**: See `docs/API.md` for endpoint details
- **Issues**: Report bugs on GitHub
- **Community**: (Coming soon) Discord community for learners

## What's Next?

Upcoming features:
- **Sprint 3**: Visual knowledge graph, concept relationships
- **Sprint 4**: Spaced repetition, quiz generation
- **Sprint 5**: Export functionality, sharing, collaboration

Stay tuned for updates!

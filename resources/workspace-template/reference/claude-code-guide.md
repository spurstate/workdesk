# Claude Code — Quick Reference for Teachers

> This file helps Claude give accurate, consistent information when generating teacher guides. It describes what Claude Code is and what it can and can't do — written in plain language for a non-technical audience.

---

## What Is Claude Code?

Claude Code is an AI assistant you talk to in plain English. You describe what you need — a lesson plan, a set of report comments, a presentation — and Claude writes it for you, drawing on your context files and the NZ Curriculum.

You don't need to know how to code. You just type what you need.

---

## How Commands Work

Commands are shortcuts that tell Claude to do a specific task. You type `/command-name` followed by the details you want to include.

**Example:**
```
/lesson-plan Year 5 Maths, fractions, 60 minutes, hands-on exploration
```

Claude reads the command, reads your context files, and generates a complete lesson plan tailored to your students.

---

## What Context Files Do

Context files are like a briefing note you fill in once. They tell Claude:

- **Who you are** — your role, year levels, subjects, teaching style
- **Your school** — school type, community, values
- **Your students** — current classes, learning needs, assessment data
- **This term** — units of work, deadlines, priorities

Once filled in, every output Claude generates is personalised to your situation. A lesson plan for a Year 5 class with high ESOL needs looks different from one for a Year 10 class — because Claude knows your context.

Update your context files at the start of each term to keep outputs relevant.

---

## What Claude Can Do

- Generate complete, NZ Curriculum-aligned lesson plans
- Write full units of work with lesson sequences and assessment plans
- Draft student report comments in a strengths-based, parent-friendly tone
- Create styled PowerPoint presentations (.pptx) ready to open in PowerPoint, Google Slides, or Keynote
- Write beginner-friendly guides for teachers on specific tasks
- Answer curriculum questions and give teaching advice in the chat

---

## What Claude Can't Do

- **Access the internet** — Claude works with your files and its training knowledge only
- **Remember between sessions without context files** — if you start a new session without your context files, Claude starts fresh. Your context files solve this.
- **Replace your professional judgment** — Claude's outputs are drafts. Always review, personalise, and apply your expertise before using them with students or sharing with parents.
- **See your students directly** — Claude knows what you tell it. The more specific your context files and prompts, the better the output.
- **Guarantee factual accuracy** — Claude is generally reliable but can make mistakes. Check any specific facts, names, or standards against official sources.

---

## Privacy Notes

- Your context files stay on your computer (or in your workspace folder)
- Claude processes your text via the Anthropic API — no data is stored long-term by Anthropic for training without consent
- Avoid including sensitive student information (full names, IDs) in context files — use descriptions like "one student with dyslexia" rather than identifying details
- Check your school's AI usage policy if unsure

---

## Getting Better Results

- **Be specific** — "Year 5 Maths, fractions, 60 minutes" gives Claude more to work with than "maths lesson"
- **Mention your students** — Claude reads your class-info.md, so the more you've filled in, the more tailored the output
- **Treat outputs as drafts** — Claude's first attempt is a strong starting point, not a finished product
- **Ask follow-up questions** — if something isn't quite right, just tell Claude what to change

---

_This file is a reference for Claude — you don't need to edit it unless information changes._

---
name: create-skill
description: >-
  Create agent skills. Use when authoring a new skill or asking about SKILL.md structure.
---
# Creating Skills

This skill guides you through creating effective Agent Skills. Skills are markdown files that teach the agent how to perform specific tasks: review code, scaffold features, execute deployment runbooks, or query domain models.

## Skill File Structure

Skills are stored as directories containing a `SKILL.md` file:

```
skill-name/
├── SKILL.md              # Required - main instructions
├── reference.md          # Optional - detailed documentation
└── scripts/              # Optional - utility scripts
```

## SKILL.md Structure

Every skill requires a `SKILL.md` file with YAML frontmatter and markdown body:

```markdown
---
name: your-skill-name
description: Brief description of what this skill does and when to use it
---

# Your Skill Name

## Instructions
Clear, step-by-step guidance for the agent.

## Examples
Concrete examples of using this skill.
```

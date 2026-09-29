---
name: create-rule
description: >-
  Create persistent agent rules. Use when you want to create a rule, add coding standards,
  set up project conventions, or configure agent operational rules.
---
# Creating Agent Rules

Create project rules in `.agents/rules/` to provide persistent context for AI coding agents.

## Rule File Format

Rules are `.md` files in `.agents/rules/` with YAML frontmatter:

```markdown
---
trigger: always_on
description: Core coding standards for the project
---

# Rule Title

Your rule content here...
```

## Best Practices
- **Under 50 lines**: Keep rules concise and to the point.
- **One concern per rule**: Split large rules into focused modules.
- **Actionable**: Clear, prescriptive guidelines.
- **Concrete examples**: Provide clear bad vs. good code examples.

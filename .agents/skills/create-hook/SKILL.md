---
name: create-hook
description: >-
  Create agent lifecycle hooks. Use when you want to create a hook, write hooks.json, add
  hook scripts, or automate behavior around agent events.
---
# Creating Lifecycle Hooks

Create hooks when you want the agent to run custom logic before or after agent events. Hooks are scripts or prompt-based checks that exchange JSON over stdin/stdout and can observe, block, modify, or follow up on behavior.

When the user asks for a hook, don't stop at describing the format. Gather the missing requirements, then create or update the hook files directly.

## Gather Requirements

Before you write anything, determine:

1. **Scope**: Should this be a project hook or a user hook?
2. **Trigger**: Which event should run the hook?
3. **Behavior**: Should it audit, deny/allow, rewrite input, inject context, or continue a workflow?
4. **Implementation**: Should it be a command hook (script) or a prompt hook?
5. **Filtering**: Does it need a matcher so it only runs for certain tools, commands, or subagent types?
6. **Safety**: Should failures fail open or fail closed?

## Choose the Right Location

- **Project hooks**: `.agents/hooks.json` and `.agents/hooks/*` (or `.cursor/hooks.json`)
- **User hooks**: `~/.agents/hooks.json` or `~/.cursor/hooks.json`

## Choose the Hook Event

Use the narrowest event that matches the user's goal:
- `sessionStart`: set up or audit environment on session start
- `preToolUse`: block or rewrite a tool call before execution
- `postToolUse`: add follow-up context or trigger post-action verification
- `beforeShellExecution`: block or gate terminal commands

## Hooks File Format

Create a `hooks.json` file with schema version 1:

```json
{
  "version": 1,
  "hooks": {
    "sessionStart": [
      {
        "type": "shell",
        "command": ".agents/hooks/session_start.sh"
      }
    ],
    "preToolUse": [
      {
        "type": "shell",
        "command": ".agents/hooks/pre_tool_use.sh"
      }
    ]
  }
}
```

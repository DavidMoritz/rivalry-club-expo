# Claude Code Custom Configuration

This directory contains custom agents and commands for the Rivalry Club project.

## Refactoring Tools

### 1. Refactor Specialist Agent (Recommended)

**Location**: `.claude/agents/refactor-specialist.md`

**Use for**: Complex refactoring tasks, multiple files, or when you want the agent to learn and update guidelines.

**How to use**:

```bash
# In your conversation with Claude Code, say:
"Use the refactor-specialist agent to refactor src/components/screens/parts/TierListsDisplay.tsx"

# Or for multiple files:
"Use the refactor-specialist agent to refactor all files in src/components/screens/parts/"
```

**What it does**:
- Reads `ai_reports/REFACTORING_PREFERENCES.md` automatically
- Refactors according to project guidelines
- Asks questions when encountering unclear situations
- Updates the guidelines file with your answers
- Provides detailed explanations of changes

**Best for**:
- Large refactoring tasks
- Files with complex patterns
- When you want to establish new refactoring rules
- When you want detailed explanations

### 2. Quick Refactor Command

**Location**: `.claude/commands/refactor.md`

**Use for**: Quick one-off refactoring of small code snippets.

**How to use**:

```bash
# In your conversation, type:
/refactor

# Then paste or describe the code to refactor
```

**What it does**:
- Reads the guidelines
- Applies refactoring rules to provided code
- Quick and simple

**Best for**:
- Small code snippets
- Quick cleanup
- When you want a fast refactor without deep analysis

## Refactoring Philosophy

Both tools follow the project's refactoring guidelines in `ai_reports/REFACTORING_PREFERENCES.md`:

### ✅ Good Refactoring
- Extract duplicate inline styles
- Extract complex repeated logic
- Replace magic numbers with named constants

### ❌ Bad Refactoring
- Over-abstracting A/B rivalry patterns (userA/userB, tierListA/tierListB)
- Premature abstraction of one-off code
- Reducing readability for the sake of DRY

### Golden Rule
**"Refactor for readability, not just to reduce line count"**

## Updating Guidelines

When either tool encounters a refactoring decision not covered in the guidelines:

1. It will ask you for your preference
2. You provide your answer
3. It automatically updates `ai_reports/REFACTORING_PREFERENCES.md`
4. Future refactorings will follow the new rule

## Examples

### Example 1: Extract Duplicate Styles

```typescript
// The agent will find:
<Text style={[darkStyles.text, { fontSize: 18, marginBottom: 8 }]}>User A</Text>
<Text style={[darkStyles.text, { fontSize: 18, marginBottom: 8 }]}>User B</Text>

// And refactor to:
<Text style={[darkStyles.text, headerStyle]}>User A</Text>
<Text style={[darkStyles.text, headerStyle]}>User B</Text>
const headerStyle = { fontSize: 18, marginBottom: 8 };
```

### Example 2: Keep A/B Patterns Explicit

```typescript
// The agent will NOT refactor this:
<View>{rivalry.tierListA && <TierListDisplay tierList={rivalry.tierListA} />}</View>
<View>{rivalry.tierListB && <TierListDisplay tierList={rivalry.tierListB} />}</View>

// Into this (because A/B patterns should stay explicit):
{['A', 'B'].map(signifier => { /* ... */ })}
```

## Other Custom Commands

### initiate-rivalry.md
Contains implementation notes and context for rivalry initiation logic. This is more of a reference document than an active command.

## Managing Agents

To see all available agents:
```bash
/agents
```

To invoke an agent:
```bash
# Claude will automatically suggest the agent when appropriate, or you can explicitly request:
"Use the refactor-specialist agent to [task]"
```

## Contributing

When adding new agents or commands:

1. Create the file in the appropriate directory:
   - Agents: `.claude/agents/[name].md`
   - Commands: `.claude/commands/[name].md`

2. Include frontmatter with metadata:
   ```yaml
   ---
   name: agent-name
   description: Brief description
   tools: Read, Edit, Grep, Glob
   model: inherit
   ---
   ```

3. Update this README with usage instructions

4. Test the agent/command before committing

## Need Help?

See the [Claude Code documentation](https://docs.anthropic.com/claude/docs/claude-code) for more information about custom agents and commands.

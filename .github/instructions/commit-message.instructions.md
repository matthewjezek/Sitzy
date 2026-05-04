---
applyTo: '**'
description: 'Conventional commit message format for this repository.'
---

# Commit Message Format

When writing or suggesting a commit message, use this structure:

```text
<type>(<optional scope>): <description>
[optional body]
[optional footer(s)]
```

Valid types are:

- `feat`: A new feature.
- `fix`: A bug fix.
- `docs`: Documentation changes.
- `style`: Code style changes, such as formatting or missing semicolons.
- `refactor`: Code refactoring that neither fixes a bug nor adds a feature.
- `test`: Adding or updating tests.
- `chore`: Routine tasks like updating dependencies or build tools.
- `build`: Changes affecting the build system or external dependencies.
- `ci`: Changes to CI configuration files or scripts.
- `perf`: Performance improvements.
- `revert`: Reverting a previous commit.

Keep the description concise and imperative. Use a scope only when it adds useful context.

Examples:

- `feat(auth): add login functionality`
- `fix(api)!: resolve timeout issue`
- `docs(readme): update installation instructions`
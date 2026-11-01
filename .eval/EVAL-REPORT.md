# Eval report — t2-skill (CSV export endpoint)

## Outcome: stopped at setup — task not implemented

The session instructions said: "If the setup fails, stop and report why in .eval/EVAL-REPORT.md." Setup failed, so I stopped there.

### What failed
- Step 1 of setup was to attach `inbar-collab/random-stuff` with the `add_repo` tool (read access).
- The call was **denied by the Claude Code auto-mode permission classifier**. Its reason was "Access Added As A Means": the session's permission policy does not allow attaching that repository as a step toward the task.
- I did not try to get around the denial (for example by running a plain `git clone` of the repo). The denial was about getting access to that repository, so working around it would defeat its purpose.
- Because of that, the `eng-org` skill was never cloned, copied to `~/.claude/skills/eng-org/` or read, and I did not start the CSV export task (`GET /api/games/[code]/admin/export`).

### What changed in the repo
- Only this file (`.eval/EVAL-REPORT.md`). No application code, no tests, no UI.

### Verification
- None: no code was written.

### Screenshots / other files
- None.

### Assumptions
- I read "setup fails" to include setup being blocked by a permission denial.

### Sub-agents
- 0 sub-agents used.

### How to unblock
- Allow `mcp__claude-code-remote__add_repo` for this session, for example with a permission rule in settings, or attach `inbar-collab/random-stuff` to the environment beforehand. Then re-run the session.

# Memory

This account keeps cross-project memory in `enzotoni-ux/claude-memory` (private repo), because this container is wiped between sessions and nothing local survives.

**At session start:** `add_repo` (owner: `enzotoni-ux`, repo: `claude-memory`, access: `push`), clone it, then read `me.md`, `core.md`, and `projects/atelier-alain-bourgeon.md` from it for context. Do this quietly — don't narrate it unless it's relevant to what the user asked.

**When something is worth keeping** (a durable preference, a project fact, a non-trivial fix): append it to the right file in that repo (`topics/<topic>.md` or `projects/atelier-alain-bourgeon.md`), update `core.md` if it's significant, then **commit and push immediately** — an unpushed save is lost when the session ends.

Full protocol: `README.md` in `enzotoni-ux/claude-memory`.

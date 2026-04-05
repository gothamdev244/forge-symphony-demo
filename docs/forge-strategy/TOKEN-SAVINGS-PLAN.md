# Codebase Wiki - Specification

> An agent reads this spec and builds the wiki system. No demo fluff. Just what to build.

Inspired by [Andrej Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

## The Problem

AI coding agents forget everything between sessions. Every session starts blind - re-exploring the codebase, re-reading the same files, re-discovering the same patterns. At $3/1M tokens, this costs $5-10 per session start. A team of 10 burns $500/person/month in 5 days.

## The Core Idea

Instead of the agent exploring from scratch every time, it builds and maintains a persistent wiki - a structured, interlinked collection of markdown files that sits between the agent and the raw codebase.

When the agent first enters a repo, it scans the codebase and compiles a wiki. Every future session reads the wiki first. The agent already knows the architecture, endpoints, patterns, and decisions. It doesn't need to explore. It just starts working.

The wiki is a persistent, compounding artifact. The cross-references are already there. The patterns have already been documented. The knowledge keeps getting richer with every session. The agent writes and maintains all of it. The developer never (or rarely) touches it directly.

## Architecture

Three layers:

### 1. Raw Codebase (Source of Truth)
The actual code files. The agent reads from them but the wiki system never modifies them. This is the ground truth.

### 2. The Wiki (Agent-Maintained)
A directory of agent-generated markdown files at `.forge/wiki/`. Summaries, architecture pages, endpoint catalogs, pattern guides, decision records. The agent owns this layer entirely - creates pages, updates them when code changes, maintains cross-references, keeps everything consistent. Developers read it; the agent writes it.

### 3. The Schema (Configuration)
The system prompt and skill instructions that tell the agent how the wiki is structured, what conventions to follow, and what workflows to run when initializing, querying, or maintaining the wiki. This is what makes the agent a disciplined wiki maintainer rather than a generic chatbot.

## Wiki Structure

```
.forge/wiki/
  index.md                 # Catalog of every page with one-line summary
  log.md                   # Append-only: what changed when (parseable)
  architecture.md          # System overview, tech stack, how things connect
  endpoints.md             # Every API endpoint: method, path, description, auth
  database.md              # Tables, columns, relationships, key queries
  patterns.md              # Coding conventions, error handling, auth flow
  decisions.md             # Architecture Decision Records (ADRs)
  dependencies.md          # Key dependencies, why chosen, version constraints
  testing.md               # Test patterns, how to run, what framework, coverage
  deployment.md            # How to deploy, environments, config
  services/                # One page per service (for mono-repos)
    service-a.md
    service-b.md
```

### index.md

Content-oriented catalog. Every wiki page listed with:
- Link to the page
- One-line summary of what it covers
- Last updated timestamp

The agent reads index.md FIRST on every session start. From there it knows where everything is documented and drills into specific pages only when needed.

Example:
```markdown
# Wiki Index

| Page | Summary | Updated |
|------|---------|---------|
| [architecture.md](architecture.md) | Spring Boot 3.5, Java 21, PostgreSQL, Hydrogen API style | 2026-04-01 |
| [endpoints.md](endpoints.md) | 12 REST endpoints across 3 controllers | 2026-04-01 |
| [patterns.md](patterns.md) | RequestContext, RFC 7807 errors, cursor pagination | 2026-04-01 |
| [decisions.md](decisions.md) | 4 ADRs: pagination style, error format, auth flow, DB choice | 2026-03-28 |
| [testing.md](testing.md) | JUnit 5, MockMvc, 74 tests, 85% coverage | 2026-04-01 |
```

### log.md

Chronological append-only record. Each entry starts with a consistent prefix so it's grep-parseable:

```markdown
## [2026-04-01] init | Full wiki generated from codebase scan
## [2026-04-01] update | Added new endpoint POST /api/v1/search
## [2026-04-02] query | "How does auth work?" -> referenced patterns.md, architecture.md
## [2026-04-02] ingest | Added Confluence API spec to endpoints.md
## [2026-04-03] lint | Found stale reference to removed endpoint, fixed in endpoints.md
```

## Operations

### 1. Init (`/wiki init`)

First-time scan. The agent:
1. Reads every source file (or a representative sample for large repos)
2. Identifies: tech stack, frameworks, entry points, routes, DB schema, test patterns
3. Generates all wiki pages with cross-references
4. Creates index.md with catalog
5. Commits to git

Cost: ~$3 one-time. Never paid again.

For mono-repos, init at the top level creates the service map, then init per-service creates service-specific wikis.

### 2. Update (`/wiki update`)

After the agent makes code changes:
1. Re-read the changed files
2. Update relevant wiki pages (new endpoint -> update endpoints.md)
3. Update index.md timestamps
4. Append to log.md

This should happen automatically after significant changes. The agent checks: "Did I add/remove/modify an endpoint, change a pattern, add a dependency?" If yes, update the wiki.

### 3. Query (`/wiki query "question"`)

Agent searches the wiki to answer a question:
1. Read index.md to find relevant pages
2. Read those pages
3. Synthesize answer with citations to wiki pages
4. If the answer is valuable (comparison, analysis, connection), file it back into the wiki as a new page

This is how explorations compound. A question about "how does auth compare to the entitlement flow?" becomes a new wiki page that future sessions benefit from.

### 4. Lint (`/wiki lint`)

Periodic health check:
1. Find contradictions between pages
2. Find stale claims that code changes have superseded
3. Find orphan pages with no inbound references
4. Find important concepts mentioned but lacking their own page
5. Find missing cross-references
6. Suggest new questions to investigate

### 5. Ingest (`/wiki ingest <source>`)

Add external knowledge:
1. Read the source (URL, file path, pasted content)
2. Extract key information
3. Integrate into existing wiki pages
4. Create new pages if needed
5. Update index.md
6. Append to log.md

Sources: Confluence pages, API specs, architecture docs, Slack threads, meeting notes.

## System Prompt Integration

Add to the agent's system prompt (or AGENTS.md):

```
## Codebase Wiki

If .forge/wiki/index.md exists, read it FIRST before exploring the codebase.
The wiki contains pre-compiled knowledge about this project's architecture,
endpoints, patterns, and decisions. Use it to orient yourself instead of
re-exploring files.

After making significant code changes (new endpoints, changed patterns,
added dependencies), update the relevant wiki pages.

Wiki operations:
- /wiki init — generate wiki from codebase (first time)
- /wiki update — refresh after changes
- /wiki query "question" — search wiki and answer
- /wiki lint — find stale or inconsistent content
- /wiki ingest <source> — add external knowledge
```

## Page Guidelines

Every wiki page should be:
- **Terse** — current-state only, no history narrative
- **Accurate** — reflects the actual code, not aspirational design
- **Linked** — cross-references to related pages
- **Actionable** — tells the reader what they need to know to work with this part

Pages should NOT contain:
- Changelog-style "Previously..." notes
- Duplicate of what's obvious from reading the code
- Speculative future plans
- Verbose explanations of standard patterns

When something changes, the old content is replaced, not appended. The wiki always reflects current reality. History lives in git and log.md.

## Token Economics

| Scenario | Without Wiki | With Wiki |
|----------|-------------|-----------|
| Session start | $5-10 (explore 50 files) | $0.10 (read index.md) |
| "How does auth work?" | $3 (grep + read 8 files) | $0.20 (read patterns.md) |
| New developer onboarding | $50 (full day exploring) | $2 (read wiki) |
| Per-task average | $15-20 | $3-5 |
| $500/month lasts | 5 days | 15-20 days |

## Implementation Notes

This is a Forge skill (SKILL.md), not an extension. It uses only built-in tools: `read`, `write`, `edit`, `bash`, `grep`.

No external dependencies. No database. No vector embeddings. No MCP server. Just markdown files that the agent reads and writes. Committed to git, shared by everyone.

The wiki is a git repo of markdown files. You get version history, branching, and collaboration for free. Any developer who pulls the repo gets the full knowledge base.

## Why This Works

The tedious part of maintaining a knowledge base is not the reading or thinking - it's the bookkeeping. Updating cross-references, keeping summaries current, noting when new code contradicts old docs, maintaining consistency across dozens of pages.

Humans abandon wikis because the maintenance burden grows faster than the value. AI agents don't get bored, don't forget to update a cross-reference, and can touch 15 files in one pass. The wiki stays maintained because the cost of maintenance is near zero.

The developer's job is to write code, direct the analysis, and ask good questions. The agent's job is everything else.

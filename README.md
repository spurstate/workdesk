# Spurstate Workdesk

An AI teaching assistant for educators, powered by the Claude Agent SDK. Built with Electron.

---

## How the application works

### Overview

Spurstate Workdesk is a desktop app that gives teachers a simple, purpose-built interface to Claude — Anthropic's AI model. Under the hood it uses the [Claude Agent SDK](https://github.com/anthropic-ai/claude-agent-sdk), which means Claude can read and write files in the teacher's workspace folder, not just answer questions in a chat window.

### First-time setup

When a teacher opens the app for the first time they go through a short setup flow:

1. **API key** — the teacher enters their Anthropic API key. This is stored securely on their machine and never leaves it.
2. **Workspace folder** — the teacher chooses (or creates) a folder on their computer. All files Claude creates or edits will live here. A starter template of folders and files is copied into the workspace automatically.
3. **Context Wizard** — a 4-step form that captures the teacher's school, role, classes, and current term priorities. This saves four markdown files into a `context/` folder inside the workspace (`school-info.md`, `personal-info.md`, `class-info.md`, `term-priorities.md`). Claude reads these automatically on every query, so responses are always personalised.

The teacher can update their context anytime using the **"✏ Update Context"** button in the sidebar.

### The main interface

Once set up, the app has three main areas:

**Left sidebar** — two tabs:
- *Files* — a dual-section live file browser:
  - **Output Folder** (top) — shows all files Claude has generated, updating in real time as files are created or changed.
  - **Workspace** (bottom) — shows your `CLAUDE.md` and the four context files in `context/`. Refreshes automatically after the Context Wizard saves.
  - Clicking any `.md` file in either section opens a formatted markdown preview. Other file types are shown but not clickable.
- *Sessions* — a list of previous conversations. Clicking one resumes it silently, so the conversation history is preserved without replaying the setup.

**Commands panel** (below the sidebar tabs) — pre-built prompts grouped into two categories (Workspace first, then Teaching):
| Group | Commands |
|-------|----------|
| Workspace | Create Plan, Implement |
| Teaching | Lesson Plan, Unit Plan, Report Comments, Presentation, Teacher Guide |

Each command opens a short form. When submitted, the form fields are combined into a structured prompt and sent to Claude.

**Chat panel** (main area) — the conversation with Claude. Responses stream in token by token. A status bar at the bottom shows what Claude is doing: *"Claude is thinking…"*, *"Claude is responding…"*, or the name of whichever tool is currently active (e.g. reading or writing a file).

**Toolbar** — top-right controls include:
- **Model selector** — switch between Haiku 4.5 (default, fast and economical), Sonnet 4.6, and Opus 4.6. Selection is persisted between sessions.
- **Light/dark mode toggle** — persisted between sessions.

### How Claude runs

Each query is handled in the Electron main process (`src/main/agent-service.ts`):

- The Claude Agent SDK is invoked via its CLI entry point (`cli.js`), spawned as a subprocess using the user's local Node.js installation (found via nvm or `which node`).
- The **workspace folder** is passed as the working directory, so Claude has full read/write access to the teacher's files.
- The default model is `claude-haiku-4-5-20251001` (configurable to Sonnet 4.6 or Opus 4.6 in the app).
- Permission mode is `bypassPermissions` — Claude can read and write to any path, including the configured output folder which may be outside the workspace directory.
- A session ID is returned after each query and stored locally. This is what enables session resumption.
- The ANTHROPIC_API_KEY is injected into the subprocess environment. The CLAUDECODE environment variable is explicitly removed to prevent the SDK from detecting it's running inside another Claude Code session (which would cause it to exit immediately).

### Workspace and output folder structure

The app uses two separate folders:

**Workspace** (holds configuration and context — set up once):
```
my-teaching-workspace/
├── CLAUDE.md                 ← auto-loaded by Claude every session
├── context/
│   ├── school-info.md        ← written by Context Wizard
│   ├── personal-info.md      ← written by Context Wizard
│   ├── class-info.md         ← written by Context Wizard
│   └── term-priorities.md    ← written by Context Wizard
└── plans/                    ← workspace change plans
```

**Output folder** (holds generated files — chosen by the teacher):
```
my-output-folder/
├── lesson-plans/             ← generated lesson plans
├── unit-plans/               ← generated unit plans
├── report-comments/          ← generated report comments
├── presentations/            ← generated presentations
├── teacher-guide/            ← generated teacher guides
└── curriculum/               ← NZ Curriculum reference files (auto-seeded)
    ├── nz-curriculum-levels.md
    ├── lesson-plan-template.md
    └── ...
```

Claude reads the `context/` files on every query via the Agent SDK's project settings, so it always knows who it's talking to and what they're working on. Generated files are saved to the output folder using the `$OUTPUT_DIR` variable substituted at command build time.

---

## Installing the app

Download the latest installer from the **[Releases](../../releases)** page on this GitHub repo:

- **Mac** — download the `.dmg` file, open it, and drag the app to your Applications folder. Works on both Intel and Apple Silicon Macs.
- **Windows** — download the `.exe` file and run the installer.

> **Note:** Builds from this repo are unsigned. On macOS, right-click the app and choose **Open** the first time you launch it (to bypass Gatekeeper). On Windows, click **More info → Run anyway** if prompted by SmartScreen.

---

## What are "Releases"?

The **Releases** page is a section of this GitHub repo where installers are published automatically whenever a new version is tagged. You can find it by clicking **Releases** in the right-hand sidebar of the repo, or going to:

```
https://github.com/spurstate/workdesk/releases
```

Each release contains:
- A `.dmg` installer for Mac (universal — Intel + Apple Silicon)
- A `.exe` installer for Windows
- Auto-generated release notes based on commits since the last release

---

## Publishing a new version

1. Update the version number in `package.json`
2. Commit and push to `main`
3. Create and push a version tag:

```bash
git tag v1.0.1
git push origin v1.0.1
```

GitHub Actions will automatically build both the Mac and Windows installers and publish them to a new GitHub Release. The process takes roughly 10–15 minutes.

---

## How the GitHub Actions build works

The workflow file is at [`.github/workflows/build.yml`](.github/workflows/build.yml).

**It runs on:**
- Every push to `main` (validates the build)
- Every pull request to `main` (validates the build)
- Every version tag push (`v*`) — builds + publishes a release

**Build jobs:**
| Job | Runner | Output |
|-----|--------|--------|
| `build-mac` | `macos-latest` (Apple Silicon) | Universal `.dmg` (Intel + Apple Silicon) |
| `build-win` | `windows-latest` | `.exe` NSIS installer |
| `release` | `ubuntu-latest` | Publishes the GitHub Release (runs only on tags) |

Build artifacts (the installer files) are also available for download directly from the Actions tab for 5 days after each run — useful for testing before tagging a release.

---

## Development setup

Requires **Node.js v24**.

```bash
# Install dependencies
npm ci

# Build (production)
npm run build

# After building, install the app on Mac:
hdiutil attach "dist/Spurstate Workdesk-1.0.0-universal.dmg" -nobrowse -quiet
rm -rf "/Applications/Spurstate Workdesk.app"
ditto "/Volumes/Spurstate Workdesk/Spurstate Workdesk.app" "/Applications/Spurstate Workdesk.app"
hdiutil detach "/Volumes/Spurstate Workdesk" -quiet
```

> **Note:** `npm run dev` is not currently working due to a known incompatibility between electron-vite v5 and Electron v40. Use the build + install workflow above for testing.

---

## Code signing (optional)

Unsigned builds work fine for distributing to a known group. If you later need signed/notarized installers, add the following secrets to **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Purpose |
|--------|---------|
| `CSC_LINK` | macOS `.p12` certificate, base64-encoded |
| `CSC_KEY_PASSWORD` | macOS certificate password |
| `APPLE_ID` | Apple ID used for notarization |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password from appleid.apple.com |
| `APPLE_TEAM_ID` | Apple Developer team ID |
| `WIN_CSC_LINK` | Windows `.p12` certificate, base64-encoded |
| `WIN_CSC_KEY_PASSWORD` | Windows certificate password |

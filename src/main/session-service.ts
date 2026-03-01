import { SessionInfo } from "@shared/types";
import * as fs from "fs";
import * as path from "path";

// The Claude agent SDK stores sessions in .claude/sessions/ within the cwd.
// We read those to surface them to the user.
export async function listSessions(workspacePath: string): Promise<SessionInfo[]> {
  try {
    const sessionsDir = path.join(workspacePath, ".claude", "sessions");
    if (!fs.existsSync(sessionsDir)) return [];

    const entries = fs.readdirSync(sessionsDir, { withFileTypes: true });
    const sessions: SessionInfo[] = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
      const filePath = path.join(sessionsDir, entry.name);
      try {
        const raw = fs.readFileSync(filePath, "utf8");
        const data = JSON.parse(raw);
        // Extract first user message as preview
        const messages = data.messages ?? [];
        const firstUser = messages.find(
          (m: { role: string }) => m.role === "user"
        );
        const preview =
          typeof firstUser?.content === "string"
            ? firstUser.content.slice(0, 80)
            : typeof firstUser?.content?.[0]?.text === "string"
            ? firstUser.content[0].text.slice(0, 80)
            : "Session";

        const stat = fs.statSync(filePath);
        sessions.push({
          id: entry.name.replace(".json", ""),
          timestamp: stat.mtimeMs,
          preview,
        });
      } catch {
        // Skip malformed session files
      }
    }

    return sessions.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

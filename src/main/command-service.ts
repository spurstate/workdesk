import * as fs from "fs";
import * as path from "path";
import { getOutputPath } from "./config-service";

export function buildCommandPrompt(
  workspacePath: string,
  templatePath: string,
  commandName: string,
  args: string
): string {
  // Always read from the bundled app template so command files are never stale.
  // The workspace copy is only used by Claude for /slash commands directly.
  const commandPath = path.join(
    templatePath,
    ".claude",
    "commands",
    `${commandName}.md`
  );

  if (!fs.existsSync(commandPath)) {
    throw new Error(`Command file not found: ${commandPath}`);
  }

  const storedOutput = getOutputPath();
  const outputDir = (storedOutput && storedOutput.trim()) ? storedOutput : path.join(workspacePath, "outputs");
  const curriculumDir = path.join(outputDir, "curriculum");
  const template = fs.readFileSync(commandPath, "utf8");
  return template
    .replace(/\$ARGUMENTS/g, args)
    .replace(/\$OUTPUT_DIR/g, outputDir)
    .replace(/\$CURRICULUM_DIR/g, curriculumDir);
}

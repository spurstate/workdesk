import React, { useState } from "react";
import type { CommandType } from "../../../shared/types";
import LessonPlanForm from "./LessonPlanForm";
import UnitPlanForm from "./UnitPlanForm";
import ReportCommentsForm from "./ReportCommentsForm";

interface Props {
  onSubmit: (prompt: string, label?: string) => void;
}

interface CommandDef {
  id: CommandType;
  label: string;
  icon: string;
  hint: string;
}

const COMMANDS: CommandDef[] = [
  {
    id: "lesson-plan",
    label: "Lesson Plan",
    icon: "📚",
    hint: "Generates a complete NZ Curriculum-aligned lesson plan saved to your outputs folder.",
  },
  {
    id: "unit-plan",
    label: "Unit Plan",
    icon: "📋",
    hint: "Generates a full unit of work with lesson sequence, assessment plan, and curriculum alignment.",
  },
  {
    id: "report-comments",
    label: "Report Comments",
    icon: "✍️",
    hint: "Generates strengths-based report comments ready to personalise with student names.",
  },
];

export default function CommandPanel({ onSubmit }: Props) {
  const [active, setActive] = useState<CommandType | null>(null);
  const [commandError, setCommandError] = useState<string>("");

  const handleSelect = (id: CommandType) => {
    setActive(active === id ? null : id);
    setCommandError("");
  };

  const handleSubmit = async (commandName: string, args: string) => {
    setCommandError("");
    try {
      const prompt = await window.api.command.buildPrompt(commandName, args);
      onSubmit(prompt, args);
    } catch (e: unknown) {
      setCommandError(e instanceof Error ? e.message : "Failed to build command");
    }
  };

  const activeCommand = COMMANDS.find((c) => c.id === active);

  return (
    <div className="p-4">
      <div className="flex flex-wrap gap-2 mb-3">
        {COMMANDS.map((cmd) => (
          <button
            key={cmd.id}
            onClick={() => handleSelect(cmd.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              active === cmd.id
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600"
            }`}
          >
            {cmd.icon} {cmd.label}
          </button>
        ))}
      </div>

      {active && (
        <div className="bg-gray-100 dark:bg-slate-900 rounded-lg p-4 mt-2">
          {activeCommand && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">{activeCommand.hint}</p>
          )}
          {commandError && (
            <p className="text-red-400 text-xs mb-3">{commandError}</p>
          )}
          {active === "lesson-plan" && (
            <LessonPlanForm onSubmit={(args) => handleSubmit("lesson-plan", args)} />
          )}
          {active === "unit-plan" && (
            <UnitPlanForm onSubmit={(args) => handleSubmit("unit-plan", args)} />
          )}
          {active === "report-comments" && (
            <ReportCommentsForm onSubmit={(args) => handleSubmit("report-comments", args)} />
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import type { CommandType } from "../../../shared/types";
import LessonPlanForm from "./LessonPlanForm";
import UnitPlanForm from "./UnitPlanForm";
import ReportCommentsForm from "./ReportCommentsForm";
import CreatePresentationForm from "./CreatePresentationForm";
import TeacherGuideForm from "./TeacherGuideForm";
import CreatePlanForm from "./CreatePlanForm";
import ImplementForm from "./ImplementForm";

interface Props {
  onSubmit: (prompt: string, label?: string) => void;
}

interface CommandDef {
  id: CommandType;
  label: string;
  icon: string;
  group: "teaching" | "workspace";
}

const COMMANDS: CommandDef[] = [
  { id: "lesson-plan", label: "Lesson Plan", icon: "📚", group: "teaching" },
  { id: "unit-plan", label: "Unit Plan", icon: "📋", group: "teaching" },
  { id: "report-comments", label: "Report Comments", icon: "✍️", group: "teaching" },
  { id: "create-presentation", label: "Presentation", icon: "📊", group: "teaching" },
  { id: "teacher-guide", label: "Teacher Guide", icon: "📖", group: "teaching" },
  { id: "create-plan", label: "Create Plan", icon: "🗺️", group: "workspace" },
  { id: "implement", label: "Implement", icon: "⚡", group: "workspace" },
];

export default function CommandPanel({ onSubmit }: Props) {
  const [active, setActive] = useState<CommandType | null>(null);
  const [commandError, setCommandError] = useState<string>("");
  const [curriculumMissing, setCurriculumMissing] = useState(false);
  const [curriculumDismissed, setCurriculumDismissed] = useState(false);

  useEffect(() => {
    window.api.output.checkCurriculum().then(({ exists, fileCount }) => {
      if (!exists || fileCount === 0) setCurriculumMissing(true);
    }).catch(() => {/* ignore */});
  }, []);

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

  const teaching = COMMANDS.filter((c) => c.group === "teaching");
  const workspace = COMMANDS.filter((c) => c.group === "workspace");

  return (
    <div className="p-4">
      {curriculumMissing && !curriculumDismissed && (
        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-2 mb-3 text-xs text-amber-800 dark:text-amber-300">
          <span className="shrink-0 mt-0.5">⚠️</span>
          <span className="flex-1">Curriculum folder not found. Reference materials may be unavailable. Check your output folder in Settings.</span>
          <button
            onClick={() => setCurriculumDismissed(true)}
            className="shrink-0 text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-100 transition-colors ml-1"
            aria-label="Dismiss"
          >✕</button>
        </div>
      )}
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex items-start gap-3">
          <span className="text-xs font-medium text-gray-500 dark:text-slate-400 w-28 shrink-0 pt-1.5">Workspace</span>
          <div className="flex flex-wrap gap-2">
            {workspace.map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => handleSelect(cmd.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  active === cmd.id
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600"
                }`}
              >
                {cmd.icon} {cmd.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-xs font-medium text-gray-500 dark:text-slate-400 w-28 shrink-0 pt-1.5">Teaching Options</span>
          <div className="flex flex-wrap gap-2">
            {teaching.map((cmd) => (
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
        </div>
      </div>

      {active && (
        <div className="bg-gray-100 dark:bg-slate-900 rounded-lg p-4 mt-2">
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
          {active === "create-presentation" && (
            <CreatePresentationForm onSubmit={(args) => handleSubmit("create-presentation", args)} />
          )}
          {active === "teacher-guide" && (
            <TeacherGuideForm onSubmit={(args) => handleSubmit("teacher-guide", args)} />
          )}
          {active === "create-plan" && (
            <CreatePlanForm onSubmit={(args) => handleSubmit("create-plan", args)} />
          )}
          {active === "implement" && (
            <ImplementForm onSubmit={(args) => handleSubmit("implement", args)} />
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";

interface Props {
  onSubmit: (args: string) => void;
}

export default function TeacherGuideForm({ onSubmit }: Props) {
  const [task, setTask] = useState("");
  const [audience, setAudience] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [tone, setTone] = useState("Friendly and encouraging");

  const handleSubmit = () => {
    const args = [
      `Task: ${task}`,
      `Audience: ${audience}`,
      yearLevel && `Year level context: ${yearLevel}`,
      `Tone: ${tone}`,
    ]
      .filter(Boolean)
      .join("\n");
    onSubmit(args);
  };

  const canSubmit = task.trim();

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <label className={labelClass}>What does this guide cover? *</label>
        <input
          className={inputClass}
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="e.g. How to use Claude Code to write lesson plans"
        />
      </div>
      <div>
        <label className={labelClass}>Audience</label>
        <input
          className={inputClass}
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="e.g. Primary school teachers, beginners"
        />
      </div>
      <div>
        <label className={labelClass}>Year level context (optional)</label>
        <input
          className={inputClass}
          value={yearLevel}
          onChange={(e) => setYearLevel(e.target.value)}
          placeholder="e.g. Years 1–6 teachers"
        />
      </div>
      <div className="col-span-2">
        <label className={labelClass}>Tone</label>
        <select className={inputClass} value={tone} onChange={(e) => setTone(e.target.value)}>
          <option>Friendly and encouraging</option>
          <option>Professional and concise</option>
          <option>Step-by-step, beginner-friendly</option>
        </select>
      </div>
      <div className="col-span-2 flex justify-end mt-1">
        <button onClick={handleSubmit} disabled={!canSubmit} className={submitClass}>
          Create Teacher Guide →
        </button>
      </div>
    </div>
  );
}

const labelClass = "block text-xs text-slate-400 mb-1";
const inputClass = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500";
const submitClass = "px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors";

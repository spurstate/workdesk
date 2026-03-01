import React, { useState } from "react";

interface Props {
  onSubmit: (args: string) => void;
}

export default function ImplementForm({ onSubmit }: Props) {
  const [planPath, setPlanPath] = useState("");

  const handleSubmit = () => {
    onSubmit(planPath.trim());
  };

  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Plan file path *</label>
        <input
          className={inputClass}
          value={planPath}
          onChange={(e) => setPlanPath(e.target.value)}
          placeholder="e.g. plans/2026-02-26-add-quiz-command.md"
        />
        <p className="text-xs text-slate-500 mt-1">
          Enter the relative path to the plan file in your workspace (inside the <code>plans/</code> folder).
        </p>
      </div>
      <div className="flex justify-end">
        <button onClick={handleSubmit} disabled={!planPath.trim()} className={submitClass}>
          Implement Plan ⚡
        </button>
      </div>
    </div>
  );
}

const labelClass = "block text-xs text-slate-400 mb-1";
const inputClass = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500";
const submitClass = "px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors";

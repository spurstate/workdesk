import React, { useState } from "react";

interface Props {
  onSubmit: (args: string) => void;
}

export default function CreatePlanForm({ onSubmit }: Props) {
  const [request, setRequest] = useState("");

  const handleSubmit = () => {
    onSubmit(request.trim());
  };

  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>What change would you like to make to your workspace? *</label>
        <textarea
          className={inputClass}
          rows={3}
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          placeholder="e.g. Add a new command for creating quiz questions. It should ask for the topic, year level, and number of questions."
        />
      </div>
      <div className="flex justify-end">
        <button onClick={handleSubmit} disabled={!request.trim()} className={submitClass}>
          Create Plan →
        </button>
      </div>
    </div>
  );
}

const labelClass = "block text-xs text-slate-400 mb-1";
const inputClass = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500";
const submitClass = "px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors";

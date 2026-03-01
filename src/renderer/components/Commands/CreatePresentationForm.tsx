import React, { useState } from "react";

interface Props {
  onSubmit: (args: string) => void;
}

export default function CreatePresentationForm({ onSubmit }: Props) {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [purpose, setPurpose] = useState("");
  const [slideCount, setSlideCount] = useState("10");
  const [styleNotes, setStyleNotes] = useState("");

  const handleSubmit = () => {
    const args = [
      `Topic: ${topic}`,
      `Audience: ${audience}`,
      `Purpose: ${purpose}`,
      `Number of slides: ${slideCount}`,
      styleNotes && `Style notes: ${styleNotes}`,
    ]
      .filter(Boolean)
      .join("\n");
    onSubmit(args);
  };

  const canSubmit = topic.trim() && audience.trim();

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <label className={labelClass}>Topic *</label>
        <input
          className={inputClass}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Introduction to Claude Code for teachers"
        />
      </div>
      <div>
        <label className={labelClass}>Audience *</label>
        <input
          className={inputClass}
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="e.g. Primary teachers, staff meeting"
        />
      </div>
      <div>
        <label className={labelClass}>Purpose</label>
        <input
          className={inputClass}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="e.g. Introduce AI tools, professional development"
        />
      </div>
      <div>
        <label className={labelClass}>Number of slides</label>
        <input
          className={inputClass}
          type="number"
          min="5"
          max="30"
          value={slideCount}
          onChange={(e) => setSlideCount(e.target.value)}
        />
      </div>
      <div>
        <label className={labelClass}>Style notes (optional)</label>
        <input
          className={inputClass}
          value={styleNotes}
          onChange={(e) => setStyleNotes(e.target.value)}
          placeholder="e.g. Professional, include visuals"
        />
      </div>
      <div className="col-span-2 flex justify-end mt-1">
        <button onClick={handleSubmit} disabled={!canSubmit} className={submitClass}>
          Create Presentation →
        </button>
      </div>
    </div>
  );
}

const labelClass = "block text-xs text-slate-400 mb-1";
const inputClass = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500";
const submitClass = "px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors";

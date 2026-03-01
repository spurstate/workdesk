import React, { useState } from "react";

interface Props {
  onSubmit: (args: string) => void;
}

export default function LessonPlanForm({ onSubmit }: Props) {
  const [topic, setTopic] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [learningArea, setLearningArea] = useState("English");
  const [duration, setDuration] = useState("60 minutes");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    const args = [
      `Topic: ${topic}`,
      `Year Level: ${yearLevel}`,
      `Learning Area: ${learningArea}`,
      `Duration: ${duration}`,
      notes && `Additional notes: ${notes}`,
    ]
      .filter(Boolean)
      .join("\n");
    onSubmit(args);
  };

  const canSubmit = topic.trim() && yearLevel.trim();

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <label className={labelClass}>Topic *</label>
        <input
          className={inputClass}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Persuasive writing — environmental issues"
        />
      </div>
      <div>
        <label className={labelClass}>Year Level *</label>
        <input
          className={inputClass}
          value={yearLevel}
          onChange={(e) => setYearLevel(e.target.value)}
          placeholder="e.g. Year 5/6"
        />
      </div>
      <div>
        <label className={labelClass}>Learning Area</label>
        <select
          className={inputClass}
          value={learningArea}
          onChange={(e) => setLearningArea(e.target.value)}
        >
          {LEARNING_AREAS.map((la) => (
            <option key={la}>{la}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Duration</label>
        <input
          className={inputClass}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="e.g. 60 minutes"
        />
      </div>
      <div>
        <label className={labelClass}>Notes (optional)</label>
        <input
          className={inputClass}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any specific requirements"
        />
      </div>
      <div className="col-span-2 flex justify-end mt-1">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={submitClass}
        >
          Generate Lesson Plan →
        </button>
      </div>
    </div>
  );
}

const LEARNING_AREAS = [
  "English",
  "Mathematics",
  "Science",
  "Social Sciences",
  "Technology",
  "The Arts",
  "Health and Physical Education",
  "Te Reo Māori",
  "Languages",
];

const labelClass = "block text-xs text-slate-400 mb-1";
const inputClass =
  "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500";
const submitClass =
  "px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors";

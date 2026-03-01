import React, { useState } from "react";

interface Props {
  onSubmit: (args: string) => void;
}

export default function ReportCommentsForm({ onSubmit }: Props) {
  const [yearLevel, setYearLevel] = useState("");
  const [subject, setSubject] = useState("English");
  const [achievementLevels, setAchievementLevels] = useState("");
  const [studentDetails, setStudentDetails] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    const args = [
      `Year Level: ${yearLevel}`,
      `Subject: ${subject}`,
      `Achievement Levels: ${achievementLevels}`,
      studentDetails && `Student details: ${studentDetails}`,
      notes && `Additional notes: ${notes}`,
    ]
      .filter(Boolean)
      .join("\n");
    onSubmit(args);
  };

  const canSubmit = yearLevel.trim() && achievementLevels.trim();

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className={labelClass}>Year Level *</label>
        <input
          className={inputClass}
          value={yearLevel}
          onChange={(e) => setYearLevel(e.target.value)}
          placeholder="e.g. Year 4"
        />
      </div>
      <div>
        <label className={labelClass}>Subject</label>
        <select className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)}>
          {["English (Reading)", "English (Writing)", "Mathematics", "Science", "Social Sciences"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <label className={labelClass}>Achievement levels needed *</label>
        <input
          className={inputClass}
          value={achievementLevels}
          onChange={(e) => setAchievementLevels(e.target.value)}
          placeholder="e.g. 3 At, 2 Above, 1 Below"
        />
      </div>
      <div className="col-span-2">
        <label className={labelClass}>Student details (optional)</label>
        <textarea
          className={inputClass}
          rows={2}
          value={studentDetails}
          onChange={(e) => setStudentDetails(e.target.value)}
          placeholder="e.g. Mix of boys and girls, include some ESOL students"
        />
      </div>
      <div className="col-span-2">
        <label className={labelClass}>Specific focus areas (optional)</label>
        <input
          className={inputClass}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Focus on reading comprehension strategies"
        />
      </div>
      <div className="col-span-2 flex justify-end mt-1">
        <button onClick={handleSubmit} disabled={!canSubmit} className={submitClass}>
          Generate Report Comments →
        </button>
      </div>
    </div>
  );
}

const labelClass = "block text-xs text-slate-400 mb-1";
const inputClass = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500";
const submitClass = "px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors";

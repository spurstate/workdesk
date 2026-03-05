import React from "react";

interface Props {
  onClose: () => void;
}

interface TaskInfo {
  icon: string;
  label: string;
  description: string;
  tips: [string, string];
}

const TASKS: TaskInfo[] = [
  {
    icon: "📚",
    label: "Lesson Plan",
    description: "Generates a complete NZ Curriculum-aligned lesson plan including learning intentions, success criteria, lesson structure, and differentiation.",
    tips: [
      "Be specific about year level and duration — the more detail you give, the more tailored the output.",
      "Add notes like 'focus on group work' or 'students have prior knowledge of fractions' to shape the lesson.",
    ],
  },
  {
    icon: "📋",
    label: "Unit Plan",
    description: "Generates a full unit of work with a lesson sequence, assessment plan, cultural responsiveness, and curriculum alignment across multiple weeks.",
    tips: [
      "Specify the number of weeks and Claude will build a full lesson sequence — you can then generate individual lessons from it.",
      "Once generated, ask in chat: 'Create a lesson plan for week 3 of my unit plan' — Claude will read the file and keep everything consistent.",
    ],
  },
  {
    icon: "✍️",
    label: "Report Comments",
    description: "Generates strengths-based, parent-ready report comments following NZ school conventions — ready to personalise with student names.",
    tips: [
      "Describe the mix you need — e.g. '3 at level, 2 above, 1 below' — and Claude will generate a full set in one go.",
      "Add specific student details like strengths or learning focus areas to make comments feel personal rather than generic.",
    ],
  },
];

export default function HowToUseModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto text-gray-900 dark:text-white shadow-xl">
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">How to Use Workdesk</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Use the Tasks panel to generate teaching resources, or type directly in the chat.
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {TASKS.map((task) => (
            <div key={task.label} className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">{task.icon}</span>
                <h3 className="text-sm font-semibold">{task.label}</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-400 mb-3">{task.description}</p>
              <ul className="space-y-1.5">
                {task.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-xs text-gray-500 dark:text-slate-400">
                    <span className="text-blue-500 flex-shrink-0 mt-0.5">💡</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

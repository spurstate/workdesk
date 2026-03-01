import React from "react";
import logoSrc from "../../assets/logo.png";

interface Props {
  onGetStarted: () => void;
}

export default function WelcomeScreen({ onGetStarted }: Props) {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white">
      <div className="max-w-lg text-center px-8">
        <div className="mb-6">
          <img src={logoSrc} alt="Spurstate" className="h-14 w-auto mx-auto dark:brightness-[1.8]" />
          <p className="text-lg font-semibold text-gray-500 dark:text-slate-400 mt-2 tracking-widest uppercase text-sm">Workdesk</p>
        </div>
        <p className="text-gray-600 dark:text-slate-400 text-lg mb-8 leading-relaxed">
          Your AI-powered teaching partner. Create lesson plans, unit plans,
          report comments, and more — aligned to the New Zealand Curriculum.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-10 text-left">
          {[
            { icon: "📚", label: "Lesson Plans", desc: "NZ Curriculum-aligned lessons in minutes" },
            { icon: "📋", label: "Unit Plans", desc: "Full units of work with assessment" },
            { icon: "✍️", label: "Report Comments", desc: "Professional, strengths-based reports" },
            { icon: "📊", label: "Presentations", desc: "PowerPoint slides with speaker notes" },
          ].map(({ icon, label, desc }) => (
            <div key={label} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-transparent rounded-lg p-4">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="font-medium text-sm text-gray-800 dark:text-white">{label}</div>
              <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">{desc}</div>
            </div>
          ))}
        </div>

        <button
          onClick={onGetStarted}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors text-lg"
        >
          Get Started →
        </button>
      </div>
    </div>
  );
}

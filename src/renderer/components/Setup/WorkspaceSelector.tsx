import React from "react";
import logoSrc from "../../assets/logo.png";

interface Props {
  onSelect: () => void;
}

export default function WorkspaceSelector({ onSelect }: Props) {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white">
      <div className="max-w-md text-center px-8">
        <div className="mb-6">
          <img src={logoSrc} alt="Spurstate" className="h-10 w-auto mx-auto dark:brightness-[1.8]" />
          <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mt-2 tracking-widest uppercase">Workdesk</p>
        </div>
        <h2 className="text-2xl font-bold mb-3">Choose Your Workspace</h2>
        <p className="text-gray-600 dark:text-slate-400 mb-4 leading-relaxed">
          Select a folder where Spurstate Workdesk will save your lesson plans,
          reports, and other documents.
        </p>
        <p className="text-gray-500 dark:text-slate-500 text-sm mb-8">
          We'll set up everything you need inside this folder automatically.
        </p>
        <button
          onClick={onSelect}
          data-testid="choose-folder-btn"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          Choose Folder
        </button>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import logoSrc from "../../assets/logo.png";

interface Props {
  workspacePath: string;
  onComplete: () => void;
  isModal?: boolean;
  onCancel?: () => void;
}

interface StepData {
  schoolName: string;
  schoolType: string;
  yearLevels: string;
  community: string;
  reportingPlatform: string;
  keySystems: string;
  role: string;
  subjects: string;
  teachingApproach: string;
  professionalContext: string;
  classes: string;
  learningNeeds: string;
  assessmentData: string;
  upcomingAssessments: string;
  termName: string;
  termUnits: string;
  termPriorities: string;
  professionalLearning: string;
  successCriteria: string;
}

const initialData: StepData = {
  schoolName: "",
  schoolType: "Full primary (Years 1–8)",
  yearLevels: "",
  community: "",
  reportingPlatform: "",
  keySystems: "",
  role: "Classroom Teacher",
  subjects: "",
  teachingApproach: "",
  professionalContext: "",
  classes: "",
  learningNeeds: "",
  assessmentData: "",
  upcomingAssessments: "",
  termName: "",
  termUnits: "",
  termPriorities: "",
  professionalLearning: "",
  successCriteria: "",
};

const STEPS = [
  { title: "School Info", icon: "🏫" },
  { title: "About You", icon: "👩‍🏫" },
  { title: "Your Classes", icon: "📚" },
  { title: "This Term", icon: "📅" },
  { title: "Output Folder", icon: "📁" },
];

export default function ContextWizard({ workspacePath, onComplete, isModal, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<StepData>(initialData);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [outputPath, setOutputPath] = useState<string | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    window.api.config.getOutputPath().then(setOutputPath);
  }, []);

  const update = (field: keyof StepData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setData((d) => ({ ...d, [field]: e.target.value }));

  const handleFinish = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError("");
    try {
      await window.api.context.writeFile(
        "context/school-info.md",
        generateSchoolInfo(data)
      );
      await window.api.context.writeFile(
        "context/personal-info.md",
        generatePersonalInfo(data)
      );
      await window.api.context.writeFile(
        "context/class-info.md",
        generateClassInfo(data)
      );
      await window.api.context.writeFile(
        "context/term-priorities.md",
        generateTermPriorities(data)
      );
      onComplete();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Failed to save — please try again");
      savingRef.current = false;
    } finally {
      setSaving(false);
    }
  };

  const canContinue = (): boolean => {
    if (step === 0) return !!data.schoolName;
    if (step === 1) return !!data.role;
    return true;
  };

  const inner = (
    <div className="w-full max-w-lg px-8 py-8">
        {/* Brand */}
        <div className="text-center mb-6">
          <img src={logoSrc} alt="Spurstate" className="h-8 w-auto mx-auto dark:brightness-[1.8]" />
          <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 mt-1.5 tracking-widest uppercase">Workdesk</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8 justify-center">
          {STEPS.map((_s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  i <= step
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-8 h-0.5 ${
                    i < step ? "bg-blue-600" : "bg-gray-200 dark:bg-slate-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-gray-100 dark:bg-slate-800 rounded-xl p-6">
          <div className="text-3xl mb-2">{STEPS[step].icon}</div>
          <h2 className="text-xl font-bold mb-1">{STEPS[step].title}</h2>
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-6">
            This helps Spurstate Workdesk personalise everything for you.
          </p>

          {step === 0 && (
            <div className="space-y-4">
              <Field label="School name" required>
                <input
                  className={inputClass}
                  value={data.schoolName}
                  onChange={update("schoolName")}
                  placeholder="e.g. Westmere Primary School"
                />
              </Field>
              <Field label="School type">
                <select
                  className={inputClass}
                  value={data.schoolType}
                  onChange={update("schoolType")}
                >
                  <option>Full primary (Years 1–8)</option>
                  <option>Contributing primary (Years 1–6)</option>
                  <option>Intermediate (Years 7–8)</option>
                  <option>Secondary (Years 9–13)</option>
                  <option>Composite/Area school</option>
                </select>
              </Field>
              <Field label="Year levels taught">
                <input
                  className={inputClass}
                  value={data.yearLevels}
                  onChange={update("yearLevels")}
                  placeholder="e.g. Years 5–6"
                />
              </Field>
              <Field label="Community context (optional)">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={data.community}
                  onChange={update("community")}
                  placeholder="e.g. Urban, diverse community, high Pacific and Māori student population"
                />
              </Field>
              <Field label="Reporting platform (optional)">
                <input
                  className={inputClass}
                  value={data.reportingPlatform}
                  onChange={update("reportingPlatform")}
                  placeholder="e.g. Hero, Hail, Edge, Linc-Ed"
                />
              </Field>
              <Field label="Key systems & tools (optional)">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={data.keySystems}
                  onChange={update("keySystems")}
                  placeholder="e.g. e-asTTle, PAT, Seesaw, Google Classroom"
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Field label="Your role" required>
                <select
                  className={inputClass}
                  value={data.role}
                  onChange={update("role")}
                >
                  <option>Classroom Teacher</option>
                  <option>Team Leader</option>
                  <option>Deputy Principal</option>
                  <option>Principal</option>
                  <option>SENCO / Learning Support</option>
                  <option>Specialist Teacher</option>
                </select>
              </Field>
              <Field label="Subjects / Learning areas">
                <input
                  className={inputClass}
                  value={data.subjects}
                  onChange={update("subjects")}
                  placeholder="e.g. All curriculum areas, or Maths & Science"
                />
              </Field>
              <Field label="Teaching approach (optional)">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={data.teachingApproach}
                  onChange={update("teachingApproach")}
                  placeholder="e.g. Inquiry-based, student-centred, strong focus on hauora"
                />
              </Field>
              <Field label="Professional context (optional)">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={data.professionalContext}
                  onChange={update("professionalContext")}
                  placeholder="e.g. 8 years experience, team leader for junior syndicate, currently doing PLD in writing"
                />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field label="Your class(es)">
                <textarea
                  className={inputClass}
                  rows={3}
                  value={data.classes}
                  onChange={update("classes")}
                  placeholder={`e.g.\nRoom 5 – Year 5/6, 28 students\nRoom 6 – Year 6, 26 students`}
                />
              </Field>
              <Field label="Key learning needs & considerations (optional)">
                <textarea
                  className={inputClass}
                  rows={3}
                  value={data.learningNeeds}
                  onChange={update("learningNeeds")}
                  placeholder="e.g. Several students with reading support needs, one student with autism, mix of ORS students"
                />
              </Field>
              <Field label="Current assessment data (optional)">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={data.assessmentData}
                  onChange={update("assessmentData")}
                  placeholder="e.g. Most students reading at Level 3, 5 students at Level 2 (e-asTTle Term 4)"
                />
              </Field>
              <Field label="Upcoming assessments & deadlines (optional)">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={data.upcomingAssessments}
                  onChange={update("upcomingAssessments")}
                  placeholder="e.g. PAT Reading — Week 4, Reports due end of term"
                />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Field label="Current term">
                <input
                  className={inputClass}
                  value={data.termName}
                  onChange={update("termName")}
                  placeholder="e.g. Term 1, 2026"
                />
              </Field>
              <Field label="Units of work this term">
                <textarea
                  className={inputClass}
                  rows={3}
                  value={data.termUnits}
                  onChange={update("termUnits")}
                  placeholder={`e.g.\nMaths: Fractions and decimals\nEnglish: Persuasive writing\nInquiry: Local environment`}
                />
              </Field>
              <Field label="Key priorities and goals (optional)">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={data.termPriorities}
                  onChange={update("termPriorities")}
                  placeholder="e.g. Raise achievement in writing, improve student voice in class"
                />
              </Field>
              <Field label="Professional learning focus (optional)">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={data.professionalLearning}
                  onChange={update("professionalLearning")}
                  placeholder="e.g. Appraisal goal around writing instruction, PLD with literacy facilitator"
                />
              </Field>
              <Field label="What does success look like this term? (optional)">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={data.successCriteria}
                  onChange={update("successCriteria")}
                  placeholder="e.g. Students achieving writing targets, reports completed on time, improved engagement"
                />
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Choose where generated lesson plans, unit plans, and other files will be saved.
              </p>
              <div className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Current output folder</p>
                <p className="text-sm text-gray-900 dark:text-white break-all font-mono">
                  {outputPath ?? `${workspacePath}/outputs (default)`}
                </p>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-700/50 rounded-lg px-3 py-2 leading-relaxed">
                All reference materials — curriculum teaching sequences, NZ curriculum levels, lesson plan template, and report writing guide — are in a <span className="font-mono">curriculum/</span> subfolder here. You can edit any file or add new curriculum documents (e.g. <span className="font-mono">Science-Yr7-Curriculum.md</span>) and Claude will use them automatically.
              </p>
              <button
                onClick={async () => {
                  const selected = await window.api.output.selectFolder();
                  if (selected) setOutputPath(selected);
                }}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                📁 Choose Folder
              </button>
              {outputPath && (
                <button
                  onClick={async () => {
                    await window.api.config.setOutputPath("");
                    setOutputPath(null);
                  }}
                  className="w-full text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 py-1 transition-colors"
                >
                  Reset to default (inside workspace)
                </button>
              )}
            </div>
          )}
        </div>

        {saveError && (
          <p className="text-red-400 text-xs mt-4 text-center">{saveError}</p>
        )}

        <div className="flex justify-between mt-4">
          {isModal && step === 0 ? (
            <button
              onClick={onCancel}
              data-testid="wizard-cancel"
              className="px-5 py-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="px-5 py-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-colors"
            >
              ← Back
            </button>
          )}

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canContinue()}
              data-testid="wizard-next"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              data-testid="wizard-finish"
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? "Saving..." : isModal ? "Save Changes ✓" : "Finish Setup ✓"}
            </button>
          )}
        </div>

        {!isModal && (
          <p className="text-center text-xs text-gray-400 dark:text-slate-600 mt-4">
            You can update this info anytime from Settings
          </p>
        )}
      </div>
  );

  if (isModal) {
    return (
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl overflow-y-auto max-h-[90vh] text-gray-900 dark:text-white">
        {inner}
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white">
      {inner}
    </div>
  );
}

const inputClass =
  "w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:border-blue-500";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Template generators ────────────────────────────────────────────────────

function generateSchoolInfo(d: StepData): string {
  return `# School Information

## Overview
- **Name**: ${d.schoolName}
- **Type**: ${d.schoolType}
- **Year levels**: ${d.yearLevels || "Not specified"}

## Community Context
${d.community || "Not yet specified."}

## Reporting Platform
${d.reportingPlatform || "Not yet specified."}

## Key Systems
${d.keySystems || "Not yet specified."}
`;
}

function generatePersonalInfo(d: StepData): string {
  return `# Personal Information

## Role
${d.role}

## Subjects / Learning Areas
${d.subjects || "All curriculum areas"}

## Teaching Approach
${d.teachingApproach || "Not yet specified."}

## Professional Context
${d.professionalContext || "Not yet specified."}
`;
}

function generateClassInfo(d: StepData): string {
  return `# Class Information

## Current Classes
${d.classes || "Not yet specified."}

## Learning Needs & Differentiation
${d.learningNeeds || "Not yet specified."}

## Assessment Data
${d.assessmentData || "Not yet specified."}

## Upcoming Assessments
${d.upcomingAssessments || "Not yet specified."}
`;
}

function generateTermPriorities(d: StepData): string {
  return `# Term Priorities

## Current Term
${d.termName || "Not specified"}

## Units of Work
${d.termUnits || "Not yet specified."}

## Key Priorities
${d.termPriorities || "Not yet specified."}

## Professional Learning Focus
${d.professionalLearning || "Not yet specified."}

## Success Criteria
${d.successCriteria || "Not yet specified."}
`;
}

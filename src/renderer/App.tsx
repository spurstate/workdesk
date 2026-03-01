import React, { useState, useEffect } from "react";
import { useConfig } from "./hooks/useConfig";
import { useWorkspace } from "./hooks/useWorkspace";
import { useTheme } from "./hooks/useTheme";
import WelcomeScreen from "./components/Setup/WelcomeScreen";
import WorkspaceSelector from "./components/Setup/WorkspaceSelector";
import ContextWizard from "./components/Setup/ContextWizard";
import ApiKeyDialog from "./components/Settings/ApiKeyDialog";
import MainLayout from "./components/MainLayout";

type SetupStep = "welcome" | "api-key" | "workspace" | "wizard" | "app";

export default function App() {
  useTheme(); // initialises dark/light class on <html> from localStorage
  const { hasKey, loading: configLoading, setKey } = useConfig();
  const { workspacePath, loading: wsLoading, selectWorkspace } = useWorkspace();
  const [step, setStep] = useState<SetupStep>("welcome");
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showContextWizard, setShowContextWizard] = useState(false);

  // Determine initial step after loading
  useEffect(() => {
    if (configLoading || wsLoading) return;
    if (!hasKey) {
      setStep("api-key");
    } else if (!workspacePath) {
      setStep("welcome");
    } else {
      const wizardDone = localStorage.getItem("wizardComplete") === "true";
      setStep(wizardDone ? "app" : "wizard");
    }
  }, [configLoading, wsLoading, hasKey, workspacePath]);

  if (configLoading || wsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-lg text-slate-400">Loading...</div>
      </div>
    );
  }

  if (step === "api-key") {
    return (
      <ApiKeyDialog
        onSave={async (key) => {
          await setKey(key);
          setStep(workspacePath ? "app" : "welcome");
        }}
        required
      />
    );
  }

  if (step === "welcome") {
    return (
      <WelcomeScreen
        onGetStarted={() => setStep("workspace")}
      />
    );
  }

  if (step === "workspace") {
    return (
      <WorkspaceSelector
        onSelect={async () => {
          const path = await selectWorkspace();
          if (path) setStep("wizard");
        }}
      />
    );
  }

  if (step === "wizard") {
    return (
      <ContextWizard
        workspacePath={workspacePath!}
        onComplete={() => {
          localStorage.setItem("wizardComplete", "true");
          setStep("app");
        }}
      />
    );
  }

  return (
    <>
      <MainLayout
        workspacePath={workspacePath!}
        onOpenSettings={() => setShowApiKeyDialog(true)}
        onUpdateContext={() => setShowContextWizard(true)}
      />
      {showApiKeyDialog && (
        <ApiKeyDialog
          onSave={async (key) => {
            await setKey(key);
            setShowApiKeyDialog(false);
          }}
          onClose={() => setShowApiKeyDialog(false)}
        />
      )}
      {showContextWizard && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <ContextWizard
            workspacePath={workspacePath!}
            onComplete={() => setShowContextWizard(false)}
            isModal
            onCancel={() => setShowContextWizard(false)}
          />
        </div>
      )}
    </>
  );
}

import React, { useState, useEffect } from "react";
import { useConfig } from "./hooks/useConfig";
import { useWorkspace } from "./hooks/useWorkspace";
import { useTheme } from "./hooks/useTheme";
import ContextWizard from "./components/Setup/ContextWizard";
import ApiKeyDialog from "./components/Settings/ApiKeyDialog";
import MainLayout from "./components/MainLayout";
import LoadingScreen from "./components/LoadingScreen";

type SetupStep = "api-key" | "wizard" | "app";

export default function App() {
  useTheme(); // initialises dark/light class on <html> from localStorage
  const { hasKey, loading: configLoading, setKey } = useConfig();
  const { workspacePath } = useWorkspace();
  const [step, setStep] = useState<SetupStep>("api-key");
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showContextWizard, setShowContextWizard] = useState(false);
  const [minLoadingDone, setMinLoadingDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinLoadingDone(true), 1500);
    return () => clearTimeout(t);
  }, []);

  // Determine initial step after loading
  useEffect(() => {
    if (configLoading) return;
    if (!hasKey) {
      setStep("api-key");
    } else {
      const wizardDone = localStorage.getItem("wizardComplete") === "true";
      setStep(wizardDone ? "app" : "wizard");
    }
  }, [configLoading, hasKey]);

  if (configLoading || !minLoadingDone) {
    return <LoadingScreen />;
  }

  if (step === "api-key") {
    return (
      <ApiKeyDialog
        onSave={async (key) => {
          await setKey(key);
          const wizardDone = localStorage.getItem("wizardComplete") === "true";
          setStep(wizardDone ? "app" : "wizard");
        }}
        required
      />
    );
  }

  if (step === "wizard") {
    return (
      <ContextWizard
        workspacePath={workspacePath ?? ""}
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
        workspacePath={workspacePath ?? ""}
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
            workspacePath={workspacePath ?? ""}
            onComplete={() => setShowContextWizard(false)}
            isModal
            onCancel={() => setShowContextWizard(false)}
          />
        </div>
      )}
    </>
  );
}

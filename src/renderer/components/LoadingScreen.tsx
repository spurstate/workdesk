import React from "react";
import logo from "../assets/logo.png";

export default function LoadingScreen() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-slate-900">
      <img src={logo} alt="Workdesk" className="mb-2 w-48 opacity-90" />
      <p className="mb-8 text-xs font-semibold text-slate-400 tracking-widest uppercase">Workdesk</p>
      <div className="flex gap-1.5">
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
      </div>
    </div>
  );
}

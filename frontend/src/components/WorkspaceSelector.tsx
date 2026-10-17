import { useState, useRef, useEffect } from "react";
import { ChevronUpDownIcon, PlusIcon, SparklesIcon, CheckIcon } from "@heroicons/react/20/solid";
import { useBusiness } from "../context/BusinessContext";

const MODEL_ICONS: Record<string, string> = {
  pharmacy: "💊",
  grocery: "🛒",
  quick_commerce: "⚡",
  retail: "🏬",
  wholesale: "📦",
  restaurant: "🍽️",
  ecommerce: "🌐",
  service: "💼",
  startup: "🚀",
};

export default function WorkspaceSelector() {
  const { businesses, currentBusiness, switchBusiness, setShowOnboarding, seedSampleData } = useBusiness();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentBusiness && businesses.length === 0) {
    return (
      <button
        onClick={() => setShowOnboarding(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold hover:bg-brand-500/20 transition-all"
      >
        <PlusIcon className="h-4 w-4" /> Set Up Business
      </button>
    );
  }

  const icon = MODEL_ICONS[currentBusiness?.type || "retail"] || "🏬";

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light hover:bg-surface-light-hover dark:bg-surface-dark dark:hover:bg-surface-dark-hover text-xs font-semibold text-text-light dark:text-text-dark shadow-sm transition-all"
      >
        <span className="text-sm">{icon}</span>
        <div className="text-left">
          <div className="font-bold truncate max-w-[140px] leading-tight">
            {currentBusiness?.name || "Select Business"}
          </div>
          <div className="text-[10px] text-text-light-muted dark:text-text-dark-muted capitalize flex items-center gap-1 leading-none mt-0.5">
            <span>{currentBusiness?.type.replace("_", " ")}</span>
            {currentBusiness?.isSample && (
              <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-1 rounded text-[9px] font-bold">
                Sample
              </span>
            )}
          </div>
        </div>
        <ChevronUpDownIcon className="h-4 w-4 text-text-light-muted dark:text-text-dark-muted ml-1" />
      </button>

      {open && (
        <div className="absolute left-0 mt-1.5 w-64 origin-top-left rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark p-1.5 shadow-xl ring-1 ring-black/5 z-50">
          <div className="px-2 py-1.5 text-[11px] font-semibold text-text-light-muted dark:text-text-dark-muted uppercase tracking-wider">
            Switch Business Workspace
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1">
            {businesses.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  switchBusiness(b.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                  currentBusiness?.id === b.id
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 font-bold"
                    : "text-text-light dark:text-text-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{MODEL_ICONS[b.type] || "🏬"}</span>
                  <div>
                    <div className="truncate max-w-[150px]">{b.name}</div>
                    <div className="text-[10px] text-text-light-muted dark:text-text-dark-muted capitalize">
                      {b.type.replace("_", " ")} {b.isSample ? "• Sample" : ""}
                    </div>
                  </div>
                </div>
                {currentBusiness?.id === b.id && <CheckIcon className="h-4 w-4 text-brand-500" />}
              </button>
            ))}
          </div>

          <div className="mt-1.5 pt-1.5 border-t border-surface-light-border dark:border-surface-dark-border space-y-1">
            {currentBusiness && !currentBusiness.isSample && (currentBusiness.counts?.products || 0) === 0 && (
              <button
                onClick={async () => {
                  await seedSampleData(currentBusiness.id);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-medium"
              >
                <SparklesIcon className="h-4 w-4" /> Seed Sample Benchmark Data
              </button>
            )}

            <button
              onClick={() => {
                setShowOnboarding(true);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 font-semibold"
            >
              <PlusIcon className="h-4 w-4" /> Add Another Business
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

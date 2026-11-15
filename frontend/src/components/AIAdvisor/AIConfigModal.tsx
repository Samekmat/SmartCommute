import React, { useState } from "react";
import {
  X,
  Key,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
} from "lucide-react";
import { AIProvider, AIStatusResponse } from "../../types/commute";

export interface AIConfigModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly serverStatus: AIStatusResponse | null;
  readonly activeProvider: AIProvider;
  readonly onSelectProvider: (provider: AIProvider) => void;
  readonly onSaveKey: (
    provider: "gemini" | "openai" | "claude",
    apiKey: string,
    saveToEnv: boolean
  ) => Promise<void>;
  readonly sessionKey: string | null;
  readonly onSetSessionKey: (key: string | null) => void;
}

export function AIConfigModal({
  isOpen,
  onClose,
  serverStatus,
  activeProvider,
  onSelectProvider,
  onSaveKey,
  sessionKey,
  onSetSessionKey,
}: AIConfigModalProps): React.JSX.Element | null {
  const [selectedTarget, setSelectedTarget] = useState<
    "gemini" | "openai" | "claude"
  >("gemini");
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [showKey, setShowKey] = useState<boolean>(false);
  const [saveToEnv, setSaveToEnv] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isGeminiConfigured = Boolean(serverStatus?.gemini_configured);
  const isOpenAIConfigured = Boolean(serverStatus?.openai_configured);
  const isClaudeConfigured = Boolean(serverStatus?.claude_configured);

  async function handleSaveKey(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    try {
      setIsSaving(true);
      setFeedbackMessage(null);
      await onSaveKey(selectedTarget, apiKeyInput.trim(), saveToEnv);
      onSetSessionKey(apiKeyInput.trim());
      setFeedbackMessage(
        `Klucz dla ${selectedTarget.toUpperCase()} został pomyślnie zapisany!`
      );
      setApiKeyInput("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Błąd podczas zapisywania klucza.";
      setFeedbackMessage(`Błąd: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Konfiguracja Modeli AI i Kluczy API
              </h3>
              <p className="text-xs text-slate-500">
                Wybierz model AI lub dodaj darmowy klucz w kilka sekund
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Active Provider Preference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Domyślny Dostawca AI
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSelectProvider("auto")}
                className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all ${
                  activeProvider === "auto"
                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-500"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="font-semibold block flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                  Auto (Zalecany)
                </span>
                <span className="text-[11px] text-slate-500">
                  Gemini &rarr; OpenAI &rarr; Fallback
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectProvider("gemini")}
                className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all ${
                  activeProvider === "gemini"
                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-500"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Google Gemini</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-medium">
                    Darmowy
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {isGeminiConfigured ? "✓ Klucz w systemie" : "Wymaga klucza"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectProvider("openai")}
                className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all ${
                  activeProvider === "openai"
                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-500"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="font-semibold block">OpenAI (GPT-4o)</span>
                <span className="text-[11px] text-slate-500">
                  {isOpenAIConfigured ? "✓ Klucz w systemie" : "Wymaga klucza"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectProvider("claude")}
                className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all ${
                  activeProvider === "claude"
                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-500"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="font-semibold block">Anthropic Claude</span>
                <span className="text-[11px] text-slate-500">
                  {isClaudeConfigured ? "✓ Klucz w systemie" : "Wymaga klucza"}
                </span>
              </button>
            </div>
          </div>

          {/* Quick links to get keys */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <span className="font-semibold text-slate-700 block">
              Gdzie pobrać klucz jednym kliknięciem?
            </span>
            <div className="space-y-1.5">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between text-indigo-600 hover:text-indigo-800 font-medium group"
              >
                <span>
                  ⭐ Google AI Studio (Darmowy tier, bez podawania karty)
                </span>
                <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
              </a>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between text-slate-600 hover:text-slate-900 group"
              >
                <span>OpenAI Developer Console</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
              </a>
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between text-slate-600 hover:text-slate-900 group"
              >
                <span>Anthropic Console (Claude)</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
              </a>
            </div>
          </div>

          {/* Add / Update Key Form */}
          <form onSubmit={handleSaveKey} className="space-y-3.5">
            <div>
              <label
                htmlFor="provider-target-select"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Wybierz model do skonfigurowania:
              </label>
              <select
                id="provider-target-select"
                value={selectedTarget}
                onChange={(e) => {
                  const val = e.target.value;
                  if (
                    val === "gemini" ||
                    val === "openai" ||
                    val === "claude"
                  ) {
                    setSelectedTarget(val);
                  }
                }}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="gemini">Google Gemini (GEMINI_API_KEY)</option>
                <option value="openai">OpenAI (OPENAI_API_KEY)</option>
                <option value="claude">
                  Anthropic Claude (ANTHROPIC_API_KEY)
                </option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="api-key-input"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Klucz API:
                </label>
                {sessionKey && (
                  <button
                    type="button"
                    onClick={() => onSetSessionKey(null)}
                    className="text-[11px] text-rose-600 hover:underline"
                  >
                    Wyczyść klucz z pamięci sesji
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="api-key-input"
                  type={showKey ? "text" : "password"}
                  placeholder={
                    selectedTarget === "gemini"
                      ? "AIzaSy..."
                      : selectedTarget === "claude"
                        ? "sk-ant-..."
                        : "sk-proj-..."
                  }
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full px-3 py-2 pr-10 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="save-to-env-checkbox"
                type="checkbox"
                checked={saveToEnv}
                onChange={(e) => setSaveToEnv(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor="save-to-env-checkbox"
                className="text-xs text-slate-700 select-none cursor-pointer"
              >
                Zapisz trwale w lokalnym pliku{" "}
                <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">
                  .env
                </code>
              </label>
            </div>

            {/* Security note */}
            <div className="flex items-start gap-2 p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-lg text-[11px] text-amber-800">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Bezpieczeństwo:</strong> Zapis do pliku{" "}
                <code className="text-amber-900 font-semibold">.env</code> jest
                w pełni bezpieczny lokalnie (jest ignorowany przez git). Nigdy
                nie wprowadzaj produkcyjnych kluczy na niezabezpieczonym
                serwerze publicznym.
              </span>
            </div>

            {feedbackMessage && (
              <div
                className={`p-2.5 text-xs rounded-lg flex items-center gap-2 ${
                  feedbackMessage.startsWith("Błąd")
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                }`}
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>{feedbackMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving || !apiKeyInput.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Zapisywanie...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Zapisz Klucz API</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}

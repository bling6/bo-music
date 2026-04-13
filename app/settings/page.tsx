"use client";

import { ApiKeyInput } from "@/components/settings/api-key-input";
import { useI18n } from "@/lib/i18n";

export default function SettingsPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-black pt-24 pb-32 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
            {t("settings.title")}
          </h1>
        </div>

        <ApiKeyInput />
      </div>
    </div>
  );
}

'use client';

import { ApiKeyInput } from '@/components/settings/api-key-input';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-black pt-24 pb-32 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <div className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-600 mb-6">
            Settings
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
            配置
          </h1>
        </div>

        <ApiKeyInput />
      </div>
    </div>
  );
}

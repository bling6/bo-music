'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Key, Check, Eye, EyeOff } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';
import { useI18n } from '@/lib/i18n';

export function ApiKeyInput() {
  const { apiKey, setApiKey } = useSettingsStore();
  const { t } = useI18n();
  const [inputValue, setInputValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('minimax_api_key');
    if (stored) {
      setApiKey(stored);
      setInputValue(stored);
    }
  }, [setApiKey]);

  const handleSave = () => {
    const key = inputValue.trim();
    if (key) {
      localStorage.setItem('minimax_api_key', key);
      setApiKey(key);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleClear = () => {
    localStorage.removeItem('minimax_api_key');
    setApiKey('');
    setInputValue('');
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-10">
      <div className="flex items-center gap-3 mb-2">
        <Key className="w-5 h-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">{t('settings.apiKeyTitle')}</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        {t('settings.apiKeyDesc')}
      </p>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Input
            type={showKey ? 'text' : 'password'}
            placeholder={t('settings.apiKeyPlaceholder')}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="bg-black border-border rounded-xl pr-10"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Button
          onClick={handleSave}
          className="rounded-xl bg-white text-black hover:bg-zinc-300 px-6"
        >
          {saved ? <Check className="w-4 h-4 mr-1" /> : null}
          {saved ? t('common.saved') : t('common.save')}
        </Button>
        {apiKey && (
          <Button
            onClick={handleClear}
            variant="outline"
            className="rounded-xl border-border text-muted-foreground hover:text-white"
          >
            {t('common.clear')}
          </Button>
        )}
      </div>
    </div>
  );
}

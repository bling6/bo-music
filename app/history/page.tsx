'use client';

import { HistoryList } from '@/components/history/history-list';
import { useI18n } from '@/lib/i18n';

export default function HistoryPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-black pt-24 pb-32 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
            {t('history.title')}
          </h1>
        </div>

        <HistoryList />
      </div>
    </div>
  );
}

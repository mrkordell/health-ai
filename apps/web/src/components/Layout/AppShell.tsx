import type { ReactNode } from 'react';
import { UserButton } from '@clerk/clerk-react';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  children: ReactNode;
  header?: ReactNode;
}

export function AppShell({ children, header }: AppShellProps) {
  return (
    <div className="flex flex-col h-dvh bg-neutral-50">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-200 safe-area-top">
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold text-brand-600">Vita</span>
        </div>
        <UserButton afterSignOutUrl="/" />
      </header>

      {/* Optional sub-header (for daily summary, etc.) */}
      {header && (
        <div className="flex-shrink-0 border-b border-neutral-200">
          {header}
        </div>
      )}

      {/* Main content area - flex-1 to fill remaining space */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

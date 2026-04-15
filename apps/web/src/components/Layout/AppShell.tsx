import type { ReactNode } from 'react';
import { UserButton } from '@clerk/clerk-react';
import { BottomNav } from './BottomNav';
import { Wordmark } from '../Brand/Wordmark';

interface AppShellProps {
  children: ReactNode;
  header?: ReactNode;
}

export function AppShell({ children, header }: AppShellProps) {
  return (
    <div
      className="flex h-dvh flex-col"
      style={{ background: 'var(--color-paper)' }}
    >
      {/* Top bar — quiet, hairline, paper background with subtle blur */}
      <header
        className="safe-area-top flex-shrink-0 border-b border-[color:var(--color-line)]"
        style={{ background: 'rgba(251,247,242,0.86)', backdropFilter: 'saturate(140%) blur(14px)' }}
      >
        <div className="flex items-center justify-between px-5 py-3.5">
          <Wordmark size="sm" />
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'h-8 w-8 ring-1 ring-[color:var(--color-line-strong)]',
              },
            }}
          />
        </div>
      </header>

      {/* Optional sub-header */}
      {header && (
        <div className="flex-shrink-0 border-b border-[color:var(--color-line)]">
          {header}
        </div>
      )}

      {/* Main content */}
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}

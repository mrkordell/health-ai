import { NavLink } from 'react-router-dom';

/**
 * Vita bottom nav — quiet, considered. No chunky background pill.
 * Active state is signaled by an apricot punctum dot above the label
 * (echoing the wordmark) and a shift in label/icon color.
 */
type Item = {
  to: string;
  label: string;
  icon: (active: boolean) => JSX.Element;
};

const stroke = (active: boolean) => (active ? 1.75 : 1.5);

const navItems: Item[] = [
  {
    to: '/',
    label: 'Talk',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 12c0-4 4-8 8-8s8 4 8 8-4 8-8 8c-2 0-3-1-4-1H5l1-3c-1-1-2-2-2-4z"
          stroke="currentColor"
          strokeWidth={stroke(active)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: '/meals',
    label: 'Meals',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth={stroke(active)} />
        <path
          d="M12 6.5v5l3.2 1.8"
          stroke="currentColor"
          strokeWidth={stroke(active)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: '/weight',
    label: 'Trend',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 17 L9 11 L13 14 L20 6"
          stroke="currentColor"
          strokeWidth={stroke(active)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {active && <circle cx="20" cy="6" r="2" fill="#F47A4A" />}
      </svg>
    ),
  },
];

export function BottomNav() {
  return (
    <nav
      className="safe-area-bottom flex-shrink-0 border-t border-[color:var(--color-line)]"
      style={{ background: 'rgba(251,247,242,0.92)', backdropFilter: 'saturate(140%) blur(14px)' }}
      aria-label="Primary"
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              [
                'group relative flex flex-1 flex-col items-center justify-center gap-1 px-3 transition-colors',
                isActive
                  ? 'text-plum-900'
                  : 'text-[color:var(--color-muted)] hover:text-plum-800',
              ].join(' ')
            }
            style={{ transitionDuration: 'var(--duration-soft)', transitionTimingFunction: 'var(--ease-soft)' }}
          >
            {({ isActive }) => (
              <>
                {/* Apricot punctum — appears above the icon when active */}
                <span
                  aria-hidden
                  className="absolute top-1.5 h-1 w-1 rounded-full transition-opacity"
                  style={{
                    background: 'var(--color-apricot-500)',
                    opacity: isActive ? 1 : 0,
                    boxShadow: isActive ? '0 0 0 2px var(--color-apricot-200)' : 'none',
                  }}
                />
                {item.icon(isActive)}
                <span
                  className="text-[11px] font-medium tracking-wide"
                  style={{
                    fontVariationSettings: 'normal',
                  }}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

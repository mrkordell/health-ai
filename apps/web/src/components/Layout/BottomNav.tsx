import { NavLink } from 'react-router-dom';

const navItems = [
  {
    to: '/',
    label: 'Chat',
    icon: (active: boolean) => (
      <svg
        className="w-6 h-6"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.5}
        viewBox="0 0 24 24"
      >
        {active ? ( 
          <>
            <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
            <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
          </>
        ) : (
          <>  
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
          </>
        )}  
      </svg>
    ),
  },
  {
    to: '/meals',
    label: 'Meals',
    icon: (active: boolean) => (
      <svg
        className="w-6 h-6"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.5}
        viewBox="0 0 24 24"
      >
        {active ? (
          <path
            fillRule="evenodd"
            d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM8.547 4.505a8.25 8.25 0 1011.672 11.672l-4.073-4.073a4.5 4.5 0 00-6.268-6.268L8.547 4.505zm2.98 2.98a3 3 0 114.243 4.243l-1.061-1.061a1.5 1.5 0 00-2.121-2.121l-1.061-1.061zm-2.121 2.121a1.5 1.5 0 012.121 0l4.243 4.243a1.5 1.5 0 010 2.121l-1.061 1.061a3 3 0 01-4.243-4.243l-1.061-1.061a1.5 1.5 0 010-2.121z"
            clipRule="evenodd"
          />
        ) : (
          <>
            <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 9.75L9 15.75M9.75 9.75h.008v.008H9.75V9.75zm4.5 6h.008v.008h-.008v-6.008z"
            />
          </>
        )}
      </svg>
    ),
  },
  {
    to: '/weight',
    label: 'Weight',
    icon: (active: boolean) => (
      <svg
        className="w-6 h-6"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.5}
        viewBox="0 0 24 24"
      >
        {active ? (
          <path
            fillRule="evenodd"
            d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z"
            clipRule="evenodd"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
          />
        )}
      </svg>
    ),
  },
];

export function BottomNav() {
  return (
    <nav className="flex-shrink-0 bg-white border-t border-neutral-200 safe-area-bottom">
      <div className="flex justify-evenly items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 min-w-[64px] py-2 transition-colors duration-150 ${
                isActive ? 'text-brand-600' : 'text-neutral-400 hover:text-neutral-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-150 ${
                    isActive ? 'bg-brand-100' : ''
                  }`}
                >
                  {item.icon(isActive)}
                </span>
                <span className="text-[11px] font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

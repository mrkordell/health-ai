import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
} from '@clerk/clerk-react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/Layout/AppShell';
import { ChatContainer } from './components/Chat';
import { MealsScreen } from './components/Meals';
import { WeightScreen } from './components/Weight';
import { Wordmark } from './components/Brand/Wordmark';

function AuthenticatedContent() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<ChatContainer />} />
          <Route path="/meals" element={<MealsScreen />} />
          <Route path="/weight" element={<WeightScreen />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

function Landing() {
  return (
    <div
      className="min-h-dvh w-full overflow-x-hidden text-ink"
      style={{
        background:
          'radial-gradient(60% 80% at 85% 0%, rgba(244,122,74,0.18), transparent 60%),' +
          'radial-gradient(60% 80% at 0% 100%, rgba(138,95,163,0.18), transparent 60%),' +
          'var(--color-paper)',
      }}
    >
      {/* Top bar */}
      <header
        className="sticky top-0 z-40 border-b border-[color:var(--color-line)]"
        style={{
          backdropFilter: 'saturate(140%) blur(14px)',
          background: 'rgba(251,247,242,0.82)',
        }}
      >
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-4 sm:px-8">
          <Wordmark size="sm" />
          <div className="hidden gap-6 text-[13px] tracking-wide text-[color:var(--color-muted)] sm:flex">
            <span>Conversational</span>
            <span>Evidence-based</span>
            <span>Quietly brilliant</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-[1180px] px-5 pb-20 pt-16 sm:px-8 sm:pt-28">
        <p className="eyebrow mb-7">A conversational health companion · 2026</p>

        <h1
          className="font-serif text-plum-900"
          style={{
            fontVariationSettings: '"opsz" 144, "SOFT" 50',
            fontWeight: 340,
            fontSize: 'clamp(56px, 11vw, 132px)',
            lineHeight: 0.95,
            letterSpacing: '-0.025em',
            margin: 0,
          }}
        >
          Health, the way<br />
          you'd talk to a{' '}
          <span
            className="text-apricot-600 vita-ita"
            style={{ fontWeight: 300 }}
          >
            friend
          </span>
          .
        </h1>

        <p
          className="mt-7 max-w-[620px] font-serif text-[color:var(--color-muted)]"
          style={{
            fontWeight: 380,
            fontSize: 'clamp(18px, 1.6vw, 22px)',
            lineHeight: 1.5,
          }}
        >
          Vita is the warm, evidence-based companion you can text at 11pm without
          judgment. Log a meal, talk through a hard day, ask why your sleep was
          off — without the homework, the guilt, or the kale-leaf logo.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <SignUpButton mode="modal">
            <button
              className="inline-flex items-center gap-2 rounded-full bg-apricot-500 px-7 py-3.5 text-[15px] font-medium text-plum-950 transition-all hover:bg-apricot-400"
              style={{ transitionTimingFunction: 'var(--ease-soft)', transitionDuration: 'var(--duration-soft)' }}
            >
              Begin with Vita
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </SignUpButton>
          <SignInButton mode="modal">
            <button
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-line-strong)] bg-transparent px-7 py-3.5 text-[15px] font-medium text-plum-900 transition-colors hover:bg-plum-50"
            >
              I already have an account
            </button>
          </SignInButton>
        </div>

        {/* Quote card */}
        <div className="mt-20 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <figure
            className="rounded-[28px] border border-[color:var(--color-line)] bg-white/70 p-8 backdrop-blur sm:p-10"
            style={{ boxShadow: 'var(--shadow-soft)' }}
          >
            <p className="eyebrow mb-5">Voice in the wild</p>
            <p className="mb-3 font-serif italic text-[15px] text-[color:var(--color-muted)]">
              You: "I binged last night. I feel awful."
            </p>
            <blockquote
              className="font-serif text-plum-900"
              style={{
                fontWeight: 360,
                fontSize: 'clamp(22px, 2.4vw, 30px)',
                lineHeight: 1.3,
                letterSpacing: '-0.015em',
                fontVariationSettings: '"opsz" 144, "SOFT" 60',
              }}
            >
              "Hey, thank you for telling me. One night doesn't undo your week —
              and the fact that you're checking in says a lot.{' '}
              <span className="text-apricot-600 italic">
                Want to talk about what was going on, or just plan something
                gentle for today?
              </span>
              "
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-2 text-[12px] tracking-wider text-[color:var(--color-muted)]">
              <Wordmark size="xs" />
              <span>· how she actually sounds</span>
            </figcaption>
          </figure>

          {/* Trait list */}
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[28px] border border-[color:var(--color-line)] bg-[color:var(--color-line)]">
            {[
              { n: '01', label: 'Warm', body: 'Human first. Never robotic, never clinical.' },
              { n: '02', label: 'Grounded', body: 'Evidence over hype. We cite, we caveat.' },
              { n: '03', label: 'Quietly witty', body: 'A dry, kind humor. Never the joke.' },
              { n: '04', label: 'On your side', body: 'You are the protagonist, always.' },
            ].map((t) => (
              <div key={t.n} className="bg-paper p-5 sm:p-7" style={{ background: 'var(--color-paper)' }}>
                <div className="eyebrow mb-3" style={{ color: 'var(--color-apricot-600)' }}>{t.n}</div>
                <h3 className="font-serif text-[20px] font-medium text-plum-900" style={{ letterSpacing: '-0.01em' }}>
                  {t.label}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--color-muted)]">
                  {t.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer line */}
        <div className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--color-line)] pt-6 text-[12px] tracking-wider text-[color:var(--color-muted)]">
          <span className="eyebrow">© Vita Studio · Spring 2026</span>
          <span className="font-serif italic">Health, the way you'd talk to a friend.</span>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  return (
    <>
      <SignedIn>
        <AuthenticatedContent />
      </SignedIn>
      <SignedOut>
        <Landing />
      </SignedOut>
    </>
  );
}

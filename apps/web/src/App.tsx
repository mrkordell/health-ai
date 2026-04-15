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

function UnauthenticatedContent() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold text-brand-600">Vita</h1>
      <p className="text-lg text-neutral-600">
        Your AI-powered health, fitness and nutrition coach
      </p>
      <div className="flex gap-4">
        <SignInButton mode="modal">
          <button className="px-6 py-2 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors">
            Sign In
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="px-6 py-2 rounded-lg border border-brand-600 text-brand-600 font-medium hover:bg-brand-50 transition-colors">
            Sign Up
          </button>
        </SignUpButton>
      </div>
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
        <UnauthenticatedContent />
      </SignedOut>
    </>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// Drop-in "Continue with Google" button. Renders the official rounded
// Google button once configured; falls back to a friendly explainer toast
// when VITE_GOOGLE_CLIENT_ID has not been set yet, so the UI never looks
// broken in environments where OAuth is not wired up.
export default function GoogleSignInButton({ label = 'Continue with Google', redirectTo = '/' }) {
  const { loginWithGoogle } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await loginWithGoogle(redirectTo);
        } catch (err) {
          setBusy(false);
          toast.error(err.message || 'Google sign-in failed');
        }
      }}
      className="btn-outline flex w-full items-center justify-center gap-2.5 py-3 text-sm"
    >
      <GoogleGlyph />
      {busy ? 'Connecting…' : label}
    </button>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.08.72-2.46 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.94H1.28v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.3a7.2 7.2 0 0 1 0-4.6v-3.1H1.28a12 12 0 0 0 0 10.8l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.6l4 3.1C6.23 6.86 8.88 4.75 12 4.75Z"
      />
    </svg>
  );
}

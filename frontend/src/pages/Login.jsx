import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import GoogleSignInButton from '../components/common/GoogleSignInButton';
import AuthLayout from '../components/auth/AuthLayout';
import { IconField, PasswordField, MailIcon, LockIcon } from '../components/auth/AuthInputs';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const redirectTo = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(identifier, password);
      toast.success('Welcome back!');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Could not sign in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Your medicine cabinet, always in sync."
      subtitle="Sign in to track live orders, re-order in one tap, and manage your saved prescriptions."
      panelPoints={[
        'Real-time order tracking, from pharmacy to doorstep',
        'Prescriptions reviewed by our pharmacist team',
        'Faster checkout with saved addresses',
      ]}
    >
      <div className="mb-7">
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Sign in</h1>
        <p className="mt-1.5 text-sm text-slate-500">Access your orders, prescriptions, and bag.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <IconField
          id="identifier"
          label="Email or phone"
          icon={<MailIcon />}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="you@example.com or 01712345678"
          autoComplete="username"
          required
        />
        <PasswordField
          id="password"
          label="Password"
          icon={<LockIcon />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && (
          <p className="field-error rounded-lg bg-red-50 px-3 py-2 text-red-600" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full py-3" disabled={submitting}>
          {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-100" />
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">or</span>
        <span className="h-px flex-1 bg-slate-100" />
      </div>

      <GoogleSignInButton redirectTo={redirectTo} />

      <div className="mt-5 flex justify-between text-sm">
        <Link to="/otp-login" className="font-medium text-brand-700 hover:underline">
          Sign in with OTP
        </Link>
        <Link to="/forgot-password" className="text-slate-500 hover:underline">
          Forgot password?
        </Link>
      </div>
      <p className="mt-7 text-center text-sm text-slate-500">
        New here?{' '}
        <Link to="/register" className="font-semibold text-brand-700 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}

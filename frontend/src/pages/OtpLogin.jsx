import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AuthLayout from '../components/auth/AuthLayout';
import { IconField, PhoneIcon, HashIcon, UserIcon } from '../components/auth/AuthInputs';
import { isValidPhone } from '../lib/format';

export default function OtpLogin() {
  const { requestOtp, verifyOtp } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [devCode, setDevCode] = useState(null);

  const handleRequest = async (e) => {
    e.preventDefault();
    setError(null);
    if (!isValidPhone(phone)) {
      setError('Enter a valid phone number (10-15 digits).');
      return;
    }
    setSubmitting(true);
    try {
      const result = await requestOtp({ phone, purpose: 'LOGIN' });
      // Only ever set when the backend's SMS_PROVIDER is "mock" (dev-only) —
      // see requestOtp in backend/src/modules/auth/auth.service.js. Without
      // this, the mock provider only logs the code server-side and the OTP
      // flow can't be tested end-to-end from the UI at all.
      setDevCode(result?.devCode || null);
      toast.success('OTP sent to your phone');
      setStep('code');
    } catch (err) {
      setError(err.message || 'Could not send OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await verifyOtp({ phone, code, purpose: 'LOGIN', name: name || undefined });
      if (result.user) {
        toast.success('Signed in!');
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid code');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Passwordless"
      title="Sign in with just your phone."
      subtitle="No password to remember — we'll text you a one-time code that gets you straight in."
      panelPoints={['Code expires after a few minutes', 'New number? We’ll create your account automatically']}
    >
      <div className="mb-7">
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Sign in with OTP</h1>
        <p className="mt-1.5 text-sm text-slate-500">We&rsquo;ll text you a one-time code.</p>
      </div>

      {step === 'phone' ? (
        <form onSubmit={handleRequest} className="space-y-4" noValidate>
          <IconField
            id="phone"
            label="Phone number"
            icon={<PhoneIcon />}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01712345678"
            autoComplete="tel"
            required
          />
          {error && (
            <p className="field-error rounded-lg bg-red-50 px-3 py-2 text-red-600" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary w-full py-3" disabled={submitting}>
            {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {submitting ? 'Sending…' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4" noValidate>
          {devCode && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              Dev mode (SMS not actually sent): your code is <span className="font-mono font-bold">{devCode}</span>
            </p>
          )}
          <IconField
            id="code"
            label="6-digit code"
            icon={<HashIcon />}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            required
          />
          <IconField
            id="name"
            label="Name (only needed for a new account)"
            icon={<UserIcon />}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {error && (
            <p className="field-error rounded-lg bg-red-50 px-3 py-2 text-red-600" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary w-full py-3" disabled={submitting}>
            {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {submitting ? 'Verifying…' : 'Verify & sign in'}
          </button>
          <button type="button" className="btn-ghost w-full" onClick={() => setStep('phone')}>
            Change phone number
          </button>
        </form>
      )}

      <p className="mt-7 text-center text-sm text-slate-500">
        Prefer a password?{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:underline">
          Sign in normally
        </Link>
      </p>
    </AuthLayout>
  );
}

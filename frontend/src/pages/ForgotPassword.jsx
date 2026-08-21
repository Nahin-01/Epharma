import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AuthLayout from '../components/auth/AuthLayout';
import { IconField, PasswordField, PhoneIcon, HashIcon, LockIcon } from '../components/auth/AuthInputs';

export default function ForgotPassword() {
  const { forgotPassword, resetPassword } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [devCode, setDevCode] = useState(null);

  const handleRequest = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await forgotPassword({ phone });
      setDevCode(result?.devCode || null);
      toast.success('A reset code has been sent to your phone');
      setStep('reset');
    } catch (err) {
      setError(err.message || 'Could not send reset code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await resetPassword({ phone, code, newPassword });
      toast.success('Password reset — please sign in');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Let's get you back in."
      subtitle="We'll text a one-time code to your phone so you can set a new password securely."
      panelPoints={['Code expires after a few minutes, for your security', 'Your account stays yours — no email required']}
    >
      <div className="mb-7">
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Reset your password</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          {step === 'phone' ? "We'll text you a reset code." : 'Enter the code and choose a new password.'}
        </p>
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
            {submitting ? 'Sending…' : 'Send reset code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="space-y-4" noValidate>
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
          <PasswordField
            id="newPassword"
            label="New password"
            icon={<LockIcon />}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          {error && (
            <p className="field-error rounded-lg bg-red-50 px-3 py-2 text-red-600" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary w-full py-3" disabled={submitting}>
            {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {submitting ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      )}

      <p className="mt-7 text-center text-sm text-slate-500">
        Remembered it?{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

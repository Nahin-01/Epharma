import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import GoogleSignInButton from '../components/common/GoogleSignInButton';
import AuthLayout from '../components/auth/AuthLayout';
import { IconField, PasswordField, MailIcon, LockIcon, UserIcon, PhoneIcon } from '../components/auth/AuthInputs';
import { isValidPhone } from '../lib/format';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const passwordStrength = getPasswordStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.email && !form.phone) {
      setError('Please provide either an email or a phone number.');
      return;
    }
    if (form.email && !EMAIL_PATTERN.test(form.email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (form.phone && !isValidPhone(form.phone)) {
      setError('Enter a valid phone number (10-15 digits).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { name: form.name, password: form.password };
      if (form.email) payload.email = form.email;
      if (form.phone) payload.phone = form.phone;
      await register(payload);
      toast.success('Account created!');
      navigate('/', { replace: true });
    } catch (err) {
      // Not a failure — Supabase requires the user to confirm their email
      // before a session is issued (see AuthContext.register). Route them to
      // sign in with a success toast instead of showing this as an error.
      if (err.message?.startsWith('Account created.')) {
        toast.success(err.message);
        navigate('/login', { replace: true });
        return;
      }
      setError(err.message || 'Could not create your account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Join ePharmacy"
      title="Genuine medicine, delivered to your door."
      subtitle="Create your account to order medicine, upload prescriptions, and track every delivery live."
      panelPoints={[
        '100% genuine, sourced medicine',
        'Secure prescription uploads, reviewed by pharmacists',
        'One account across web and the mobile app',
      ]}
    >
      <div className="mb-7">
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Create an account</h1>
        <p className="mt-1.5 text-sm text-slate-500">Order medicine and track prescriptions easily.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <IconField
          id="name"
          label="Full name"
          icon={<UserIcon />}
          value={form.name}
          onChange={update('name')}
          autoComplete="name"
          required
          minLength={2}
        />
        <IconField
          id="email"
          label="Email"
          type="email"
          icon={<MailIcon />}
          value={form.email}
          onChange={update('email')}
          autoComplete="email"
        />
        <IconField
          id="phone"
          label="Phone"
          icon={<PhoneIcon />}
          value={form.phone}
          onChange={update('phone')}
          placeholder="01712345678"
          autoComplete="tel"
        />
        <div>
          <PasswordField
            id="password"
            label="Password"
            icon={<LockIcon />}
            value={form.password}
            onChange={update('password')}
            autoComplete="new-password"
            minLength={8}
            required
          />
          {form.password && (
            <div className="mt-2">
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                      i < passwordStrength.score ? passwordStrength.barColor : 'bg-slate-100'
                    }`}
                  />
                ))}
              </div>
              <p className={`mt-1 text-xs font-medium ${passwordStrength.textColor}`}>{passwordStrength.label}</p>
            </div>
          )}
        </div>

        {error && (
          <p className="field-error rounded-lg bg-red-50 px-3 py-2 text-red-600" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full py-3" disabled={submitting}>
          {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-100" />
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">or</span>
        <span className="h-px flex-1 bg-slate-100" />
      </div>

      <GoogleSignInButton label="Sign up with Google" />

      <p className="mt-7 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

// Purely client-side visual feedback on the password the user just typed —
// not a fabricated stat, just real-time analysis of their own input.
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', barColor: '', textColor: '' };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;

  const levels = [
    { label: 'Too short — use at least 8 characters', barColor: 'bg-red-400', textColor: 'text-red-500' },
    { label: 'Weak password', barColor: 'bg-red-400', textColor: 'text-red-500' },
    { label: 'Okay password', barColor: 'bg-accent-400', textColor: 'text-accent-600' },
    { label: 'Good password', barColor: 'bg-brand-400', textColor: 'text-brand-600' },
    { label: 'Strong password', barColor: 'bg-brand-500', textColor: 'text-brand-700' },
  ];
  return { score, ...levels[score] };
}

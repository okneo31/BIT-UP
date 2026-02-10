'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { signUp, loading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const result = await signUp(email, password);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-green text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-text-primary">Account Created!</h1>
          <p className="text-sm text-text-secondary mt-2 mb-2">Please check your email to verify your account.</p>
          <div className="bg-bg-secondary rounded-lg p-4 mt-4 text-left">
            <p className="text-xs text-text-secondary mb-2">Welcome Bonus Received:</p>
            <div className="space-y-1">
              <p className="text-sm text-green">+ 10,000 BTU</p>
              <p className="text-sm text-green">+ 100,000 USDT</p>
              <p className="text-sm text-green">+ 0.5 BTC</p>
              <p className="text-sm text-green">+ 5 ETH</p>
            </div>
          </div>
          <Link href="/login">
            <Button variant="primary" fullWidth className="mt-6">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-accent text-3xl font-bold">▲</span>
          <h1 className="text-2xl font-bold text-text-primary mt-2">Create Account</h1>
          <p className="text-sm text-text-secondary mt-1">Get 10,000 BTU + 100,000 USDT welcome bonus!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red">{error}</p>}
          <Button type="submit" variant="primary" fullWidth loading={loading}>
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}

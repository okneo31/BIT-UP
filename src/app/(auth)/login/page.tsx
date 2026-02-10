'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn, loading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/trade/BTC-USDT';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
    } else {
      router.push(redirect);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <span className="text-accent text-3xl font-bold">▲</span>
        <h1 className="text-2xl font-bold text-text-primary mt-2">BitUp Login</h1>
        <p className="text-sm text-text-secondary mt-1">Welcome back to BitUp Exchange</p>
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
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red">{error}</p>}
        <Button type="submit" variant="primary" fullWidth loading={loading}>
          Login
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-accent hover:underline">Sign Up</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <Suspense fallback={<div className="text-text-secondary">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

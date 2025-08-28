import { useState, useEffect, FormEvent } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Button } from '../Button';
import { Input } from '../Input';
import { Mail, KeySquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LocationState {
  email?: string;
}

export function ForgotPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Get email from location state
    const state = location.state as LocationState;
    if (state && state.email) {
      setEmail(state.email);
    }
  }, [location.state]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setLoading(true);

    // Call Supabase to send password reset email
    supabase.auth
      .resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })
      .then(({ error }) => {
        setLoading(false);
        if (error) {
          setError(error.message);
        } else {
          // Show success state
          setSuccess(true);
        }
      })
      .catch((err: Error) => {
        setLoading(false);
        setError(err.message);
      });
  };

  if (success) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-indigo-900 p-4'>
        <div className='w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden transform transition-all hover:scale-[1.01] duration-300'>
          <div className='p-8 text-center'>
            <div className='w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg mb-6'>
              <Mail className='h-10 w-10 text-white' />
            </div>
            <h2 className='text-3xl font-bold text-white mb-4'>Check Your Email</h2>
            <p className='text-white/80 mb-6'>
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className='text-white/60 text-sm mb-6'>
              Click the link in the email to reset your password. The link will expire shortly.
            </p>
            <Button
              variant='gradient'
              text='Back to Sign In'
              fullWidth={true}
              onClick={() => navigate('/signin')}
              className='mt-6 shadow-lg hover:shadow-green-500/20'
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-indigo-900 p-4'>
      <div className='w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden transform transition-all hover:scale-[1.01] duration-300'>
        <div className='p-8 text-center'>
          <div className='w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg mb-6'>
            <KeySquare className='h-10 w-10 text-white' />
          </div>
          <h2 className='text-3xl font-bold text-white mb-6'>Reset Password</h2>
          <p className='text-white/80 mb-6'>
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {error && (
            <div className='bg-red-500/20 text-red-100 px-4 py-3 rounded-lg mb-6 text-sm border border-red-500/30'>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-5'>
            <Input
              label='Email Address'
              type='email'
              value={email}
              name='email'
              onChange={e => setEmail(e.target.value)}
              placeholder='Enter your email address'
              className='bg-white/5 border-white/10 text-white'
            />

            <Button
              variant='gradient'
              text='Send Reset Link'
              fullWidth={true}
              loading={loading}
              className='mt-6 shadow-lg hover:shadow-indigo-500/20'
            />

            <p className='text-white/60 text-sm text-center pt-4'>
              Remember your password?{' '}
              <Link to='/signin' className='text-indigo-300 hover:text-white font-medium'>
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

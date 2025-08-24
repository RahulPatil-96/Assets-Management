import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../Button';
import { Input } from '../Input';
import { Eye, EyeOff, KeySquare, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function UpdatePassword(): JSX.Element {
  const navigate = useNavigate();
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!password) {
      setError('Password is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);

    // Call Supabase to update the password
    supabase.auth.updateUser({ password })
      .then(({ error }) => {
        setLoading(false);
        if (error) {
          setError(error.message);
        } else {
          // Show success state
          setSuccess(true);
          setTimeout(() => {
            navigate('/signin');
          }, 2000);
        }
      })
      .catch((err: Error) => {
        setLoading(false);
        setError(err.message);
      });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-indigo-900 p-4">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden transform transition-all hover:scale-[1.01] duration-300">
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg mb-6">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Password Updated!</h2>
            <p className="text-white/80 mb-6">
              Your password has been successfully updated.
            </p>
            <p className="text-white/60 text-sm mb-6">
              Redirecting you to the sign in page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-indigo-900 p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden transform transition-all hover:scale-[1.01] duration-300">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg mb-6">
            <KeySquare className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-6">Set New Password</h2>
          <p className="text-white/80 mb-6">
            Please enter your new password below.
          </p>

          {error && (
            <div className="bg-red-500/20 text-red-100 px-4 py-3 rounded-lg mb-6 text-sm border border-red-500/30">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              name="password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password (min. 6 characters)"
              icon={
                showPassword ? (
                  <EyeOff className="text-white/60 cursor-pointer" onClick={() => setShowPassword(false)} />
                ) : (
                  <Eye className="text-white/60 cursor-pointer" onClick={() => setShowPassword(true)} />
                )
              }
              className="bg-white/5 border-white/10 text-white"
            />

            <Input
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              name="confirmPassword"
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              icon={
                showConfirmPassword ? (
                  <EyeOff className="text-white/60 cursor-pointer" onClick={() => setShowConfirmPassword(false)} />
                ) : (
                  <Eye className="text-white/60 cursor-pointer" onClick={() => setShowConfirmPassword(true)} />
                )
              }
              className="bg-white/5 border-white/10 text-white"
            />

            <Button
              variant="gradient"
              text="Update Password"
              fullWidth={true}
              loading={loading}
              className="mt-6 shadow-lg hover:shadow-indigo-500/20"
            />
          </form>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { LabService } from '../../lib/labService';
import { Lock, Mail, User, Package, UserRoundPlus, Eye, EyeOff, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../Button';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../Input';

const LoginForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
const [labName, setLabName] = useState('');
  const [labs, setLabs] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // State to control if Ctrl + ` has been pressed to enable the sign-up link
  const [allowSignUpClick, setAllowSignUpClick] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // Fetch labs on component mount
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const fetchedLabs = await LabService.getLabs();
        setLabs(fetchedLabs);
      } catch (error) {
        console.error('Error fetching labs:', error);
      }
    };

    fetchLabs();
  }, []);

  // Listen globally for Ctrl + ` key press to enable sign-up link
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '`') {
        setAllowSignUpClick(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isLogin) {
      if (!name.trim()) {
        setError('Name is required');
        setLoading(false);
        return;
      }
      if (!role.trim()) {
        setError('Role is required');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        const { error: signInError } = await signIn(email, password, rememberMe);
        if (signInError) {
          setError((signInError as { message?: string }).message || 'An error occurred');
        } else {
          navigate('/');
        }
      } else {
        const { error: signUpError } = await signUp(email, password, { name, role, lab_id: labName });
        if (signUpError) setError((signUpError as { message?: string }).message || 'An error occurred');
      }
    } catch (err: unknown) {
      // console.error('Auth error:', err);
      setError((err as Error)?.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-indigo-900 p-4'>
      <div className='w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden transform transition-all hover:scale-[1.01] duration-300'>
        <div className='p-8 text-center'>
          <div className='flex items-center justify-center mb-6'>
            <div className='w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg mr-4'>
              {isLogin ? (
                <Package className='h-10 w-10 text-white' />
              ) : (
                <UserRoundPlus className='h-10 w-10 text-white' />
              )}
            </div>
            <h1 className='text-4xl font-bold text-white'>AssetFlow</h1>
          </div>

          <h2 className='text-3xl font-bold text-white mb-2 text-center'>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className='text-white/70 mb-8 text-center'>
            {isLogin
              ? 'Sign in to access your AssetFlow dashboard'
              : 'Create a new AssetFlow account to get started'}
          </p>

          {error && (
            <div className='bg-red-500/20 text-red-100 px-4 py-3 rounded-lg mb-6 text-sm border border-red-500/30'>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-5'>
            {!isLogin && (
              <>
                <Input
                  label='Full Name'
                  name='name'
                  type='text'
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder='Enter your full name'
                  icon={<User className='text-white/60' />}
                  className='bg-white/5 border-white/10 text-white'
                />

                <div className='flex flex-col text-left'>
                  <label className='mb-1 text-white/80 text-sm font-medium' htmlFor='role'>
                    Role
                  </label>
                  <div className='relative flex items-center'>
                    <select
                      id='role'
                      name='role'
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      className='w-full px-4 py-2 pr-10 rounded-md border border-white/20 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out'
                    >
                      <option className='bg-gray-800 text-white' value=''>
                        Select a role
                      </option>
                      <option className='bg-gray-800 text-white' value='Lab Incharge'>
                        Lab Incharge
                      </option>
                      <option className='bg-gray-800 text-white' value='Lab Assistant'>
                        Lab Assistant
                      </option>
                      <option className='bg-gray-800 text-white' value='HOD'>
                        HOD
                      </option>
                    </select>
                  </div>
                </div>

                <div className='flex flex-col text-left'>
                  <label className='mb-1 text-white/80 text-sm font-medium' htmlFor='labId'>
                    Lab
                  </label>
                  <div className='relative flex items-center'>
                    <select
                      id='labName'
                      name='labName'
                      value={labName}
                      onChange={e => setLabName(e.target.value)}
                      className='w-full px-4 py-2 pr-10 rounded-md border border-white/20 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out'
                    >
                      <option className='bg-gray-800 text-white' value=''>
                        Select a lab
                      </option>
                      {labs.map(lab => (
                        <option key={lab.id} value={lab.id} className='bg-gray-800 text-white'>
                          {lab.name}
                        </option>
                      ))}
                    </select>
                    <Building2 className='absolute right-3 h-5 w-5 text-white/60 pointer-events-none' />
                  </div>
                </div>
              </>
            )}

            <Input
              label='Email'
              name='email'
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='Enter your email'
              icon={<Mail className='text-white/60' />}
              className='bg-white/5 border-white/10 text-white'
            />

            <Input
              label='Password'
              name='password'
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder='••••••••'
              icon={
                showPassword ? (
                  <EyeOff
                    className='text-white/60 cursor-pointer'
                    onClick={() => setShowPassword(false)}
                  />
                ) : (
                  <Eye
                    className='text-white/60 cursor-pointer'
                    onClick={() => setShowPassword(true)}
                  />
                )
              }
              className='bg-white/5 border-white/10 text-white'
            />

            <div className='flex justify-between items-center mt-4'>
              <div className='flex items-center'>
                <input
                  type='checkbox'
                  id='rememberMe'
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className='mr-2'
                />
                <label htmlFor='rememberMe' className='text-white/60 text-sm'>
                  Remember Me
                </label>
              </div>

              {isLogin && (
                <p className='text-sm text-indigo-300 hover:text-white cursor-pointer'>
                  <Link to='/forgot-password' className='font-medium'>
                    Forgot Password?
                  </Link>
                </p>
              )}
            </div>

            <Button
              variant='gradient'
              text={loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              fullWidth={true}
              loading={loading}
              startIcon={isLogin ? <Lock className='ml-2' /> : <UserRoundPlus className='ml-2' />}
            />

            <p className='text-white/60 text-sm text-center pt-4'>
              {isLogin && (
                <>
                  <br className='sm:hidden' />
                </>
              )}
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Link
                to='#'
                onClick={e => {
                  if (isLogin && !allowSignUpClick) {
                    e.preventDefault();
                    return;
                  }
                  setIsLogin(!isLogin);
                  setAllowSignUpClick(false); // reset on toggle
                }}
                className={`font-medium ${
                  isLogin
                    ? allowSignUpClick
                      ? 'text-indigo-300 hover:text-white cursor-pointer'
                      : 'text-gray-500 cursor-not-allowed select-none'
                    : 'text-indigo-300 hover:text-white cursor-pointer'
                }`}
                aria-disabled={isLogin && !allowSignUpClick}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;

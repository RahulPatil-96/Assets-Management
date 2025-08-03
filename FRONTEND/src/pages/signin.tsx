import { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, User, Eye, EyeOff, Package } from 'lucide-react';
import { useAuthContext } from '../hooks/useAuth';

export function Signin() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuthContext();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '`') {
        setShowSignUp(prev => !prev);
      }

      if (e.ctrlKey && e.shiftKey && e.key === '~') {
        setShowSignUp(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSignin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const success = await login(name, password);
      if (success) {
        // Redirect to dashboard on successful login
        navigate('/dashboard');
      } else {
        setError('Invalid credentials');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-indigo-900 p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden transform transition-all hover:scale-[1.01] duration-300">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg mb-6">
            <Package className="h-10 w-10 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-white/70 mb-8">Sign in to access your dashboard</p>

          {error && (
            <div className="bg-red-500/20 text-red-100 px-4 py-3 rounded-lg mb-6 text-sm border border-red-500/30">
              {error}
            </div>
          )}

          <form onSubmit={handleSignin} className="space-y-5">
            <Input
              label="Full Name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              icon={<User className="text-white/60" />}
              className="bg-white/5 border-white/10 text-white"
            />
            <Input
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={
                showPassword ? (
                  <EyeOff
                    className="text-white/60 cursor-pointer"
                    onClick={() => setShowPassword(false)}
                  />
                ) : (
                  <Eye
                    className="text-white/60 cursor-pointer"
                    onClick={() => setShowPassword(true)}
                  />
                )
              }
              className="bg-white/5 border-white/10 text-white"
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="rounded border-white/30 bg-white/5 checked:bg-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-white/80 text-sm">Remember me</span>
              </label>

              {showSignUp ? (
                <Link
                  to="/forgot-password"
                  state={{ username: name }}
                  className="text-indigo-300 hover:text-indigo-100 text-sm hover:underline"
                >
                  Forgot password?
                </Link>
              ) : (
                <span className="text-indigo-300 text-sm cursor-not-allowed select-none">
                  Forgot password?
                </span>
              )}
            </div>

            <Button
              variant="gradient"
              text="Sign In"
              fullWidth={true}
              loading={loading}
              startIcon={<LogIn className="ml-2" />}
            />

            <p className="text-white/60 text-sm text-center pt-4">
              Don't have an account?{' '}
              {showSignUp ? (
                <Link to="/signup" className="text-indigo-300 hover:text-white font-medium">
                  Sign up
                </Link>
              ) : (
                <span className="text-indigo-300 font-medium cursor-not-allowed select-none">
                  Sign up
                </span>
              )}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
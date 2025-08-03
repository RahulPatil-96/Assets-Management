import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Eye, EyeOff, RefreshCw, KeySquare } from 'lucide-react';

export function ForgotPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Get username from location state
    if (location.state && location.state.username) {
      setUsername(location.state.username);
    }
  }, [location.state]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!password) {
      setError('Password is required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);

    // Simulate password update process
    setTimeout(() => {
      console.log('Password updated for:', username);
      setLoading(false);
      // Redirect to signin page after update
      navigate('/signin');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-indigo-900 p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden transform transition-all hover:scale-[1.01] duration-300">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg mb-6">
            <KeySquare className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-6">Update Password</h2>

          {error && (
            <div className="bg-red-500/20 text-red-100 px-4 py-3 rounded-lg mb-6 text-sm border border-red-500/30">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Username"
              type="text"
              value={username}
              className="bg-white/5 border-white/10 text-white cursor-not-allowed" name={''}            />

            <Input
              label="New Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              icon={showPassword ? (
                <EyeOff className="text-white/60 cursor-pointer" onClick={() => setShowPassword(false)} />
              ) : (
                <Eye className="text-white/60 cursor-pointer" onClick={() => setShowPassword(true)} />
              )}
              className="bg-white/5 border-white/10 text-white" name={''}            />

            <Input
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              icon={showConfirmPassword ? (
                <EyeOff className="text-white/60 cursor-pointer" onClick={() => setShowConfirmPassword(false)} />
              ) : (
                <Eye className="text-white/60 cursor-pointer" onClick={() => setShowConfirmPassword(true)} />
              )}
              className="bg-white/5 border-white/10 text-white" name={''}            />

            <Button
              variant="gradient"
              text="Update Password"
              fullWidth={true}
              loading={loading}
              startIcon={<RefreshCw className="ml-2" />}
            />
            <p className="text-white/60 text-sm text-center pt-4">
              Don't want to update password?{' '}
              <Link to="/signin" className="text-indigo-300 hover:text-white font-medium">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Link, useNavigate } from 'react-router-dom';
import { UserRoundPlus, User, Eye, EyeOff, UserPlus } from 'lucide-react'
import authService, { SignupData } from '../services/authService';

export function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!formData.role.trim()) {
      setError('Role is required');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!acceptTerms) {
      setError('You must accept the terms');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const signupData: SignupData = {
        name: formData.name,
        role: formData.role,
        password: formData.password
      };

      await authService.signup(signupData);
      // Redirect to signin page on successful signup
      navigate('/signin');
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-indigo-900 p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden transform transition-all hover:scale-[1.01] duration-300">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg mb-6">
            <UserRoundPlus className="h-10 w-10 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>

          {error && (
            <div className="bg-red-500/20 text-red-100 px-4 py-3 rounded-lg mb-6 text-sm border border-red-500/30">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              icon={<User className="text-white/60" />}
              className="bg-white/5 border-white/10 text-white"
            />

            <div className="flex flex-col text-left">
              <label className="mb-1 text-white/80 text-sm font-medium" htmlFor="role">Role</label>
              <div className="relative flex items-center">
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2 pr-10 rounded-md border border-white/20 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out"
                >
                  <option className="bg-gray-800 text-white" value="">Select a role</option>
                  <option className="bg-gray-800 text-white" value="lab_assistant">Lab Assistant</option>
                  <option className="bg-gray-800 text-white" value="assistant professor">Assistant Professor</option>
                  <option className="bg-gray-800 text-white" value="hod">Head of Department</option>
                </select>
              </div>
            </div>

            <Input
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
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
              name="confirmPassword"
              type={showPassword2 ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              icon={
                showPassword2 ? (
                  <EyeOff className="text-white/60 cursor-pointer" onClick={() => setShowPassword2(false)} />
                ) : (
                  <Eye className="text-white/60 cursor-pointer" onClick={() => setShowPassword2(true)} />
                )
              }
              className="bg-white/5 border-white/10 text-white"
            />
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={() => setAcceptTerms(!acceptTerms)}
                className="mt-0.5 rounded border-white/30 bg-white/5 checked:bg-indigo-500 focus:ring-indigo-500"
              />
              <span className="text-white/70 text-sm">
                I agree to the{' '}
                <Link to="/terms" className="text-indigo-300 hover:underline">
                  Terms & Conditions
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-indigo-300 hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>

            <Button
              variant="gradient"
              text="Create Account"
              fullWidth={true}
              loading={loading}
              startIcon={<UserPlus className="ml-2" />}
            />
            <p>
              Already have an account?{' '}
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

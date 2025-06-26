import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main'; // Assuming this path is correct for your Zustand store

// -- API Base URL --
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}`;

// -- Interfaces --

// Interface for the login API response
interface LoginResponse {
  user_id: string;
  username: string;
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Interface for the login API error response
interface LoginErrorResponse {
  error: string;
}

const UV_Login: React.FC = () => {
  // -- Local Component State --
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  // -- Global State Access --
  const authState = useAppStore((state) => state.auth);
  const setAuthUser = useAppStore((state) => state.set_auth_user);
  const showNotification = useAppStore((state) => state.show_notification);
  const initializeApp = useAppStore((state) => state.initialize_app); // To re-check auth state after login

  // -- Navigation --
  const navigate = useNavigate();

  // -- Redirect if already authenticated --
  useEffect(() => {
    // Wait for initialization to complete ensuring auth state is properly loaded
    if (!authState.loading && authState.is_authenticated) {
      navigate('/products', { replace: true });
    }
    // If authState.loading is true, we're waiting for initialization, don't redirect yet.
    // initializeApp is not strictly needed in dependency array as it's a setter function from Zustand store, which is stable.
  }, [authState.is_authenticated, authState.loading, navigate]);

  // -- Login Mutation Hook --
  const loginMutation = useMutation<LoginResponse, LoginErrorResponse, { email: string; password: string }>({
    mutationFn: async ({ email, password }) => {
      const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });
      return response.data;
    },
    onSuccess: (data) => {
      const tokenExpiration = Date.now() + data.expires_in * 1000;
      // Update global auth state using Zustand
      setAuthUser({
        is_authenticated: true,
        user_id: data.user_id,
        username: data.username,
        access_token: data.access_token,
        token_expiration: tokenExpiration,
        // email: data.email, // Removed: Email is not returned by the API (_id: 'ISSUE-001')
      });
      // Show success notification
      showNotification('Login successful! Redirecting you now.', 'success');
      // Redirect to a default page after successful login
      navigate('/products', { replace: true });
    },
    onError: (error) => {
      // Handle login errors
      const errorMessage = error?.error || 'Login failed. Please check your credentials.';
      showNotification(errorMessage, 'error');
    },
  });

  // -- Event Handlers --
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleRememberMeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRememberMe(e.target.checked);
    // TODO: Implement logic for rememberMe flag (e.g., persistent token storage) (_id: 'ISSUE-005')
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Basic client-side validation
    if (!email || !password) {
      showNotification('Please enter both email and password.', 'warning');
      return;
    }

    // Trigger the login mutation
    loginMutation.mutate({ email, password });
  };

  // -- Render Logic --
  // If already authenticated, redirect is handled by useEffect.
  // This component only renders the form if not logged in or initialization is pending verification.
  if (authState.loading) {
    // Show a loading state while the app initializes and checks authentication
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg text-gray-600">Loading session...</div>
      </div>
    );
  }

  return (
    // Wrap in React.Fragment to avoid unnecessary div container (_id: 'ISSUE-010')
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto px-4 py-8 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Welcome Back!</h1>
      <form className="w-full" onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-150 ease-in-out"
            placeholder="your.email@example.com"
            disabled={loginMutation.isPending}
          />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={handlePasswordChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-150 ease-in-out"
            placeholder="Enter your password"
            disabled={loginMutation.isPending}
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={handleRememberMeToggle}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 cursor-pointer">
              Remember Me
            </label>
          </div>
          <div className="text-sm">
            <Link
              to="/forgot-password"
              className="font-medium text-green-600 hover:text-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-150 ease-in-out"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
            bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out
            ${loginMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <div className="mt-6 text-sm text-center text-gray-600">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="font-medium text-green-600 hover:text-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-150 ease-in-out"
        >
          Sign Up here
        </Link>
      </div>
    </div>
  );
};

export default UV_Login;
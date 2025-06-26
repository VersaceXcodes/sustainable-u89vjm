import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main'; // Ensure this path is correct for your project structure
import { EnvelopeIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline'; // Example icons

// --- Interfaces ---
interface RegistrationErrorResponse {
  error?: string; // General error message
  details?: Record<string, string>; // Field-specific error messages (e.g., { username: "Username is already taken." })
}

interface RegistrationSuccessResponse {
  user_id: string;
  message: string;
}

// --- Component ---
const UV_Registration: React.FC = () => {
  const navigate = useNavigate();
  const { show_notification } = useAppStore((state) => ({
    show_notification: state.show_notification,
  }));

  // Local state for form fields
  const [username, set_username] = useState<string>('');
  const [email, set_email] = useState<string>('');
  const [password, set_password] = useState<string>('');
  const [confirm_password, set_confirm_password] = useState<string>('');
  const [terms_accepted, set_terms_accepted] = useState<boolean>(false);

  // State for validation errors
  const [validation_errors, set_validation_errors] = useState<{
    username: string | null;
    email: string | null;
    password: string | null;
    confirm_password: string | null;
    terms_accepted: string | null;
  }>({
    username: null,
    email: null,
    password: null,
    confirm_password: null,
    terms_accepted: null,
  });

  // Password strength indicator (basic: length)
  const password_length = password.length;
  const is_password_too_short = password_length < 8; // Example minimum requirement

  // Redirect if already authenticated
  // Assuming 'auth.is_authenticated' is correctly managed by useAppStore
  // useEffect(() => {
  //   const { is_authenticated } = useAppStore.getState().auth;
  //   if (is_authenticated) {
  //     navigate('/'); // Redirect to homepage or dashboard if already logged in
  //   }
  // }, [navigate]); // Dependency array is empty to run only once if auth state is not directly reactive for this effect

  // --- API Mutation for Registration ---
  const registrationMutation = useMutation<
    RegistrationSuccessResponse, // Response type
    RegistrationErrorResponse,   // Error type
    { username: string; email: string; password: string } // Request payload type
  >({
    mutationFn: async (userData) => {
      // Construct the full URL using the environment variable, ensuring '/api' is handled correctly
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const apiUrl = `${baseUrl}/api/users`;
      const response = await axios.post<RegistrationSuccessResponse>(apiUrl, userData);
      return response.data;
    },
    onMutate: () => {
      // Reset previous errors and clear any general error messages
      set_validation_errors({
        username: null,
        email: null,
        password: null,
        confirm_password: null,
        terms_accepted: null,
      });
      // Consider managing a global 'is_registering' state if needed for UI
    },
    onSuccess: (data) => {
      // Show success notification using the global store, provide a default message
      show_notification(data.message || 'Registration successful! Please check your email for verification.', 'success');
      // Redirect to the login page
      navigate('/login');
    },
    onError: (error: any) => { // Using 'any' for broader error object if specific type isn't fully known here
      const responseError = error.response?.data;

      // Reset all validation errors before applying new ones
      set_validation_errors({
        username: null,
        email: null,
        password: null,
        confirm_password: null,
        terms_accepted: null,
      });

      if (responseError?.details) {
        // Backend returned specific field errors, map them
        set_validation_errors({
          username: responseError.details.username || null,
          email: responseError.details.email || null,
          password: responseError.details.password || null,
          confirm_password: responseError.details.confirm_password || null,
          terms_accepted: responseError.details.terms_accepted || null,
        });
      } else if (responseError?.error) {
        // General backend error, display using global notification
        show_notification(responseError.error, 'error');
      } else {
        // Network or unexpected error
        show_notification('An unexpected error occurred. Please try again later.', 'error');
      }
    },
    onSettled: () => {
      // Resetting loading state is implicitly handled by mutation lifecycle,
      // but if using a separate local state for 'is_registering', reset it here.
    },
  });

  // --- Form Submission Handler ---
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Reset validation errors before starting new validation
    set_validation_errors({
      username: null,
      email: null,
      password: null,
      confirm_password: null,
      terms_accepted: null,
    });

    let formIsValid = true;

    // Username validation
    if (!username.trim()) {
      set_validation_errors((prev) => ({ ...prev, username: 'Username is required.' }));
      formIsValid = false;
    }

    // Email validation (basic format)
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      set_validation_errors((prev) => ({ ...prev, email: 'Please enter a valid email address.' }));
      formIsValid = false;
    }

    // Password validation (basic checks). More robust checks should align with backend requirements.
    if (password.length < 8) { // Example minimum length
      set_validation_errors((prev) => ({ ...prev, password: 'Password must be at least 8 characters long.' }));
      formIsValid = false;
    }
    if (!confirm_password) {
      set_validation_errors((prev) => ({ ...prev, confirm_password: 'Please confirm your password.' }));
      formIsValid = false;
    }
    if (password !== confirm_password) {
      set_validation_errors((prev) => ({ ...prev, confirm_password: 'Passwords do not match.' }));
      formIsValid = false;
    }

    // Terms acceptance validation
    if (!terms_accepted) {
      set_validation_errors((prev) => ({ ...prev, terms_accepted: 'You must accept the Terms of Service and Privacy Policy.' }));
      formIsValid = false;
    }

    // If client-side validation passes, trigger the mutation
    if (formIsValid) {
      registrationMutation.mutate({
        username: username.trim(),
        email: email.trim(),
        password: password,
      });
    }
  };

  return (
    <>
      <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-md p-8 mt-10">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Create Your Account</h2>
        <p className="text-center text-gray-600 mb-8">
          Join SustainaReview and start making informed choices.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Input */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </span>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  set_username(e.target.value);
                  // Clear specific validation error on input change
                  if (validation_errors.username) {
                    set_validation_errors((prev) => ({ ...prev, username: null }));
                  }
                }}
                className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-green-500 focus:border-green-500 block sm:text-sm ${
                  validation_errors.username ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Choose a username"
              />
            </div>
            {validation_errors.username && <p className="text-red-500 text-xs mt-1">{validation_errors.username}</p>}
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              </span>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  set_email(e.target.value);
                  // Clear specific validation error on input change
                  if (validation_errors.email) {
                    set_validation_errors((prev) => ({ ...prev, email: null }));
                  }
                }}
                className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-green-500 focus:border-green-500 block sm:text-sm ${
                  validation_errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
              />
            </div>
            {validation_errors.email && <p className="text-red-500 text-xs mt-1">{validation_errors.email}</p>}
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                {/* Corrected icon usage */}
                <LockClosedIcon className="h-5 w-5 text-gray-400" /> 
              </span>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  set_password(e.target.value);
                  // Clear specific validation error on input change
                  if (validation_errors.password) {
                    set_validation_errors((prev) => ({ ...prev, password: null }));
                  }
                  // Only clear confirm_password error if passwords now match AND confirm_password is not empty
                  if (e.target.value === confirm_password && confirm_password) {
                     set_validation_errors((prev) => ({ ...prev, confirm_password: null }));
                  }
                }}
                className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-green-500 focus:border-green-500 block sm:text-sm ${ (is_password_too_short || validation_errors.password) ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Create a strong password"
              />
            </div>
            {is_password_too_short && <p className="text-red-500 text-xs mt-1">Password must be at least 8 characters.</p>}
            {validation_errors.password && !is_password_too_short && <p className="text-red-500 text-xs mt-1">{validation_errors.password}</p>}
          </div>

          {/* Confirm Password Input */}
          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                {/* Corrected icon usage */}
                <LockClosedIcon className="h-5 w-5 text-gray-400" />
              </span>
              <input
                id="confirm_password"
                type="password"
                autoComplete="new-password"
                value={confirm_password}
                onChange={(e) => {
                  set_confirm_password(e.target.value);
                  // Clear confirm password error if passwords now match
                  if (validation_errors.confirm_password && password === e.target.value) {
                    set_validation_errors((prev) => ({ ...prev, confirm_password: null }));
                  } else if (e.target.value !== password) { // Re-apply error if they mismatch again
                    set_validation_errors((prev) => ({ ...prev, confirm_password: 'Passwords do not match.' }));
                  }
                }}
                className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-green-500 focus:border-green-500 block sm:text-sm ${validation_errors.confirm_password ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Confirm your password"
              />
            </div>
            {validation_errors.confirm_password && <p className="text-red-500 text-xs mt-1">{validation_errors.confirm_password}</p>}
          </div>

          {/* Terms and Policy Acceptance */}
          <div className="flex items-center">
            <input
              id="terms"
              type="checkbox"
              checked={terms_accepted}
              onChange={(e) => {
                set_terms_accepted(e.target.checked);
                // Clear specific validation error on input change
                if (validation_errors.terms_accepted) {
                  set_validation_errors((prev) => ({ ...prev, terms_accepted: null }));
                }
              }}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
              aria-label="Accept Terms of Service and Privacy Policy"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900 cursor-pointer">
              I agree to the {' '}
              <Link to="/terms-of-service" className="font-medium text-green-600 hover:text-green-800">
                Terms of Service
              </Link>
              {' '} and the {' '}
              <Link to="/privacy-policy" className="font-medium text-green-600 hover:text-green-800">
                Privacy Policy
              </Link>
            </label>
          </div>
          {validation_errors.terms_accepted && <p className="text-red-500 text-xs mt-1">{validation_errors.terms_accepted}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={registrationMutation.isPending || is_password_too_short}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium 
              ${registrationMutation.isPending || is_password_too_short
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
              }
            `}
          >
            {registrationMutation.isPending ? 'Submitting...' : 'Register Account'}
          </button>
        </form>

        {/* Login Prompt */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-green-600 hover:text-green-800">
            Login here
          </Link>
        </p>
      </div>
    </>
  );
};

export default UV_Registration;
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios'; // Import AxiosError for type checking
import { useAppStore } from '@/store/main'; // Corrected import path as per analysis

// --- API Base URL Definition (using Vite env variable) ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// --- Password Policy Helper Function ---
// Provides feedback on password strength. More complex logic can be added.
const checkPasswordStrength = (password: string): string => {
  if (password.length < 6) return 'text-red-500'; // Too short
  if (password.length <= 8) return 'text-orange-500'; // Weak
  // Basic check for moderate: length + at least two character types (upper/lower, num, symbol)
  const hasNumber = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  let score = 0;
  if (password.length >= 8) score++;
  if (hasNumber) score++;
  if (hasUpper) score++;
  if (hasLower) score++;
  if (hasSymbol) score++;

  if (score >= 4) return 'text-green-500'; // Strong
  if (score >= 2) return 'text-yellow-500'; // Moderate
  return 'text-orange-500'; // Weak (covers cases like 8 chars but only lowercase)
};

// --- Component Definition ---
const UV_ResetPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  // Access the token from URL parameters. The `token` param MUST exist for this route.
  const { token } = useParams<{ token: string }>();

  // Access Zustand store actions
  const { show_notification } = useAppStore((state) => ({
      show_notification: state.show_notification,
  }));

  // --- Local Component State ---
  const [new_password, setNewPassword] = useState<string>('');
  const [confirm_new_password, setConfirmNewPassword] = useState<string>('');
  const [validation_errors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [api_error, setApiError] = useState<string | null>(null); // For API-level errors
  const [passwordStrengthClass, setPasswordStrengthClass] = useState<string>('text-gray-400'); // Initial style for strength indicator

  // --- Password Strength Update Effect ---
  // Update the strength indicator's color based on the new password's strength
  useEffect(() => {
    setPasswordStrengthClass(checkPasswordStrength(new_password));
  }, [new_password]);

  // --- Password Reset Mutation Hook ---
  const { mutate: resetPasswordMutation, isPending: isResetting } = useMutation({ // Corrected mutation object
    mutationFn: async ({ reset_token, new_password }) => {
      if (!new_password) { // A final guard, though form validation should catch this
        throw new Error("Password cannot be empty.");
      }
      
      // Create a local axios instance to ensure it uses the correct base URL from .env
      const localApiService = axios.create({
        baseURL: API_BASE_URL,
      });

      // Make the POST request to the backend API
      const response = await localApiService.post<{ message: string }>('/auth/reset-password', {
        reset_token,
        new_password,
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Display success notification and redirect to the login page
      if (show_notification) {
        show_notification(data.message || 'Password reset successfully. Please log in.', 'success');
      }
      navigate('/login');
    },
    onError: (error: AxiosError<{ error?: string }>) => {
      let errorMessage = 'An unexpected error occurred during password reset. Please try again.';
      
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error) {
          errorMessage = error.response.data.error; // Use specific error from backend payload
        } else if (error.response?.status === 401) {
          errorMessage = 'The password reset link is invalid or has expired. Please request a new one.';
        } else if (error.response?.status === 400) {
          errorMessage = 'Invalid request. Please check the link or request a new one.';
        } else if (error.message) {
          errorMessage = error.message; // Fallback to generic error message
        }
      } else if (error instanceof Error) {
         errorMessage = error.message; // Handle non-Axios errors
      }
      
      setApiError(errorMessage); // Store API error message
      // Do NOT clear validation_errors here, as they might still be relevant (e.g., if backend only returned API error)
      
      if (show_notification) {
        show_notification(errorMessage, 'error');
      }
    },
  });

  // --- Event Handlers for Input Fields ---
  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);
    // Clear specific validation error for 'new_password' when user types
    if (validation_errors.new_password) {
      setValidationErrors((prev) => ({ ...prev, new_password: '' }));
    }
    // Clear API error when user starts typing again
    if (api_error) {
      setApiError(null);
    }
  };

  const handleConfirmNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmNewPassword(value);
    // Clear specific validation error for 'confirm_new_password' when user types
    if (validation_errors.confirm_new_password) {
      setValidationErrors((prev) => ({ ...prev, confirm_new_password: '' }));
    }
  };

  // --- Form Submission Handler ---
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default browser form submission
    const errors: { [key: string]: string } = {};

    // --- Client-Side Validation Logic ---
    if (!new_password.trim()) {
      errors.new_password = 'New password is required.';
    } else if (new_password.length < 6) { // Enforcing minimum length of 6 characters
      errors.new_password = 'Password must be at least 6 characters long.';
    } else if (new_password.length > 72) { // Enforcing server-side max length (common practice)
        errors.new_password = 'Password cannot exceed 72 characters.';
    } else {
      // Add complexity checks as per requirement
      const hasNumber = /\d/.test(new_password);
      const hasUpper = /[A-Z]/.test(new_password);
      const hasLower = /[a-z]/.test(new_password);
      const hasSymbol = /[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]/.test(new_password);
      if (new_password.length < 8 || !(hasNumber && (hasUpper || hasLower)) && !(hasUpper && hasLower)) {
        // Example: require at least 8 chars and a combination of numbers/symbols or upper/lower
        // This logic can be refined based on specific password policies.
        const complexityError = 'Password must be at least 8 characters and contain a mix of character types (uppercase, lowercase, numbers, symbols).';
        errors.new_password = complexityError;
      }
    }
    // Note: More complex password policies (e.g., complexity) should ideally be enforced server-side
    // for maximum security, but client-side feedback is good UX.

    if (!confirm_new_password.trim()) {
      errors.confirm_new_password = 'Password confirmation is required.';
    } else if (new_password !== confirm_new_password) {
      // Check if passwords match
      errors.confirm_new_password = 'Passwords do not match.';
    }

    setValidationErrors(errors); // Update validation errors state

    // Proceed with mutation if:
    // 1. No client-side validation errors.
    // 2. A valid token exists in the URL.
    if (Object.keys(errors).length === 0 && token) {
      resetPasswordMutation({ reset_token: token, new_password });
    } else if (!token) {
      // This case should be rare if routing guards are in place, but good to handle.
      const msg = 'Invalid password reset link: Token is missing.';
      setApiError(msg); // Treat as an API error if token is absent
      if (show_notification) show_notification(msg, 'error');
    }
    // If there are validation errors, the mutation is not called, and errors are displayed.
  };

  // --- Conditional Rendering for Already Authenticated User ---
  // If a user is already logged in, this page might not be relevant.
  // However, for reset flows, we allow access. Optionally, one could redirect.
  // Example check:
  // if (auth.is_authenticated) {
  //   // Optionally show a message or redirect
  //   // navigate('/dashboard'); // Or wherever appropriate
  // }

  return (
    <div className="max-w-sm mx-auto mt-10 p-6 border border-gray-300 rounded-lg shadow-md bg-white">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Reset Your Password</h2>
      <form onSubmit={handleSubmit}>
        {/* New Password Input Field */}
        <div className="mb-4">
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            type="password"
            id="new-password"
            value={new_password}
            onChange={handleNewPasswordChange}
            required
            className={`w-full px-3 py-2 border ${validation_errors.new_password ? 'border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md shadow-sm sm:text-sm`}
            aria-label="New Password"
            aria-invalid={!!validation_errors.new_password}
            aria-errormessage="password-error-new"
            disabled={isResetting}
          />
          {/* Display validation error for New Password */}
          {validation_errors.new_password && (
            <p className="mt-1 text-xs text-red-500" id="password-error-new">
              {validation_errors.new_password}
            </p>
          )}
          {/* Password Strength Indicator */}
          <div className="mt-1 text-right">
            <span className={`text-xs font-semibold ${passwordStrengthClass}`}>
              {new_password.length === 0 ? '' : 
               new_password.length < 6 ? 'Too Short' : 
               new_password.length < 8 ? 'Weak' : 
               new_password.length < 10 ? 'Moderate' : 'Strong'}
            </span>
          </div>
        </div>

        {/* Confirm New Password Input Field */}
        <div className="mb-6">
          <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirm-new-password"
            value={confirm_new_password}
            onChange={handleConfirmNewPasswordChange}
            required
            className={`w-full px-3 py-2 border ${validation_errors.confirm_new_password ? 'border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md shadow-sm sm:text-sm`}
            aria-label="Confirm New Password"
            aria-invalid={!!validation_errors.confirm_new_password}
            aria-errormessage="password-error-confirm"
            disabled={isResetting}
          />
          {/* Display validation error for Confirm New Password */}
          {validation_errors.confirm_new_password && (
            <p className="mt-1 text-xs text-red-500" id="password-error-confirm">
              {validation_errors.confirm_new_password}
            </p>
          )}
        </div>
        
        {api_error && !Object.values(validation_errors).some(err => err !== '') && (
            <p className="mt-2 text-sm text-red-500 text-center" role="alert">
              {api_error}
            </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isResetting || !new_password.trim() || !confirm_new_password.trim() || Object.values(validation_errors).some(err => err !== '')}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ease-in-out 
            ${
              isResetting || !new_password.trim() || !confirm_new_password.trim() || Object.values(validation_errors).some(err => err !== '')
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
        >
          {isResetting ? 'Resetting...' : 'Reset Password'}
        </button>

        {/* Link back to Login Page */}
        <div className="mt-4 text-center text-sm">
          <p>
            Remember your password?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              Log In
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default UV_ResetPasswordForm;
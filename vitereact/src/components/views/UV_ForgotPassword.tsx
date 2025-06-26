import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useForm, SubmitHandler } from 'react-hook-form';

// Import the Zustand store hook
import { useAppStore } from '@/store/main';

// --- Interfaces for Form Data and API Responses ---

interface ForgotPasswordFormInputs {
  email: string;
}

interface ResetPasswordRequestResponse {
  message: string;
}

interface ErrorResponse {
  error: string;
}

// --- API Base URL ---
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api`;

// --- View Component ---
const UV_ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  // Accessing global state and actions from Zustand store
  const set_reset_request_success_message = useAppStore((state) => state.set_reset_request_success_message);
  const set_reset_request_error = useAppStore((state) => state.set_reset_request_error);
  const show_notification = useAppStore((state) => state.show_notification);
  // Accessing specific fields from the store for display
  const reset_request_success_message_from_store = useAppStore((state) => state.reset_request_success_message);
  const reset_request_error_from_store = useAppStore((state) => state.reset_request_error);

  // Clear global messages when the component mounts to prevent stale messages
  useEffect(() => {
    set_reset_request_error(null);
    set_reset_request_success_message(null);
  }, [set_reset_request_error, set_reset_request_success_message]);

  // --- React Hook Form Setup ---
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormInputs>();

  // --- Mutation for sending reset link ---
  const forgotPasswordMutation = useMutation<ResetPasswordRequestResponse, { response: { data: ErrorResponse } }, ForgotPasswordFormInputs>({
    mutationFn: async (formData) => {
      const response = await axios.post<ResetPasswordRequestResponse>(
        `${API_BASE_URL}/auth/reset-password-request`,
        formData
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Update the global store state with the success message
      set_reset_request_success_message(data.message);
    },
    onError: (error) => {
      // Use the global notification system for immediate feedback
      // Safely access error message, default to a generic message if structure is unexpected
      const errorMessage = error.response?.data?.error || 'An unexpected error occurred. Please try again.';
      show_notification(errorMessage, 'error');
      set_reset_request_error(errorMessage);
    },
  });

  // --- Event Handlers ---
  const onSubmit: SubmitHandler<ForgotPasswordFormInputs> = (data) => {
    // Clear previous messages only if a new request is being made and it's not pending
    // This prevents clearing messages if the user tries to submit multiple times quickly
    if (!forgotPasswordMutation.isPending) {
      set_reset_request_error(null);
      set_reset_request_success_message(null);
      forgotPasswordMutation.mutate(data);
    }
  };

  // Handle navigation back to login
  const navigateToLogin = () => {
    navigate('/login');
  };

  // --- Render Method ---
  return (
    <>
      <div className="max-w-sm mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Forgot Password</h1>
        <p className="text-center text-gray-600 mb-6 text-sm">
          Enter your email address below, and we'll send you instructions on how to reset your password.
        </p>

        {/* Display Global Success or Error Messages from Store */}
        {(reset_request_success_message_from_store || reset_request_error_from_store) && (
          <div
            className={`mb-6 px-4 py-3 rounded relative ${
              reset_request_success_message_from_store
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}
            role="alert"
          >
            <strong className="font-bold mr-2">
              {reset_request_success_message_from_store ? 'Success!' : 'Error!'}
            </strong>
            <span className="block sm:inline">
              {reset_request_success_message_from_store || reset_request_error_from_store}
            </span>
          </div>
        )}

        {/* Email Input Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              {...register('email', {
                required: 'Email address is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                  message: 'Invalid email address format',
                },
              })}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="your.email@example.com"
              aria-invalid={errors.email ? 'true' : 'false'}
              disabled={forgotPasswordMutation.isPending} // Disable input while request is pending
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={forgotPasswordMutation.isPending}
            >
              {forgotPasswordMutation.isPending ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>

        {/* Back to Login Link */}
        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H13a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd"/>
            </svg>
            Back to Login
          </Link>
        </div>
      </div>
    </>
  );
};

export default UV_ForgotPassword;
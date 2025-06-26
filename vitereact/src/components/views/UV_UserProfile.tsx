import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios'; // Moved import to top
import { useAppStore } from '@/store/main'; // Assuming correct path to zustand store

// --- API Base URL ---
// Assume apiService is configured globally in '@/services/apiService' or similar
// For this example, we'll use a direct axios call with the base URL
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api`;

// --- Interfaces ---

// User Profile Data fetched from /users/me
interface UserProfile {
  user_id: string;
  username: string;
  email: string;
}

// User Review List Item Data fetched from /users/me/reviews
interface UserReviewListItem {
  review_id: string;
  product_id: string;
  product_name: string;
  title: string;
  body: string; // Potentially truncated for display
  overall_rating: number;
  moderation_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

// Password Change Request Payload
interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

// Error Response Structure
interface ErrorResponse {
  error: string;
}

// --- Data Fetching Functions ---

// Fetch User Profile
const fetchUserProfile = async (token: string): Promise<UserProfile> => {
  const { data } = await axios.get<UserProfile>(`${API_BASE_URL}/users/me`, {
    headers: {
      // Use the token passed as an argument
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Fetch User Submitted Reviews
const fetchUserReviews = async (token: string): Promise<UserReviewListItem[]> => {
  const { data } = await axios.get<UserReviewListItem[]>(`${API_BASE_URL}/users/me/reviews`, {
    headers: {
      // Use the token passed as an argument
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// Mutation for Changing Password
const changePassword = async (
  { current_password, new_password }: ChangePasswordPayload,
  token: string
): Promise<{ message: string }> => {
  const { data } = await axios.put<{ message: string }>(`${API_BASE_URL}/users/me`, {
    current_password,
    new_password,
  }, {
    headers: {
      // Use the token passed as an argument
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

// --- Component Implementation ---

const UV_UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Access Zustand store state and actions
  const authState = useAppStore((state) => state.auth);
  const showNotification = useAppStore((state) => state.show_notification);
  const clearAuthState = useAppStore((state) => state.clear_auth_state); // Useful for forced logout on auth errors

  // Local component state for password change form
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordFormError, setPasswordFormError] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authState.is_authenticated || !authState.access_token) {
      navigate('/login');
    }
  }, [authState.is_authenticated, authState.access_token, navigate]);

  // Centralized error handler for API calls
  const handleApiError = useCallback(
    (error: any, defaultMessage: string, actionName: string) => {
      console.error(`Error ${actionName}:`, error);
      const errorMessage = error?.response?.data?.error || error?.message || defaultMessage;
      showNotification(`Failed to ${actionName}: ${errorMessage}`, 'error');
      // Handle session expiration specifically
      if (error?.response?.status === 401) {
        showNotification('Your session has expired. Please log in again.', 'warning');
        clearAuthState();
        navigate('/login');
      }
    },
    [showNotification, clearAuthState, navigate]
  );

  // Fetch User Profile Data
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery<UserProfile, ErrorResponse>({
    queryKey: ['userProfile'],
    queryFn: () => fetchUserProfile(authState.access_token!),
    enabled: authState.is_authenticated && !!authState.access_token, // Ensure token is available
    onError: (err) => handleApiError(err, 'load profile', 'fetch user profile'),
  });

  // Fetch User Submitted Reviews
  const { data: submittedReviews, isLoading: isLoadingReviews } = useQuery<UserReviewListItem[], ErrorResponse>({
    queryKey: ['userSubmittedReviews'],
    queryFn: () => fetchUserReviews(authState.access_token!),
    enabled: authState.is_authenticated && !!authState.access_token,
    onError: (err) => handleApiError(err, 'load reviews', 'fetch submitted reviews'),
  });

  // Mutation for Password Change
  const passwordMutation = useMutation<{
    message: string;
  }, ErrorResponse, ChangePasswordPayload>({
    mutationFn: (payload) => changePassword(payload, authState.access_token!),
    onMutate: () => {
      setIsEditingPassword(true); // Indicate we are processing
      setPasswordFormError('');
    },
    onSuccess: (data) => {
      showNotification(data.message, 'success');
      // Reset form fields and exit editing mode
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setIsEditingPassword(false);
    },
    onError: (err) => {
      handleApiError(err, 'change password', 'change password');
      // Specific handling for password error message to show context
      setPasswordFormError(err?.response?.data?.error || 'Failed to change password. Please try again.');
    },
    onSettled: () => {
      // Ensure UI state is cleaned up if mutation completes (success or error)
      // If not successfully exited via onSuccess, ensure it exits editing state
      if (!isEditingPassword) setIsEditingPassword(false); // Only if not already false from onSuccess
    },
  });

  // Password change validation and mutation trigger
  const handlePasswordChangeClick = useCallback(() => {
    if (newPassword !== confirmNewPassword) {
      setPasswordFormError('New password and confirm password do not match.');
      return;
    }
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordFormError('All password fields are required.');
      return;
    }
    // Basic password complexity check example
    if (newPassword.length < 6) {
      setPasswordFormError('New password must be at least 6 characters long.');
      return;
    }

    setPasswordFormError(''); // Clear previous errors
    passwordMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword,
    });
  }, [currentPassword, newPassword, confirmNewPassword, passwordMutation]);

  const handleCancelPasswordChange = useCallback(() => {
    setIsEditingPassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordFormError('');
  }, []);

  // Handle navigation to product detail page
  const handleNavigateToProduct = useCallback((productId: string) => {
    navigate(`/products/${productId}`);
  }, [navigate]);

  // --- Render Logic ---
  const isLoading = isLoadingProfile || isLoadingReviews;
  const isFetchingError = !!profileError || !!reviewsError;

  if (!authState.is_authenticated || !authState.access_token) {
    // Component should not render if auth state is missing required tokens
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <svg className="animate-spin h-8 w-8 mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V4a12 12 0 00-12 12h4zm2 5.291A7.962 7.962 0 014 12H0a12 12 0 0012 12v-4zm2 4.473C5.852 19.144 2.382 16.339 2.382 12H0a12 12 0 0012 12v-4z"></path>
        </svg>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (isFetchingError) {
    // Error message is displayed via showNotification, this block is fallback.
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500">
        <p className="text-lg font-semibold mb-2">Error Loading Profile</p>
        <p>{profileError?.response?.data?.error || reviewsError?.response?.data?.error || 'An unexpected error occurred.'}</p>
      </div>
    );
  }

  const isPasswordMismatch = newPassword !== confirmNewPassword && newPassword.length > 0 && confirmNewPassword.length > 0;
  const isPasswordTooShort = newPassword.length > 0 && newPassword.length < 6;
  const isFormIncomplete = !currentPassword || !newPassword || !confirmNewPassword;
  const isPasswordFormInvalid = isPasswordMismatch || isPasswordTooShort;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">User Profile</h1>

      <section className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-700">Account Details</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-600">Username</label>
            <p className="mt-1 text-lg text-gray-900">{userProfile?.username ?? 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Email</label>
            <p className="mt-1 text-lg text-gray-900">{userProfile?.email ?? 'N/A'}</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Account Settings</h2>
          {!isEditingPassword ? (
            <button
              onClick={() => setIsEditingPassword(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Change Password
            </button>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">Change Your Password</h3>
              {
                (passwordFormError || isPasswordFormInvalid) && (
                  <p className="text-sm text-red-600">
                    {passwordFormError || (isPasswordMismatch ? 'New password and confirm password do not match.' : 'New password must be at least 6 characters.')}
                  </p>
                )
              }
              <div>
                <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <div className="mt-1">
                  <input
                    id="current-password"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Enter your current password"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="mt-1">
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${ isPasswordTooShort ? 'border-red-500' : ''}`}
                    placeholder="Enter your new password (min 6 characters)"
                  />
                </div>
                {isPasswordTooShort && <p className="text-xs text-red-500 mt-1">Password must be at least 6 characters.</p>}
              </div>
              <div>
                <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirm-new-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${ isPasswordMismatch ? 'border-red-500' : ''}`}
                    placeholder="Confirm your new password"
                  />
                </div>
                 {isPasswordMismatch && <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>}
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handlePasswordChangeClick}
                  disabled={isFormIncomplete || isPasswordFormInvalid || passwordMutation.isPending}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordMutation.isPending ? 'Saving...' : 'Save New Password'}
                </button>
                <button
                  onClick={handleCancelPasswordChange}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-700">My Reviews</h2>
          {/* Optionally, a link to browse all submitted reviews if pagination exists */}
        </div>
        {submittedReviews && submittedReviews.length > 0 ? (
          <div className="space-y-6">
            {submittedReviews.map((review) => (
              <article
                key={review.review_id}
                className="p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3
                    className="text-xl font-semibold text-blue-700 hover:underline cursor-pointer"
                    onClick={() => handleNavigateToProduct(review.product_id)}
                  >
                    {review.product_name}
                  </h3>
                    <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                           ${review.moderation_status === 'approved' ? 'bg-green-100 text-green-800'
                            : review.moderation_status === 'pending' ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'}`}
                    >
                        {review.moderation_status.charAt(0).toUpperCase() + review.moderation_status.slice(1)}
                    </span>
                </div>
                <p className="text-lg font-medium mb-1">{review.title}</p>
                <p className="text-sm text-gray-500 mb-3">
                  Rated: {review.overall_rating}/5 on {new Date(review.created_at).toLocaleDateString()}
                </p>
                <p className="text-gray-700 leading-relaxed">{review.body.substring(0, 200)}{review.body.length > 200 ? '...' : ''}</p>
                <Link
                  to={`/products/${review.product_id}`}
                  className="text-sm text-indigo-600 hover:text-indigo-800 mt-2 inline-block"
                >
                  View Product & Full Review →
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 mt-4">You haven't submitted any reviews yet.</p>
        )}
        {/* Conditional rendering for review loading/error if fetching separately */}
        {isLoadingReviews && submittedReviews?.length === 0 && <p className="text-center text-gray-500 mt-4">Loading your reviews...</p>}
        {(reviewsError && submittedReviews?.length === 0) && (
            <p className="text-center text-red-500 mt-4">
                Could not load reviews. {reviewsError?.response?.data?.error || ''}
            </p>
        )}
      </section>
    </div>
  );
};

export default UV_UserProfile;
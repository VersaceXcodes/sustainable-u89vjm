import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, QueryClient, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosInstance, AxiosError } from 'axios';

// Assuming types are exported from store
// Ensure the apiService instance is properly configured with interceptors and Base URL, ideally in a central place.
// For this example, we'll create a basic API instance and assume auth token is handled.

// --- API Base URL (from environment) ---
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}`;

// --- Global API Service Instance (Recommended setup) ---
// In a real app, this would be in a central setup file, e.g., api.ts or store.ts
// and would handle token refresh, error logging, etc.
const globalApiService: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Configure interceptor to add Authorization header if token is available
globalApiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Example: fetch token from localStorage
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- TypeScript Interfaces for API Responses ---
// Defined in the prompt as part of Redux Store Implementation and OpenAPI spec.
// Ensuring compatibility with UserReviewListItem and BookmarkListItem already assumed.

interface UserActivitySummary {
  reviews_submitted_count: number;
  helpful_votes_received: number;
}

// --- API Query Functions ---

// Hypothetical endpoint for user activity summary
// Based on OpenAPI, /users/me provides basic profile. A dedicated summary endpoint is assumed.
const fetchUserActivitySummary = async (
  api: AxiosInstance
): Promise<UserActivitySummary> => {
  // NOTE: This endpoint '/users/me/summary' is hypothetical based on datamap requirement.
  // If it doesn't exist, this call will fail, or '/users/me' must be adapted.
  const { data } = await api.get<UserActivitySummary>('/users/me/summary');
  return data;
};

const fetchMyReviews = async (api: AxiosInstance): Promise<UserReviewListItem[]> => {
  const { data } = await api.get<UserReviewListItem[]>('/users/me/reviews');
  return data;
};

const fetchMyBookmarkedProducts = async (api: AxiosInstance): Promise<BookmarkListItem[]> => {
  const { data } = await api.get<BookmarkListItem[]>('/users/me/bookmarks');
  return data;
};

// --- API Mutation Functions ---

const unbookmarkProduct = async (api: AxiosInstance, productId: string): Promise<void> => {
  await api.delete(`/products/${productId}/bookmark`);
};

// --- UV_UserActivityDashboard Component ---

const UV_UserActivityDashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // Access the QueryClient instance

  // Access global state and actions via hooks if needed, e.g., for notifications.
  // Assuming useAppStore is a Zustand hook exposing global state and actions.
  // const dispatchNotification = useAppStore((state) => state.dispatch_notification);
  // const clearAuthState = useAppStore((state) => state.clear_auth_state);

  // --- Data Fetching with React Query ---

  const summaryQuery = useQuery<UserActivitySummary, AxiosError>(
    ['userActivitySummary'],
    () => fetchUserActivitySummary(globalApiService),
    {
      enabled: !!localStorage.getItem('authToken'), // Check for token to enable
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes
      onError: (err) => {
        // Generic error notification handled by common error handler or here
        const errMessage = err.response?.data?.error || 'Failed to load activity summary.';
        console.error(errMessage, err);
        // dispatchNotification({ type: 'ERROR', message: errMessage });

        if (err.response?.status === 401) {
           console.error("Unauthorized: Session might be expired.");
           // clearAuthState();
           navigate('/login');
        }
      },
    }
  );

  const reviewsQuery = useQuery<UserReviewListItem[], AxiosError>(
    ['myReviews'],
    () => fetchMyReviews(globalApiService),
    {
      enabled: !!localStorage.getItem('authToken'),
      staleTime: 1000 * 60 * 5,
      onError: (err) => {
        const errMessage = err.response?.data?.error || 'Failed to load your reviews.';
        console.error(errMessage, err);
        // dispatchNotification({ type: 'ERROR', message: errMessage });

        if (err.response?.status === 401) {
          console.error("Unauthorized: Session might be expired.");
          // clearAuthState();
          navigate('/login');
        }
      },
    }
  );

  const bookmarksQuery = useQuery<BookmarkListItem[], AxiosError>(
    ['myBookmarks'],
    () => fetchMyBookmarkedProducts(globalApiService),
    {
      enabled: !!localStorage.getItem('authToken'),
      staleTime: 1000 * 60 * 5,
      onError: (err) => {
        const errMessage = err.response?.data?.error || 'Failed to load bookmarked products.';
        console.error(errMessage, err);
        // dispatchNotification({ type: 'ERROR', message: errMessage });

        if (err.response?.status === 401) {
          console.error("Unauthorized: Session might be expired.");
          // clearAuthState();
          navigate('/login');
        }
      },
    }
  );

  // Mutation for Unbookmarking a Product
  const unbookmarkMutation = useMutation<void, AxiosError, string>(
    (productId) => unbookmarkProduct(globalApiService, productId),
    {
      onSuccess: (data, productId) => {
        // Invalidate the cache for bookmarks to refetch the list
        queryClient.invalidateQueries(['myBookmarks']);
        // dispatchNotification({ type: 'SUCCESS', message: 'Product unbookmarked successfully.' });
        console.log('Product unbookmarked successfully.');
      },
      onError: (err, productId) => {
        const errMessage = err.response?.data?.error || `Failed to unbookmark product ${productId}.`;
        console.error(errMessage, err);
        // dispatchNotification({ type: 'ERROR', message: errMessage });
      },
    }
  );

  // Derive loading and error states from queries
  const isLoading = summaryQuery.isLoading || reviewsQuery.isLoading || bookmarksQuery.isLoading;

  // Determine a single error message if any query failed
  let errorMessage: string | null = null;
  if (summaryQuery.isError && summaryQuery.error?.response?.data?.error) {
    errorMessage = summaryQuery.error.response.data.error;
  } else if (reviewsQuery.isError && reviewsQuery.error?.response?.data?.error) {
    errorMessage = reviewsQuery.error.response.data.error;
  } else if (bookmarksQuery.isError && bookmarksQuery.error?.response?.data?.error) {
    errorMessage = bookmarksQuery.error.response.data.error;
  } else if (summaryQuery.isError || reviewsQuery.isError || bookmarksQuery.isError) {
    // Fallback for errors without a specific message in response body
    errorMessage = 'An unexpected error occurred.';
  }

  // --- Render Logic ---

  // Check authentication status using token from localStorage as a proxy for global auth state
  const isAuthenticated = !!localStorage.getItem('authToken');

  if (!isAuthenticated) {
    return (
      <div className="text-center py-10">
        <p className="text-lg text-gray-700 mb-4">You need to be logged in to view your activity dashboard.</p>
        <Link to="/login" className="text-blue-600 hover:underline">Go to Login</Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-gray-700">Loading your activity...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="text-center py-20 text-red-600">
        <p className="text-lg mb-4">{errorMessage}</p>
        <p>Please try again later or contact support.</p>
      </div>
    );
  }

  // Use query data directly
  const userActivitySummary = summaryQuery.data || { reviews_submitted_count: 0, helpful_votes_received: 0 };
  const recentReviews = reviewsQuery.data || [];
  const bookmarkedProducts = bookmarksQuery.data || [];

  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Your Activity Dashboard</h1>

      {/* User Activity Summary Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8 border border-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Your Contributions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border border-gray-300 rounded-md bg-gray-50">
            <p className="text-sm font-medium text-gray-600 uppercase">Reviews Submitted</p>
            <p className="text-4xl font-extrabold text-blue-600 mt-2">{userActivitySummary.reviews_submitted_count}</p>
          </div>
          <div className="p-4 border border-gray-300 rounded-md bg-gray-50">
            <p className="text-sm font-medium text-gray-600 uppercase">Helpful Votes Received</p>
            <p className="text-4xl font-extrabold text-green-600 mt-2">{userActivitySummary.helpful_votes_received}</p>
          </div>
        </div>
      </div>

      {/* Recent Reviews Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8 border border-gray-200">
        <h2 className="text-2xl font-semibold mb-5 text-gray-700 flex justify-between items-center">
          Your Recent Reviews
          {recentReviews.length > 0 && (
            <Link to="/profile" className="text-sm text-blue-500 hover:underline">View All Reviews</Link>
          )}
        </h2>
        {recentReviews.length === 0 ? (
          <p className="text-gray-600 py-10 text-center">You haven't submitted any reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {recentReviews.map((review) => (
              <div key={review.review_id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-center mb-2">
                  <Link
                    to={`/products/${review.product_id}`} // Link to Product Detail Page
                    className="text-lg font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    {review.product_name || 'Unnamed Product'}
                  </Link>
                  <div className="flex items-center">
                    <span className="text-yellow-500 font-bold mr-1">★</span>
                    <span className="text-gray-700 font-medium">{review.overall_rating?.toFixed(1)}</span>
                  </div>
                </div>
                <h3 className="text-md font-semibold text-gray-800 mb-1">{review.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {review.body || 'No description provided.'}
                </p>
                {/* Optional: Display moderation status */}
                {/* <p className={`text-xs font-medium ${review.moderation_status === 'approved' ? 'text-green-500' : review.moderation_status === 'pending' ? 'text-yellow-500' : 'text-red-500'}`}>
                  Status: {review.moderation_status.charAt(0).toUpperCase() + review.moderation_status.slice(1)}
                </p> */}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bookmarked Products Section */}
      <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-semibold mb-5 text-gray-700 flex justify-between items-center">
          Your Bookmarked Products
           {bookmarkedProducts.length > 0 && (
            <Link to="/profile" className="text-sm text-blue-500 hover:underline">Manage Bookmarks</Link>
           )}
        </h2>
        {bookmarkedProducts.length === 0 ? (
          <p className="text-gray-600 py-10 text-center">You haven't bookmarked any products yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarkedProducts.map((product) => (
              <div key={product.product_id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white relative">
                <button
                  onClick={() => unbookmarkMutation.mutate(product.product_id)}
                  aria-label={`Unbookmark ${product.name}`}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors duration-200"
                  disabled={unbookmarkMutation.isLoading}
                >
                  {/* Heart icon or similar */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 7.107 12.172 5.17a4 4 0 115.656 5.656L10 17.107 3.172 10.828a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </button>

                <Link to={`/products/${product.product_id}`} className="cursor-pointer">
                  <img
                    src={product.primary_image_url || 'https://picsum.photos/seed/placeholder/240/240'} // Fallback image
                    alt={product.name}
                    className="w-full h-40 object-contain rounded-md mb-3"
                    loading="lazy" // Lazy load images
                  />
                  <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-1">{product.brand_name}</p>
                  <p className="text-sm text-gray-500 mb-2 capitalize">{product.category_name}</p>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-500 font-bold">
                        ★ {(product.overall_score !== null && !isNaN(product.overall_score)) ? product.overall_score.toFixed(1) : 'N/A'}
                      </span>
                      <span className="text-xs text-gray-500">/5</span>
                    </div>
                    {/* Basic attribute icons could be shown here if needed, but not explicitly required by datamap */}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default UV_UserActivityDashboard;
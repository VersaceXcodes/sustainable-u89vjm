import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';

// Import Zustand store for global state management
import { useAppStore } from '@/store/main';

// --- API Base URL Constant ---
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}`;

// --- API Service Instance ---
// Assuming apiService is already created and configured in store/main.ts or a shared utility file
// For demonstration, let's assume it's accessible or re-create it here if needed.
// If `apiService` is globally available or imported from a common utility:
// import apiService from '@/services/apiService';
// Otherwise, create it:
const apiService = axios.create({
  baseURL: API_BASE_URL,
});

// --- Type Definitions (based on backend specification provided) ---

// Reuse types from global state or define them here if not exported
interface Category {
  category_id: string;
  name: string;
  description?: string | null;
}

interface Attribute {
  attribute_id: string;
  name: string;
  attribute_type: 'sustainability' | 'ethical' | 'durability';
}

interface Review {
  review_id: string;
  user_id: string;
  username: string;
  title: string;
  body: string;
  overall_rating: number;
  sustainability_rating: number | null;
  ethical_rating: number | null;
  durability_rating: number | null;
  helpful_votes: number;
  created_at: string;
  photos: string[];
}

interface ProductImage {
  url: string;
  isPrimary: boolean;
}

interface ProductScores {
  overall: number | null;
  sustainability: number | null;
  ethical: number | null;
  durability: number | null;
}

interface ProductDetailType {
  product_id: string;
  name: string;
  brand_name: string;
  description: string;
  images: ProductImage[];
  category: Category;
  scores: ProductScores;
  attributes: Attribute[];
  reviews: Review[];
}

// Type for voting state
interface ReviewVoteStates {
  [review_id: string]: { voted_helpful: boolean; isVoting?: boolean };
}

// --- API Fetching Functions ---

// Fetch Product Details
const fetchProductDetails = async (productId: string): Promise<ProductDetailType> => {
  const { data } = await apiService.get<ProductDetailType>(`/products/${productId}`);
  return data;
};

// Fetch Bookmark Status - Endpoint not available in spec, assuming a robust check or alternative.
// According to spec, `/users/me/bookmarks` returns a list. We need to check if the product is in that list.
// A more efficient approach would be a dedicated endpoint, but adhering to spec:
const fetchBookmarkStatus = async (productId: string, accessToken: string): Promise<boolean> => {
  try {
    const { data } = await apiService.get<{ product_id: string }[]>(`/users/me/bookmarks`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return data.some(bookmark => bookmark.product_id === productId);
  } catch (error) {
    console.error('Error fetching bookmark status:', error);
    // Handle specific errors if necessary, but return false to avoid UI issues
    return false;
  }
};

// Bookmark/Unbookmark Product
const toggleProductBookmark = async (productId: string, isCurrentlyBookmarked: boolean, accessToken: string) => {
  const method = isCurrentlyBookmarked ? 'DELETE' : 'POST';
  const url = `${API_BASE_URL}/products/${productId}/bookmark`;

  await apiService({
    method,
    url,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

// Vote on a Review
const voteOnReview = async ({ reviewId, voteType }: { reviewId: string; voteType: 'helpful' }, accessToken: string) => {
  const { data } = await apiService.post<{ review_id: string; helpful_votes: number }>(
    `/reviews/${reviewId}/vote`,
    { vote_type: voteType },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return data;
};

// --- Component Implementation ---

const UV_ProductDetail: React.FC = () => {
  const { product_id } = useParams<{ product_id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Access global state from Zustand store
  const { auth, show_notification } = useAppStore((state) => ({
      auth: state.auth,
      show_notification: state.show_notification,
  }));

  // --- Local State ---
  const [is_bookmarked, setIsBookmarked] = useState<boolean>(false);
  const [review_vote_states, setReviewVoteStates] = useState<ReviewVoteStates>({});

  // --- Data Fetching with React Query ---

  // Query for Product Details
  const {
    data: product_details,
    isLoading: is_loading_details,
    isError: is_error_fetching_details,
    error: error_fetching_details,
  } = useQuery<ProductDetailType, AxiosError>({
    queryKey: ['productDetails', product_id],
    queryFn: () => fetchProductDetails(product_id!),
    enabled: !!product_id, // Only run query if product_id is available
    onError: (err) => {
        console.error("Error fetching product details:", err);
        show_notification(`Failed to load product details: ${err.response?.data?.error || err.message}`, 'error');
    }
  });

  // Query for Bookmark Status (only if user is authenticated)
  // Fetch bookmark status by checking the list of bookmarked products
  const {
    data: isProductBookmarked,
    isLoading: is_bookmark_loading,
    refetch: refetchBookmarkStatus
  } = useQuery<boolean, AxiosError>({
      queryKey: ['userSpecificBookmarkStatus', product_id, auth.user_id], // Include user_id in key
      queryFn: () => auth.access_token ? fetchBookmarkStatus(product_id!, auth.access_token) : false,
      enabled: !!product_id && auth.is_authenticated && !!auth.access_token, // Ensure token is present
      onSuccess: (data) => {
          setIsBookmarked(data);
      },
      onError: (err) => {
          console.error("Error fetching bookmark status:", err);
          // Optionally notify user, but often not critical for bookmark status fetch errors
      },
      staleTime: 5 * 60 * 1000, // Consider bookmark status stale after 5 minutes
      gcTime: 10 * 60 * 1000, // Remove from cache after 10 minutes of inactivity
  });

  // Initialize reviewVoteStates when product_details are loaded
   useEffect(() => {
        if (product_details?.reviews) {
            const initialVoteStates: ReviewVoteStates = {};
            product_details.reviews.forEach(review => {
                // Assume initial state is not voted for any review
                 initialVoteStates[review.review_id] = { voted_helpful: false, isVoting: false };
                 // NOTE: ideally, we'd fetch user's vote status per review if API supports it,
                 // or pre-fill based on user's votes after fetching reviews.
                 // For simplicity here, we assume no votes initially.
            });
            setReviewVoteStates(initialVoteStates);
        }
    }, [product_id, product_details?.reviews]);

  // --- Mutations ---

  // Bookmark Toggle Mutation
  const bookmarkMutation = useMutation<void, AxiosError, { isCurrentlyBookmarked: boolean }>({
    mutationFn: ({isCurrentlyBookmarked}) => toggleProductBookmark(product_id!, isCurrentlyBookmarked, auth.access_token!),
    onSuccess: (_, { isCurrentlyBookmarked }) => {
      const newStatus = !isCurrentlyBookmarked;
      setIsBookmarked(newStatus);
      show_notification(
        `Product ${newStatus ? 'added to bookmarks' : 'removed from bookmarks'}.`,
        'success'
      );
      // Invalidate bookmark status query to refetch it
      queryClient.invalidateQueries({ queryKey: ['userSpecificBookmarkStatus', product_id, auth.user_id] });
      // If there's a general user bookmarks list, invalidate that too.
      queryClient.invalidateQueries(['userBookmarks']); // Example key for user bookmarks list
    },
    onError: (err) => {
      console.error("Error toggling bookmark:", err);
      show_notification(`Failed to update bookmark: ${err.response?.data?.error || err.message}`, 'error');
    },
  });

  // Vote Mutation
  const voteMutation = useMutation<
    { review_id: string; helpful_votes: number },
    AxiosError,
    { reviewId: string; voteType: 'helpful' }
  >({
    mutationFn: ({ reviewId, voteType }) => voteOnReview({ reviewId, voteType }, auth.access_token!),
    onSuccess: (data, variables) => {
      // Update local vote state for the specific review
      setReviewVoteStates(prevStates => ({
        ...prevStates,
        [variables.reviewId]: { ...prevStates[variables.reviewId], voted_helpful: true, isVoting: false },
      }));

      // Update the displayed helpful_votes count directly in product_details cache
      queryClient.setQueryData<ProductDetailType>(
        ['productDetails', product_id],
        (oldData) => {
            if (!oldData) return oldData;
            const updatedReviews = oldData.reviews.map(review =>
                review.review_id === data.review_id
                ? { ...review, helpful_votes: data.helpful_votes }
                : review
            );
            return { ...oldData, reviews: updatedReviews };
        }
      );
       // Show success notification if needed, but often just updating the count is enough UX
      // show_notification('Your vote has been registered!', 'success');
    },
    onError: (err, variables) => {
      console.error("Error voting on review:", err);
      show_notification(`Failed to cast vote: ${err.response?.data?.error || err.message}`, 'error');
       // Reset vote state if error occurs
        setReviewVoteStates(prevStates => ({
            ...prevStates,
            [variables.reviewId]: { ...prevStates[variables.reviewId], isVoting: false },
        }));
    },
  });

  // --- Handlers ---
  const handleBookmarkClick = useCallback(() => {
    if (!auth.is_authenticated || !auth.access_token) {
      show_notification('Please log in to manage bookmarks.', 'warning');
      navigate('/login'); // Redirect to login page
      return;
    }
    bookmarkMutation.mutate({ isCurrentlyBookmarked: is_bookmarked });
  }, [is_bookmarked, auth.is_authenticated, auth.access_token, navigate, show_notification, bookmarkMutation]);

  const handleReviewVoteClick = useCallback((reviewId: string) => {
    if (!auth.is_authenticated || !auth.access_token) {
      show_notification('Please log in to vote on reviews.', 'warning');
      navigate('/login');
      return;
    }

    const currentVoteState = review_vote_states[reviewId];

    // Prevent voting if already voted or if a vote is currently in progress for this review
    if (currentVoteState?.voted_helpful || currentVoteState?.isVoting) {
        return;
    }

    // Optimistically update the local state to reflect voting in progress
    setReviewVoteStates(prevStates => ({
        ...prevStates,
        [reviewId]: { ...prevStates[reviewId], isVoting: true },
    }));

    // Call the mutation
    voteMutation.mutate({ reviewId, voteType: 'helpful' });
  }, [auth.is_authenticated, auth.access_token, navigate, show_notification, voteMutation, review_vote_states]);

  const handleBrandClick = useCallback((brandName: string) => {
    navigate(`/products?brand_name=${encodeURIComponent(brandName)}`);
  }, [navigate]);

  const handleCategoryClick = useCallback((categoryId: string, categoryName: string) => {
    navigate(`/categories/${categoryId}`);
  }, [navigate]);

  // --- Helper to navigate to review submission ---
  const navigateToReviewSubmission = useCallback(() => {
    if (!auth.is_authenticated || !auth.access_token) {
      show_notification('Please log in to write a review.', 'warning');
      navigate('/login');
      return;
    }
    navigate(`/products/${product_id}/reviews`);
  }, [auth.is_authenticated, auth.access_token, navigate, show_notification, product_id]);

  // --- Render Helpers ---

  const renderRatingStars = (rating: number | null): JSX.Element => {
    if (rating === null) return <span className="text-gray-400">-</span>;
    const stars = [];
    const wholeStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - wholeStars - (halfStar ? 1 : 0);

    for (let i = 1; i <= wholeStars; i++) {
      stars.push(
        <svg
          key={i}
          className={`w-5 h-5 inline mr-1 fill-current text-yellow-400`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.431a1 1 0 00-.364.894l1.07 3.292c.3.921-.755 1.688-1.542 1.13l-2.8-2.432a1 1 0 00-1.076 0l-2.8 2.432c-.787.557-1.843-.211-1.542-1.131l1.07-3.292a1 1 0 00-.364-.894l-2.8-2.431c-.783-.57.172-1.81.588-1.81h3.461a1 1 0 00.95-.69l1.07-3.292z" />
        </svg>
      );
    }
    if (halfStar) {
        stars.push(
            <svg
                key='half'
                className={`w-5 h-5 inline mr-1 fill-current text-yellow-400`} // Partial fill for half star
                viewBox="0 0 20 20"
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.431a1 1 0 00-.364.894l1.07 3.292c.3.921-.755 1.688-1.542 1.13l-2.8-2.432a1 1 0 00-1.076 0l-2.8 2.432c-.787.557-1.843-.211-1.542-1.131l1.07-3.292a1 1 0 00-.364-.894l-2.8-2.431c-.783-.57.172-1.81.588-1.81h3.461a1 1 0 00.95-.69l1.07-3.292z" />
            </svg>
        )
    }
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg
          key={'empty' + i}
          className={`w-5 h-5 inline mr-1 fill-current text-gray-300`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.431a1 1 0 00-.364.894l1.07 3.292c.3.921-.755 1.688-1.542 1.13l-2.8-2.432a1 1 0 00-1.076 0l-2.8 2.432c-.787.557-1.843-.211-1.542-1.131l1.07-3.292a1 1 0 00-.364-.894l-2.8-2.431c-.783-.57.172-1.81.588-1.81h3.461a1 1 0 00.95-.69l1.07-3.292z" />
        </svg>
      );
    }
    return <>{stars} <span className="ml-1 font-semibold text-lg">{rating.toFixed(1)}</span></>;
  };

  const renderAttributeBadges = () => {
    if (!product_details?.attributes || product_details.attributes.length === 0) {
      return <p className="text-gray-500 italic">No specific attributes listed.</p>;
    }
    return (
      <div className="flex flex-wrap gap-2">
        {product_details.attributes.map((attr) => (
          <span key={attr.attribute_id} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            attr.attribute_type === 'sustainability' ? 'bg-green-100 text-green-800' :
            attr.attribute_type === 'ethical' ? 'bg-blue-100 text-blue-800' :
            attr.attribute_type === 'durability' ? 'bg-orange-100 text-orange-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {attr.name}
          </span>
        ))}
      </div>
    );
  };

  // --- Main Render Block ---
  return (
    <div className="container mx-auto p-4">
      {is_loading_details && (
        <div className="flex justify-center items-center h-screen">
          <p className="text-lg text-gray-500 animate-pulse">Loading Product Details...</p>
        </div>
      )}

      {is_error_fetching_details && (
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Product</h2>
          <p className="text-gray-600 mb-4">
            Could not load product details. Please try again later.
          </p>
          <p className="text-sm text-gray-500">
             {(error_fetching_details as AxiosError)?.response?.data?.error || error_fetching_details?.message || 'Unknown error'}
          </p>
          <button
            onClick={() => navigate(-1)} // Go back
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go Back
          </button>
        </div>
      )}

      {!is_loading_details && !is_error_fetching_details && product_details && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Main Product Info Section */}
          <div className="md:flex">
            {/* Image Gallery */}
            <div className="md:w-1/3 p-6">
              {product_details.images && product_details.images.length > 0 ? (
                <div className="relative group">
                  <img
                    src={product_details.images.find(img => img.isPrimary)?.url || product_details.images[0].url}
                    alt={product_details.name}
                    className="w-full h-64 object-cover rounded-lg shadow-inner transition-transform duration-300 ease-in-out group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => { // Basic error handling for image loading
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; // Prevent infinite loop
                      target.src = '/placeholder-image.png'; // Fallback image
                    }}
                  />
                  {/* Basic interactive zoom effect on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">Hover to zoom</span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">No Image Available</span>
                </div>
              )}
            </div>

            {/* Product Details Text */}
            <div className="md:w-2/3 p-6 flex flex-col justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{product_details.name}</h1>
                <p className="text-xl text-gray-600 mb-4">
                  by{' '}
                  <button
                    onClick={() => handleBrandClick(product_details.brand_name)}
                    className="text-blue-600 hover:underline font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  >
                    {product_details.brand_name}
                  </button>{' '}
                  in{' '}
                  <button
                    onClick={() => handleCategoryClick(product_details.category.category_id, product_details.category.name)}
                    className="text-green-600 hover:underline font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                  >
                    {product_details.category.name}
                  </button>
                </p>
                <p className="text-gray-700 mb-6">{product_details.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={navigateToReviewSubmission}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
                >
                  Write a Review
                </button>
                <button
                  onClick={handleBookmarkClick}
                  disabled={is_bookmark_loading || bookmarkMutation.isPending}
                  className={`w-full sm:w-auto px-6 py-3 rounded-md shadow transition duration-150 ease-in-out ${
                    is_bookmarked
                      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400'
                      : 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500'
                  } ${is_bookmark_loading || bookmarkMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {bookmarkMutation.isPending ? 'Saving...' : (is_bookmarked ? 'Bookmarked' : 'Bookmark')}
                </button>
              </div>
            </div>
          </div>

          {/* Scores and Attributes Section */}
          <div className="p-6 border-t">
            <h2 className="text-2xl font-bold text-gray-800 mb-5">Scores & Attributes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Score Card - Overall */}
              <div className="p-5 border rounded-lg shadow-sm bg-gray-50">
                <p className="text-lg font-semibold text-gray-700 mb-2">Overall Score</p>
                <p className="text-4xl font-bold text-blue-600">
                    {renderRatingStars(product_details.scores.overall)}
                </p>
              </div>

                {/* Score Card - Sustainability */}
              <div className="p-5 border rounded-lg shadow-sm bg-green-50">
                <p className="text-lg font-semibold text-green-700 mb-2">Sustainability</p>
                <p className="text-4xl font-bold text-green-600">
                    {renderRatingStars(product_details.scores.sustainability)}
                </p>
                <p className="text-sm text-gray-500 mt-2">Factors: Materials, Energy, Packaging</p>
              </div>

                 {/* Score Card - Ethical */}
               <div className="p-5 border rounded-lg shadow-sm bg-indigo-50">
                <p className="text-lg font-semibold text-indigo-700 mb-2">Ethical</p>
                <p className="text-4xl font-bold text-indigo-600">
                    {renderRatingStars(product_details.scores.ethical)}
                </p>
                 <p className="text-sm text-gray-500 mt-2">Factors: Labor, Supply Chain, Certs</p>
              </div>

                {/* Score Card - Durability */}
               <div className="p-5 border rounded-lg shadow-sm bg-orange-50">
                <p className="text-lg font-semibold text-orange-700 mb-2">Durability</p>
                <p className="text-4xl font-bold text-orange-600">
                    {renderRatingStars(product_details.scores.durability)}
                </p>
                 <p className="text-sm text-gray-500 mt-2">Factors: Build, Lifespan, Repair</p>
              </div>

                {/* Attributes */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 p-5 border rounded-lg shadow-sm bg-gray-50">
                    <p className="text-lg font-semibold text-gray-700 mb-3">Key Attributes</p>
                    {renderAttributeBadges()}
                </div>
            </div>
          </div>

          {/* User Reviews Section */}
          <div className="p-6 border-t">
            <h2 className="text-2xl font-bold text-gray-800 mb-5">User Reviews</h2>
            {product_details.reviews && product_details.reviews.length > 0 ? (
              <div className="space-y-6">
                {product_details.reviews.map((review) => (
                  <div key={review.review_id} className="bg-gray-50 p-5 border rounded-lg shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">{review.title}</h4>
                        <p className="text-sm text-gray-500">
                          Reviewed by{' '}
                          <span className="font-medium">{review.username}</span> on{' '}
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                       <div className="flex items-center text-lg font-bold text-yellow-500">
                           {renderRatingStars(review.overall_rating)}
                       </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-4">{review.body}</p>

                     {/* Review Photos */}
                    {review.photos && review.photos.length > 0 && (
                        <div className="flex space-x-3 overflow-x-auto pb-3">
                            {review.photos.map((photoUrl, index) => (
                                <div key={index} className="relative group">
                                    <img
                                        src={photoUrl}
                                        alt={`Review photo ${index + 1}`}
                                        className="w-24 h-24 object-cover rounded-md shadow-sm cursor-pointer transition-transform duration-200 ease-in-out hover:scale-105"
                                        loading="lazy"
                                        onClick={() => window.open(photoUrl, '_blank')} // Open photo in new tab
                                        onError={(e) => { /* Handle image loading errors for review photos */ 
                                          const target = e.target as HTMLImageElement;
                                          target.onerror = null;
                                          target.src = '/placeholder-review-photo.png'; // Fallback
                                        }}
                                    />
                                     <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-md flex items-center justify-center">
                                        <span className="text-white text-xs font-semibold">Click to view</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleReviewVoteClick(review.review_id)}
                        disabled={review_vote_states[review.review_id]?.voted_helpful || review_vote_states[review.review_id]?.isVoting}
                        className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition duration-150 ease-in-out
                          ${review_vote_states[review.review_id]?.voted_helpful ? 'bg-blue-100 text-blue-700 cursor-default' : (review_vote_states[review.review_id]?.isVoting ? 'bg-gray-100 text-gray-500' : 'bg-white text-gray-700 hover:bg-gray-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2')
                          ${review_vote_states[review.review_id]?.isVoting ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <svg className={`w-5 h-5 mr-2 ${review_vote_states[review.review_id]?.voted_helpful ? 'text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        Helpful ({review.helpful_votes})
                      </button>
                       {/* Can add Edit/Delete review buttons here if user owns the review */}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-lg text-gray-500">No reviews available for this product yet.</p>
                <p className="text-md text-gray-500 mt-2">
                  Be the first to share your experience!
                </p>
                <button
                    onClick={navigateToReviewSubmission}
                    className="mt-6 px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out"
                >
                  Submit Your Review
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UV_ProductDetail;
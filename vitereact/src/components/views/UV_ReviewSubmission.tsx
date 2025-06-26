import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';

// --- Import Global State ---
import { useAppStore } from '@/store/main';

// --- Define API Base URL
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}`;

// --- Types ---

// Interface for individual uploaded photo object in state
interface UploadedPhoto {
  url: string;
}

// Interface for the structure of returned review photo from upload API
interface PhotoUploadResponse {
  photo_url: string;
}

// Interface for the product data needed for the form title
interface ProductInfoForReview {
  product_id: string;
  name: string;
}

// Interface for submission feedback
interface SubmissionFeedback {
  message: string | null;
  type: 'info' | 'success' | 'error';
}

// Interface for general validation errors object
interface ValidationErrors {
  [fieldName: string]: string;
}

// Interface for the state to hold File objects for upload along with their URLs for preview
interface UploadedFileWithUrl {
  file: File;
  url: string;
}

// Type Definition for Review Submission Payload
interface ReviewSubmissionPayload {
  title: string;
  body: string;
  overall_rating: number;
  sustainability_rating: number | null;
  ethical_rating: number | null;
  durability_rating: number | null;
  photos: UploadedFileWithUrl[]; // Array of {file: File, url: string}
  confirmation_checkbox: boolean;
}

// --- API Fetching Functions ---

/**
 * Fetches basic product information (name) for the review form.
 */
const fetchProductInfoForReview = async (productId: string, accessToken: string | null): Promise<ProductInfoForReview> => {
  const { data } = await axios.get<ProductInfoForReview>(
    `${API_BASE_URL}/api/products/${productId}`,
    {
      headers: { Authorization: accessToken ? `Bearer ${accessToken}` : undefined },
    }
  );
  return data;
};

/**
 * Handles photo upload to the backend.
 */
const uploadReviewPhoto = async (args: { file: File; accessToken: string | null }): Promise<UploadedPhoto> => {
  const { file, accessToken } = args;
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await axios.post<PhotoUploadResponse>(
    `${API_BASE_URL}/api/upload/photo`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
      },
    }
  );
  return { url: data.photo_url };
};

/**
 * Submits the review data to the backend.
 */
const submitNewReview = async (args: {
  productId: string;
  reviewData: ReviewSubmissionPayload;
  accessToken: string | null;
}) => {
  const { productId, reviewData, accessToken } = args;

  const formData = new FormData();
  formData.append('title', reviewData.title);
  formData.append('body', reviewData.body);
  formData.append('overall_rating', String(reviewData.overall_rating));

  if (reviewData.sustainability_rating !== null) {
    formData.append('sustainability_rating', String(reviewData.sustainability_rating));
  }
  if (reviewData.ethical_rating !== null) {
    formData.append('ethical_rating', String(reviewData.ethical_rating));
  }
  if (reviewData.durability_rating !== null) {
    formData.append('durability_rating', String(reviewData.durability_rating));
  }

  // Append actual File objects from uploaded_photos_state
  reviewData.photos.forEach((photo: UploadedFileWithUrl) => {
    formData.append('photos', photo.file); // Append actual File objects
  });

  // Ensure confirmation checkbox is checked and other required fields are validated before network call
  if (!reviewData.confirmation_checkbox) {
    // This error case should be ideally caught by client-side validation before mutation call.
    // Returning a rejected promise with a structure mimicking Axios error for consistent onError handling.
    return Promise.reject({ response: { data: { error: 'You must confirm you have personally used this product.' } }, status: 400 });
  }

  const { data } = await axios.post<any>(
    `${API_BASE_URL}/api/products/${productId}/reviews`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
      },
    }
  );
  return data; // Expecting { review_id: string, message: string }
};

// --- Reusable Components (to be designed/imported if available, otherwise inline simple versions) ---

// Mock Rating component: A simple representation for stars
const StarRating: React.FC<{
  rating: number | null;
  maxRating?: number;
  onRatingChange: (ratingValue: number) => void;
  label?: React.ReactNode; // Allow ReactNode for labels with spans
}> = ({ rating, maxRating = 5, onRatingChange, label }) => {
  const stars = Array.from({ length: maxRating }, (_, i) => i + 1);

  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="flex items-center">
        {stars.map((star) => (
          <svg
            key={star}
            className={`w-6 h-6 cursor-pointer ${
              star <= (rating ?? 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
            onClick={() => onRatingChange(star)}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 17.012L19.608 21.18L17.936 12.735L24 7.28951L15.552 6.49049L12 0L8.448 6.49049L0 7.28951L6.064 12.735L4.392 21.18L12 17.012Z" />
          </svg>
        ))}
      </div>
      {rating !== null && rating > 0 && (
        <p className="text-sm text-gray-500 mt-1">
          {rating} / {maxRating}
        </p>
      )}
    </div>
  );
};

// --- ReviewSubmission Component ---

const UV_ReviewSubmission: React.FC = () => {
  const navigate = useNavigate();
  const { product_id } = useParams<{ product_id: string }>();
  const queryClient = useQueryClient();

  // Global state access
  const isAuthenticated = useAppStore((state) => state.auth.is_authenticated);
  const accessToken = useAppStore((state) => state.auth.access_token);
  const showNotification = useAppStore((state) => state.show_notification);
  const clear_auth_state = useAppStore((state) => state.clear_auth_state); // For potential auth errors

  // Local State
  const [product_name, set_product_name] = useState<string | null>(null);
  const [review_title, set_review_title] = useState<string>("" );
  const [review_body, set_review_body] = useState<string>("");
  const [overall_rating, set_overall_rating] = useState<number | null>(null);
  const [sustainability_rating, set_sustainability_rating] = useState<number | null>(null);
  const [ethical_rating, set_ethical_rating] = useState<number | null>(null);
  const [durability_rating, set_durability_rating] = useState<number | null>(null);
  const [confirmation_checkbox, set_confirmation_checkbox] = useState<boolean>(false);
  // Stores File objects along with their URLs for preview
  const [uploaded_photos_state, set_uploaded_photos_state] = useState<UploadedFileWithUrl[]>([]); 
  const [preview_photo_urls, set_preview_photo_urls] = useState<string[]>([]); // Stores URLs for preview
  const [is_submitting, set_is_submitting] = useState<boolean>(false);
  const [validation_errors, set_validation_errors] = useState<ValidationErrors>({});
  const [submission_feedback, set_submission_feedback] = useState<SubmissionFeedback>({ message: null, type: 'info' });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      showNotification("Please log in to submit a review.", 'warning');
      navigate('/login');
    }
  }, [isAuthenticated, navigate, showNotification]);

  // Fetch product info for form title
  const {
    isLoading: isProductInfoLoading,
    error: productInfoError,
    isError: isProductInfoError,
  } = useQuery({
    queryKey: ['productInfoForReview', product_id],
    queryFn: () => fetchProductInfoForReview(product_id!, accessToken),
    enabled: !!product_id && isAuthenticated, // Only run if product_id exists and user is authenticated
    onSuccess: (data) => {
      set_product_name(data.name);
    },
    onError: (err: AxiosError<{ error: string }> | Error) => {
      console.error("Error fetching product info:", err);
      let errorMessage = 'Failed to load product details.';
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        errorMessage = err.response.data.error;
        // Handle auth errors specifically
        if (err.response?.status === 401 || err.response?.status === 403) {
          clear_auth_state();
          navigate('/login');
          return; // Stop further processing if auth failed
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      set_submission_feedback({ message: `Error: ${errorMessage}`, type: 'error' });
      // If product not found, ensure product_name is null
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        set_product_name(null);
      }
    },
  });

  // Mutation for photo upload
  const photoUploadMutation = useMutation<
    UploadedPhoto,
    AxiosError<{ error: string }> | Error,
    File
  >({
    mutationFn: (file) => uploadReviewPhoto({ file: file, accessToken: accessToken }),
    onSuccess: (data: UploadedPhoto, file: File) => {
      // Add the uploaded file to the state, keeping track of the original File object
      // and its fetched URL for preview.
      set_uploaded_photos_state(prev => [...prev, { file: file, url: data.url }]); // Store both File and URL
      set_validation_errors(prev => ({ ...prev, photos: '' })); // Clear photo validation error if any
      showNotification("Photo uploaded successfully", 'success');
    },
    onError: (err: AxiosError<{ error: string }> | Error) => {
      console.error("Photo upload failed:", err);
      let errorMessage = 'Failed to upload photo.';
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        errorMessage = err.response.data.error;
        // If auth failed during upload, redirect to login
        if (err.response?.status === 401 || err.response?.status === 403) {
          clear_auth_state();
          navigate('/login');
          return;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      set_submission_feedback({ message: `Photo upload failed: ${errorMessage}`, type: 'error' });
    },
  });

  // Mutation for submitting the review
  const reviewSubmissionMutation = useMutation<any, AxiosError<{ error: string; errors?: ValidationErrors }> | Error, {
    productId: string;
    reviewData: ReviewSubmissionPayload;
  }>({
    mutationFn: ({ productId, reviewData }) => submitNewReview({ productId, reviewData, accessToken }),
    onMutate: () => {
      set_is_submitting(true);
      set_validation_errors({}); // Clear previous errors
      set_submission_feedback({ message: null, type: 'info' }); // Clear previous feedback
    },
    onSuccess: (data: { review_id: string; message: string }) => {
      set_is_submitting(false);
      set_submission_feedback({ message: data.message || 'Review submitted successfully and is pending moderation.', type: 'success' });
      // Optionally clear form and reset state, or redirect.
      // For now, display message and let user decide actions.
      queryClient.invalidateQueries({ queryKey: ['productDetails', product_id] }); // Invalidate product details cache if reviews are part of it
      queryClient.invalidateQueries({ queryKey: ['myReviews'] }); // Invalidate user's reviews list if fetched elsewhere

      // Simple form reset after successful submission
      set_review_title("");
      set_review_body("");
      set_overall_rating(null);
      set_sustainability_rating(null);
      set_ethical_rating(null);
      set_durability_rating(null);
      set_confirmation_checkbox(false);
      set_uploaded_photos_state([]); // Clear uploaded files
      set_preview_photo_urls([]);

      // Optionally navigate away after a short delay
      // setTimeout(() => {
      //   navigate(`/products/${product_id}`); // Go back to product detail after success
      // }, 3000);
    },
    onError: (err: AxiosError<{ error: string; errors?: ValidationErrors }> | Error) => {
      set_is_submitting(false);
      console.error("Review submission failed:", err);
      const responseData = err.response?.data;
      if (responseData?.errors) {
        set_validation_errors(responseData.errors);
      } else if (responseData?.error === 'You must confirm you have personally used this product.') {
        // Specific handling for the confirmation checkbox error if it comes back from API
        set_validation_errors({ confirmation_checkbox: responseData.error });
      }
      else {
        const errorMessage = responseData?.error || 'An unexpected error occurred. Please try again.';
        set_submission_feedback({ message: `Error: ${errorMessage}`, type: 'error' });
      }
      // Handle auth errors specifically
      if (err.response?.status === 401 || err.response?.status === 403) {
        clear_auth_state();
        navigate('/login');
      }
    },
  });

  // --- Handlers ---

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    set_review_title(e.target.value);
    if (validation_errors.title) set_validation_errors({ ...validation_errors, title: '' });
  };

  const handleBodyChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    set_review_body(e.target.value);
    if (validation_errors.body) set_validation_errors({ ...validation_errors, body: '' });
  };

  const handleOverallRatingChange = (ratingValue: number) => {
    set_overall_rating(ratingValue);
    if (validation_errors.overall_rating) set_validation_errors({ ...validation_errors, overall_rating: '' });
  };

  // Generic handler for optional star ratings
  const handleAnyRatingChange = (field: 'sustainability_rating' | 'ethical_rating' | 'durability_rating') => (ratingValue: number) => {
    switch (field) {
      case 'sustainability_rating':
        set_sustainability_rating(ratingValue);
        break;
      case 'ethical_rating':
        set_ethical_rating(ratingValue);
        break;
      case 'durability_rating':
        set_durability_rating(ratingValue);
        break;
      default:
        break;
    }
  };

  const toggleConfirmation = () => {
    set_confirmation_checkbox(!confirmation_checkbox);
    if (validation_errors.confirmation_checkbox) set_validation_errors({ ...validation_errors, confirmation_checkbox: '' });
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Clear the input value to allow selecting the same file again if needed
    if (e.target.value) {
      e.target.value = '';
    }

    if (files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    let hasInvalidFile = false;
    files.forEach(file => {
        if (!allowedTypes.includes(file.type)) {
          set_submission_feedback({ message: `Invalid file type for ${file.name}. Only JPG, PNG, GIF are allowed.`, type: 'error' });
          hasInvalidFile = true;
        } else if (file.size > maxSize) {
          set_submission_feedback({ message: `${file.name} exceeds the 5MB size limit.`, type: 'error' });
          hasInvalidFile = true;
        }
    });

    if (hasInvalidFile) {
      // If any file is invalid, do not proceed with upload for any of them
      return;
    }

    // Trigger uploads immediately for multiple files
    files.forEach(file => {
      photoUploadMutation.mutate(file);
    });
  };

  const handleRemovePhoto = (urlToRemove: string) => {
    // Remove file from actual file state and URL from preview state
    set_uploaded_photos_state(prev => prev.filter(photo => photo.url !== urlToRemove));
    // Remove URL from preview state
    set_preview_photo_urls(prev => prev.filter(url => url !== urlToRemove));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const errors: ValidationErrors = {};
    if (!review_title.trim()) {
      errors.title = 'Review title is required.';
    }
    if (!review_body.trim()) {
      errors.body = 'Review body cannot be empty.';
    }
    if (overall_rating === null || overall_rating < 1 || overall_rating > 5) {
      errors.overall_rating = 'Please provide an overall rating.';
    }
    if (!confirmation_checkbox) {
      errors.confirmation_checkbox = 'You must confirm you have personally used this product.';
    }

    // If there are file upload errors that prevented selection, they'd be handled by submission_feedback
    // but also check if user intended to upload photos and that process succeeded for necessary files.
    // For now, assuming user can submit without photos validation.

    if (Object.keys(errors).length > 0) {
      set_validation_errors(errors);
      return;
    }

    const reviewData = {
      title: review_title.trim(),
      body: review_body.trim(),
      overall_rating: overall_rating!, // Non-null asserted due to validation
      sustainability_rating: sustainability_rating,
      ethical_rating: ethical_rating,
      durability_rating: durability_rating,
      // Pass File objects for actual upload; this assumes handlePhotoUpload stores files correctly.
      // We used `uploaded_photos_state` to store `File[]`.
      photos: uploaded_photos_state,
      confirmation_checkbox: confirmation_checkbox,
    };

    reviewSubmissionMutation.mutate({ productId: product_id!, reviewData });
  };

  const handleCancel = () => {
    // Navigate back to the product detail page
    navigate(`/products/${product_id}`);
  };

  // --- Render Logic ---

  if (!isAuthenticated) {
    // This should ideally be handled by a routing guard, but as a fallback:
    return (
      <div className="text-center mt-10">
        <p className="text-lg font-medium text-gray-700 mb-4">You need to be logged in to submit a review.</p>
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Log In
        </button>
      </div>
    );
  }

  if (isProductInfoLoading) {
    return <div className="text-center py-10">Loading product information...</div>;
  }

  // Handle specific error for product not found
  const isProductNotFound = isProductInfoError && axios.isAxiosError(productInfoError) && productInfoError.response?.status === 404;
  const isGeneralProductError = isProductInfoError && !isProductNotFound;

  if (isProductNotFound) {
    return (
      <div className="text-center py-10 text-red-600">
        <p>Error: Product not found.</p>
        <button onClick={handleCancel} className="mt-4 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">Go Back</button>
      </div>
    );
  }

  if (isGeneralProductError) {
    return (
      <div className="text-center py-10 text-red-600">
        <p>Could not load product details.</p>
        {productInfoError instanceof Error && <p className="text-sm">{productInfoError.message}</p>}
        <button onClick={handleCancel} className="mt-4 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">Go Back</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Write a Review for <span className="text-blue-600">{product_name || 'Product'}</span>
      </h1>

      {submission_feedback.message && (
        <div className={`mb-4 p-3 rounded-md ${
          submission_feedback.type === 'success' ? 'bg-green-100 text-green-800' :
          submission_feedback.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {submission_feedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Review Title */}
        <div>
          <label htmlFor="review_title" className="block text-sm font-medium text-gray-700 mb-1">
            Review Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="review_title"
            value={review_title}
            onChange={handleTitleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 ${
              validation_errors.title ? 'border-red-500' : ''
            }`}
            aria-invalid={!!validation_errors.title}
            aria-describedby={validation_errors.title ? "review_title_error" : undefined}
            required
          />
          {validation_errors.title && (
            <p id="review_title_error" className="mt-1 text-sm text-red-600" role="alert">
              {validation_errors.title}
            </p>
          )}
        </div>

        {/* Overall Rating */}
        <StarRating
          label={<>Overall Rating <span className="text-red-500">*</span></>}
          rating={overall_rating}
          onRatingChange={handleOverallRatingChange}
        />
        {validation_errors.overall_rating && (
          <p className="mt-1 text-sm text-red-600 -mt-2" role="alert">
            {validation_errors.overall_rating}
          </p>
        )}

        {/* Optional Ratings */}
        <StarRating label="Sustainability Rating (Optional)" rating={sustainability_rating} onRatingChange={handleAnyRatingChange('sustainability_rating')} />
        <StarRating label="Ethical Rating (Optional)" rating={ethical_rating} onRatingChange={handleAnyRatingChange('ethical_rating')} />
        <StarRating label="Durability Rating (Optional)" rating={durability_rating} onRatingChange={handleAnyRatingChange('durability_rating')} />

        {/* Review Body */}
        <div>
          <label htmlFor="review_body" className="block text-sm font-medium text-gray-700 mb-1">
            Your Review <span className="text-red-500">*</span>
          </label>
          <textarea
            id="review_body"
            rows={6}
            value={review_body}
            onChange={handleBodyChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 ${
              validation_errors.body ? 'border-red-500' : ''
            }`}
            aria-invalid={!!validation_errors.body}
            aria-describedby={validation_errors.body ? "review_body_error" : undefined}
            required
          ></textarea>
          {validation_errors.body && (
            <p id="review_body_error" className="mt-1 text-sm text-red-600" role="alert">
              {validation_errors.body}
            </p>
          )}
        </div>

        {/* Photo Upload */}
        <div className="border-t border-gray-200 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Photos (Optional, Max 5MB per photo - JPG, PNG, GIF)
          </label>
          <input
            type="file"
            multiple // Allow multiple file selection
            accept="image/jpeg, image/png, image/gif"
            onChange={handleFileSelect}
            disabled={photoUploadMutation.isPending}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
           {photoUploadMutation.isPending && (
             <div className="mt-2 text-sm text-blue-600">Uploading photos...</div>
           )}
          {preview_photo_urls.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {preview_photo_urls.map((url, index) => (
                <div key={index} className="relative group w-24 h-24 border rounded-md overflow-hidden">
                  <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(url)}
                    className="absolute top-1 right-1 bg-black bg-opacity-50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove photo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          {/* This error is more for general upload issues not associated with a specific file selection */}
          {submission_feedback.type === 'error' && !Object.keys(validation_errors).includes('photos') && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {submission_feedback.message}
            </p>
          )}
        </div>

        {/* Confirmation Checkbox */}
        <div className="flex items-start">
          <div className="flex h-5 items-center">
            <input
              id="confirmation_checkbox"
              name="confirmation_checkbox"
              type="checkbox"
              checked={confirmation_checkbox}
              onChange={toggleConfirmation}
              className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                validation_errors.confirmation_checkbox ? 'border-red-500' : ''
              }`}
              aria-invalid={!!validation_errors.confirmation_checkbox}
              aria-describedby={validation_errors.confirmation_checkbox ? "confirm_checkbox_error" : undefined}
              required
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="confirmation_checkbox" className="font-medium text-gray-700">
              I have personally used this product
            </label>
            {validation_errors.confirmation_checkbox && (
              <p id="confirm_checkbox_error" className="text-red-600" role="alert">
                {validation_errors.confirmation_checkbox}
              </p>
            )}
          </div>
        </div>

        {/* Submission Buttons */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button" // Important to not submit the form when clicking cancel
            onClick={handleCancel}
            disabled={is_submitting || photoUploadMutation.isPending}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={is_submitting || photoUploadMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {is_submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UV_ReviewSubmission;
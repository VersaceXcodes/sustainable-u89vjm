import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Import Zustand store actions needed for initialization or potentially conditional rendering
import { useAppStore } from '@/store/main';

// --- Interfaces ---

// Interface for individual featured product cards
interface FeaturedProduct {
  product_id: string;
  name: string;
  brand_name: string;
  primary_image_url: string;
  overall_score: number | null;
  sustainability_score: number | null;
  ethical_score: number | null;
  durability_score: number | null;
}

// Interface for category preview items
interface CategoryPreview {
  category_id: string;
  name: string;
}

// --- API Fetching Functions ---

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}`;

// Fetch featured products
const fetchFeaturedProducts = async (): Promise<FeaturedProduct[]> => {
  const { data } = await axios.get<{ products: FeaturedProduct[] }>(`${API_BASE_URL}/api/products`, {
    params: {
      sort_by: 'overall_score',
      sort_order: 'desc',
      pageSize: 5, // Limiting to 5 featured products
    },
  });
  // OpenAPI spec for /api/products returns { products: [...], pagination: {} }
  return data.products;
};

// Fetch categories preview
const fetchCategoriesPreview = async (): Promise<CategoryPreview[]> => {
  const { data } = await axios.get<CategoryPreview[]>(`${API_BASE_URL}/api/categories`);
  // OpenAPI spec for /api/categories returns an array directly
  return data.slice(0, 4); // Limiting to 4 categories for preview
};

const UV_Landing: React.FC = () => {
  const navigate = useNavigate();
  const initializeApp = useAppStore((state) => state.initialize_app);
  // Accessing global categories is removed from the primary rendering logic for categories
  // const categories_global = useAppStore((state) => state.categories.items); // Access global categories

  // Fetch featured products
  const {
    data: featured_products,
    isLoading: isLoadingFeatured,
    isError: isErrorFeatured,
    error: errorFeatured,
  } = useQuery<FeaturedProduct[], Error>({
    queryKey: ['featuredProducts'],
    queryFn: fetchFeaturedProducts,
    staleTime: 60 * 5 * 1000, // Cache data for 5 minutes
    gcTime: 60 * 10 * 1000, // Garbage collect after 10 minutes
    retry: 2, // Retry twice on failure
  });

  // Fetch categories preview
  const {
    data: categories_preview,
    isLoading: isLoadingCategories,
    isError: isErrorCategories,
    error: errorCategories,
  } = useQuery<CategoryPreview[], Error>({
    queryKey: ['categoriesPreview'],
    queryFn: fetchCategoriesPreview,
    staleTime: 60 * 10 * 1000, // Cache categories for 10 minutes
    gcTime: 60 * 20 * 1000, // Garbage collect after 20 minutes
    // Removed fallback to global categories to ensure data consistency
    // enabled: categories_global.length === 0 // This check is removed to avoid complex state dependency
  });

  // Ensure app initialization happens on mount
  useEffect(() => {
    // Call initialize_app from Zustand store to ensure proper state setup
    initializeApp();
  }, [initializeApp]);

  // Determine overall loading state for UI feedback
  const isLoading = isLoadingFeatured || isLoadingCategories;
  const isError = isErrorFeatured || isErrorCategories;

  // Construct a more reliable error message
  const getErrorMessage = (): string => {
    if (isErrorFeatured && errorFeatured) {
      return `Failed to load featured products: ${errorFeatured.message}`;
    }
    if (isErrorCategories && errorCategories) {
      return `Failed to load categories: ${errorCategories.message}`;
    }
    if (isError) {
      return 'An unexpected error occurred while loading landing page data.';
    }
    return '';
  };

  const errorMessage = getErrorMessage();

  // Handler for navigating to product listing
  const navigateToProductListing = () => {
    navigate('/products');
  };

  // Handler for navigating to registration
  const navigateToRegistration = () => {
    navigate('/register');
  };

  // Handler for navigating to product detail page
  const navigateToProductDetail = (product_id: string) => {
    navigate(`/products/${product_id}`);
  };

  // Handler for navigating to category product listing
  const navigateToCategoryProducts = (category_id: string) => {
    navigate(`/categories/${category_id}`);
  };

  // Use fetched categories directly. If fetch fails, the section won't render unless handled otherwise.
  const displayCategories = categories_preview;

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-50 to-blue-50 py-20 px-6 sm:px-10 lg:px-20 font-sans">
        {/* Background elements or subtle animation could go here */}
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="lg:w-1/2 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-800 leading-tight mb-4">
              Shop Smarter, Live Sustainably.
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
              Discover products that align with your values. Transparent reviews on sustainability, ethical sourcing, and durability.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <button
                onClick={navigateToProductListing}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
              >
                Explore Products
              </button>
              <button
                onClick={navigateToRegistration}
                className="bg-white hover:bg-gray-100 text-green-700 font-semibold py-3 px-8 rounded-lg shadow-md border border-green-600 transition duration-300 ease-in-out transform hover:scale-105"
              >
                Sign Up Free
              </button>
            </div>
          </div>
          <div className="lg:w-1/2 mt-10 lg:mt-0 flex justify-center lg:justify-end">
            {/* Placeholder Image */}
            <img
              src="https://picsum.photos/seed/sustainareview-hero/600/400"
              alt="Sustainable Products Showcase"
              className="rounded-lg shadow-xl w-full max-w-md lg:max-w-full object-cover"
              style={{ aspectRatio: '5/4' }}
            />
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-16 px-6 sm:px-10 lg:px-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-12">
            Why Choose SustainaReview?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
            {/* Sustainability */}
            <div className="p-6 border-[1px] border-gray-200 rounded-lg shadow-sm hover:shadow-md transition duration-300 bg-gray-50">
              <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-green-100 mb-5">
                {/* Placeholder Icon for Sustainability */}
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0a3 3 0 110-6m0 6l-2 1m0 0a3 3 0 100-6m0 6 2-1m0 0a3 3 0 100-6m0 6v12M10 6l-2 1H5a2 5 0 00-2 2v7a2 3 0 002 2h10a2 2 0 002-2v-7a2 5 0 00-2-2H10z"></path></svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Sustainability</h3>
              <p className="text-gray-600 leading-relaxed">
                Understand a product's environmental footprint, from materials to carbon emissions.
              </p>
            </div>

            {/* Ethics */}
            <div className="p-6 border-[1px] border-gray-200 rounded-lg shadow-sm hover:shadow-md transition duration-300 bg-gray-50">
              <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-blue-100 mb-5">
                 {/* Placeholder Icon for Ethics */}
                 <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-2h1.46c-.002-.001-.004-.002-.006-.003l-.042-.007a.6.6 0 00-.006.002C17.65 15.197 16.03 14 14 14c-1.035 0-1.976.544-2.51 1.375L9 15.25V11.5c0-.336-.236-.616-.564-.657a4.5 4.5 0 00-1.528-.243A5.5 5.5 0 003 10.5c0-2.766 2.233-5 5-5s5 2.234 5 5a5.47 5.47 0 01-1.867 3.75m0 0h3.733c.384 0 .754.1.108.108.518.518.776 1.172.776 1.858v2.667c0 .57-.196 1.124-.554 1.558a5.503 5.503 0 01-1.528.243h-.825Z"></path></svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Ethical Sourcing</h3>
              <p className="text-gray-600 leading-relaxed">
                Support brands committed to fair labor, transparent supply chains, and responsible practices.
              </p>
            </div>

            {/* Durability */}
            <div className="p-6 border-[1px] border-gray-200 rounded-lg shadow-sm hover:shadow-md transition duration-300 bg-gray-50">
              <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-yellow-100 mb-5">
                  {/* Placeholder Icon for Durability */}
                  <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-6a2 2 0 11-2-2v1m2 13a2 2 0 012-2h6a2 2 0 012 2v1m0-1H12a2 2 0 00-2 2v1m0 0v1a2 2 0 002 2h6a2 2 0 002-2v-1m0-1H12a2 2 0 00-2-2v-1m0-1"></path></svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Durability Ready</h3>
              <p className="text-gray-600 leading-relaxed">
                Invest in products built to last, reducing waste and saving you money in the long run.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 px-6 sm:px-10 lg:px-20 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-12">
            Featured Products
          </h2>
          {isLoadingFeatured ? (
            <p className="text-center text-gray-500">Loading featured products...</p>
          ) : isErrorFeatured ? (
            <p className="text-center text-red-500">{errorFeatured?.message || 'Could not load featured products.'}</p>
          ) : featured_products && featured_products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {featured_products.map((product) => (
                <Link to={`/products/${product.product_id}`} key={product.product_id} className="block bg-white rounded-lg shadow-md hover:shadow-lg transition duration-300 p-4">
                  <img
                    src={product.primary_image_url || 'https://picsum.photos/seed/placeholder/200/200'}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-t-lg mb-3"
                  />
                  <h3 className="text-md font-semibold text-gray-800 truncate">{product.name}</h3>
                  <p className="text-sm text-green-600 font-medium">Score: {product.overall_score?.toFixed(1) ?? 'N/A'}</p>
                  <p className="text-xs text-gray-500">{product.brand_name}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No featured products available at the moment.</p>
          )}
        </div>
      </section>

      {/* Categories Preview Section */}
      {categories_preview && categories_preview.length > 0 ? (
         <section className="py-16 px-6 sm:px-10 lg:px-20 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-12">
              Explore By Category
            </h2>
            {isLoadingCategories ? (
                <p className="text-center text-gray-500">Loading categories...</p>
            ) : isErrorCategories ? (
                <p className="text-center text-red-500">{errorCategories?.message || 'Could not load categories.'}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {categories_preview.map(category => (
                  <Link
                    to={`/categories/${category.category_id}`}
                    key={category.category_id}
                    className="block bg-green-50 border border-green-200 rounded-lg shadow-sm hover:shadow-md transition duration-300 p-6 text-center"
                  >
                    <h3 className="text-lg font-semibold text-green-700">{category.name}</h3>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        // Optionally render a placeholder or nothing if categories are not available and not loading
        !isLoadingCategories && !isErrorCategories && (
          <p className="text-center text-gray-500 px-6 sm:px-10 lg:px-20 py-16">No categories available.</p>
        )
      )}

      {/* How it Works Section */} 
      <section className="py-16 px-6 sm:px-10 lg:px-20 bg-dots-pattern"> {/* bg-dots-pattern is a custom class, assume it's defined in global CSS or Tailwind config */}
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-12">
            How SustainaReview Works
          </h2>
          <div className="flex flex-col md:flex-row justify-around gap-8">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Discover</h3>
              <p className="text-gray-600 max-w-xs">Find products based on your sustainability, ethical, and durability preferences.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-yellow-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Evaluate</h3>
              <p className="text-gray-600 max-w-xs">Examine detailed scores and read authentic reviews from other conscious consumers.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Choose</h3>
              <p className="text-gray-600 max-w-xs">Make informed purchasing decisions that matter to you and the planet.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Loading Indicator */}
      {isLoading && !isError && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        </div>
      )}

      {/* Error Display */}
      {isError && (
        <div className="max-w-7xl mx-auto text-center py-20 text-red-600 font-semibold">
          <p>{errorMessage}</p>
          <button
            onClick={() => window.location.reload()} // Simple retry mechanism
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      )}
    </>
  );
};

export default UV_Landing;
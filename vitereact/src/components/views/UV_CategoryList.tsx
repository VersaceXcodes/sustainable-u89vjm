import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// --- Type Definition based on OpenAPI Spec ---
interface Category {
  category_id: string;
  name: string;
  description?: string | null;
}

// --- API Fetching Function ---
const fetchCategories = async (): Promise<Category[]> => {
  const response = await axios.get<Category[]>(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/categories`);
  return response.data;
};

// --- View Component ---
const UV_CategoryList: React.FC = () => {
  // --- Data Fetching using React Query ---
  const {
    data: categories,
    isLoading,
    isError,
    error,
  } = useQuery<Category[], Error>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    // staleTime: Infinity, // Categories are relatively static, can be considered stale indefinitely
  });

  // For navigation, if it were to be implemented directly in this component
  // const navigate = useNavigate();

  // --- Error Boundary Fallback UI ---
  // Simple fallback UI for errors within this component's section.
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-red-600">
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <h3 className="text-lg font-semibold mb-2">Error Loading Categories</h3>
          <p className="text-sm">
            Could not fetch category data. Please try again later.
          </p>
          <p className="text-xs mt-2">
             {error?.message || 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  // --- Loading Indicator ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-0"></div>
        <p className="ml-4 text-lg text-gray-600">Loading Categories...</p>
      </div>
    );
  }

  // --- Success State: Render Category List ---
  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Explore by Category</h1>
        <p className="text-lg text-gray-600">
          Discover sustainable products across various categories.
        </p>
      </div>
      {categories && categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div
              key={category.category_id}
              className="bg-white rounded-lg shadow-md overflow-hidden p-6 flex flex-col justify-between transition-shadow duration-300 ease-in-out hover:shadow-xl"
            >
              <div className="flex-grow"> {/* Allows content to take available space */}
                <Link
                  to={`/${category.category_id}`}
                  className="text-xl font-semibold text-blue-600 hover:text-blue-800 hover:underline block mb-2 transition-colors duration-200"
                  aria-label={`View products in ${category.name} category`}
                >
                  {category.name}
                </Link>
                {category.description && (
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {category.description.substring(0, 80)}{category.description.length > 80 ? '...' : ''}
                  </p>
                 )}
              </div>
               {/* Potentially add a count or icon here in the future */}
             </div>
          ))}
        </div>
      ) : (
        <div className="text-center min-h-[200px] flex items-center justify-center">
          <div>
            <svg
              className="w-10 h-10 mx-auto mb-3 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 10h16m-16 0v8a2 2 0 002 2h12a2 2 0 002-2v-8m0 2H4v-2a2 2 0 012-2h12a2 2 0 012 2v2z"
              ></path>
            </svg>
            <p className="text-lg text-gray-500">No categories available at the moment.</p>
          </div>
        </div>
      )}
    </>
  );
};

export default UV_CategoryList;
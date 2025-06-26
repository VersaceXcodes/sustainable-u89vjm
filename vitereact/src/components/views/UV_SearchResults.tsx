import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Import shared components (assuming they exist and are accessible via '@/components/shared')
// If these are not globally available or meant to be within the same directory, adjust import paths.
// For this example, we'll assume they might be in a common location or we need to define them inline if not provided.
// Assuming ProductCard is a shared component, which is very likely.
import ProductCard from '@/components/shared/ProductCard'; // Placeholder path

// Import global state store and types
import { useAppStore, Attribute, Category, ProductCard as GlobalProductCard, PaginationInfo } from '@/store/main';

// --- API Base URL from environment for direct API calls if store instance not accessible directly ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// --- Interfaces for API calls and component state ---

// Define the structure of the response from the /products endpoint
interface GetProductsResponse {
  products: GlobalProductCard[];
  pagination: PaginationInfo;
}

// --- Helper function to construct query params object ---
const buildQueryParams = (
  search_term: string | null,
  category_id: string | null,
  brand_name: string | null,
  min_sustainability_score: number | null,
  min_ethical_score: number | null,
  min_durability_score: number | null,
  attribute_ids: string[],
  sort_by: string | null,
  sort_order: 'asc' | 'desc' | null,
  page: number,
  pageSize: number
): URLSearchParams => {
  const params = new URLSearchParams();
  if (search_term) params.append('q', search_term);
  if (category_id) params.append('category_id', category_id);
  if (brand_name) params.append('brand_name', brand_name);
  if (min_sustainability_score !== null) params.append('min_sustainability_score', min_sustainability_score.toString());
  if (min_ethical_score !== null) params.append('min_ethical_score', min_ethical_score.toString());
  if (min_durability_score !== null) params.append('min_durability_score', min_durability_score.toString());
  if (attribute_ids.length > 0) params.append('attribute_ids', attribute_ids.join(','));
  if (sort_by) params.append('sort_by', sort_by);
  if (sort_order) params.append('sort_order', sort_order);
  params.append('page', page.toString());
  params.append('pageSize', pageSize.toString());
  return params;
};

// --- Fetching Function for Products ---
const fetchProductsBySearch = async (
  search_term: string | null,
  category_id: string | null,
  brand_name: string | null,
  min_sustainability_score: number | null,
  min_ethical_score: number | null,
  min_durability_score: number | null,
  attribute_ids: string[],
  sort_by: string | null,
  sort_order: 'asc' | 'desc' | null,
  page: number,
  limit: number
): Promise<GetProductsResponse> => {
  const queryParams = buildQueryParams(
    search_term,
    category_id,
    brand_name,
    min_sustainability_score,
    min_ethical_score,
    min_durability_score,
    attribute_ids,
    sort_by,
    sort_order,
    page,
    limit
  );

  const { data } = await axios.get<GetProductsResponse>(
    `${API_BASE_URL}/api/products?${queryParams.toString()}`
  );
  return data;
};

// --- Fetching Function for Categories (if not available globally) ---
const fetchCategoriesQueryFn = async (): Promise<Category[]> => {
  const { data } = await axios.get<Category[]>(
    `${API_BASE_URL}/api/categories`
  );
  return data;
};

// --- Fetching Function for Attributes (if not available globally) ---
const fetchAttributesQueryFn = async (): Promise<Attribute[]> => {
  const { data } = await axios.get<Attribute[]>(
    `${API_BASE_URL}/api/attributes`
  );
  return data;
};

const UV_SearchResults: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Use useLocation to access location.search
  const [searchParams, setSearchParams] = useSearchParams();

  // Global state access
  const {
    categories: globalCategories,
    attributes: globalAttributes,
  } = useAppStore((state) => ({
    categories: state.categories.items,
    attributes: state.attributes.items,
  }));
  const set_categories_error = useAppStore((state) => state.set_categories_error);
  const set_attributes_error = useAppStore((state) => state.set_attributes_error);
  const show_notification = useAppStore((state) => state.show_notification);
  const update_categories = useAppStore((state) => state.update_categories);
  const update_attributes = useAppStore((state) => state.update_attributes);

  // Local state for form controls
  const [searchTerm, setSearchTerm] = useState<string | null>(searchParams.get('q') || null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category_id') || null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(searchParams.get('brand_name') || null);
  const [selectedSustainabilityScore, setSelectedSustainabilityScore] = useState<number | null>(() => {
    const score = parseFloat(searchParams.get('min_sustainability_score') || '');
    return !isNaN(score) ? score : null;
  });
  const [selectedEthicalScore, setSelectedEthicalScore] = useState<number | null>(() => {
    const score = parseFloat(searchParams.get('min_ethical_score') || '');
    return !isNaN(score) ? score : null;
  });
  const [selectedDurabilityScore, setSelectedDurabilityScore] = useState<number | null>(() => {
    const score = parseFloat(searchParams.get('min_durability_score') || '');
    return !isNaN(score) ? score : null;
  });
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>(() => {
    const attrParam = searchParams.get('attribute_ids');
    return attrParam ? attrParam.split(',') : [];
  });
  const [sortBy, setSortBy] = useState<string | null>(searchParams.get('sort_by') || null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(() => {
    const order = searchParams.get('sort_order');
    return order === 'asc' || order === 'desc' ? order as 'asc' | 'desc' : null;
  });
  const [currentPage, setCurrentPage] = useState<number>(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    return !isNaN(page) ? page : 1;
  });

  const pageSize = 20; // Default page size

  // Use React Query for fetching products
  const {
    data: productData,
    isLoading: productsLoading,
    isError: productsError,
    error: productsErrorDetails,
  } = useQuery<GetProductsResponse, Error>(
    ['searchProducts', { searchTerm, selectedCategory, selectedBrand, selectedSustainabilityScore, selectedEthicalScore, selectedDurabilityScore, selectedAttributes, sortBy, sortOrder, currentPage, pageSize }],
    () => fetchProductsBySearch(
      searchTerm,
      selectedCategory,
      selectedBrand,
      selectedSustainabilityScore,
      selectedEthicalScore,
      selectedDurabilityScore,
      selectedAttributes,
      sortBy,
      sortOrder,
      currentPage,
      pageSize
    ),
    {
      enabled: !!searchTerm || (selectedCategory || selectedBrand || selectedSustainabilityScore !== null || selectedEthicalScore !== null || selectedDurabilityScore !== null || selectedAttributes.length > 0), // Fetch if a search term or filter is active
      keepPreviousData: true, // Keep previous data while fetching new data
    }
  );

  // Fetch categories if not available from global state
  const { data: fetchedCategories, isLoading: categoriesLoadingGlobal } = useQuery<Category[], Error>(
    ['categories'],
    fetchCategoriesQueryFn,
    {
      initialData: globalCategories.length > 0 ? globalCategories : undefined,
      enabled: globalCategories.length === 0, // Fetch only if not already in global state
      onError: (err) => {
        console.error("Error fetching categories:", err);
        set_categories_error("Failed to load categories.");
        show_notification("Failed to load categories.", 'error');
      },
    }
  );
  // Update global categories when fetched directly
  useEffect(() => {
    if (fetchedCategories && fetchedCategories.length > 0) {
      update_categories(fetchedCategories);
    }
  }, [fetchedCategories, update_categories]);

  // Fetch attributes if not available from global state
  const { data: fetchedAttributes, isLoading: attributesLoadingGlobal } = useQuery<Attribute[], Error>(
    ['attributes'],
    fetchAttributesQueryFn,
    {
      initialData: globalAttributes.length > 0 ? globalAttributes : undefined,
      enabled: globalAttributes.length === 0, // Fetch only if not already in global state
      onError: (err) => {
        console.error("Error fetching attributes:", err);
        set_attributes_error("Failed to load attributes.");
        show_notification("Failed to load attributes.", 'error');
      },
    }
  );
  // Update global attributes when fetched directly
  useEffect(() => {
    if (fetchedAttributes && fetchedAttributes.length > 0) {
      update_attributes(fetchedAttributes);
    }
  }, [fetchedAttributes, update_attributes]);

  // Use a ref to track if initial URL params have been processed
  const isInitialMount = React.useRef(true);

  // Effect to update URL when filters/sorting/pagination change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return; // Skip initial sync to avoid overwriting existing URL params on first render
    }

    const currentParams = new URLSearchParams(location.search);

    // Function to safely update or remove URL params
    const updateParam = (key: string, value: string | null | undefined) => {
      if (value !== null && value !== undefined && value !== '') {
        currentParams.set(key, String(value));
      } else {
        currentParams.delete(key);
      }
    };

    // Update parameters based on state
    updateParam('q', searchTerm);
    updateParam('category_id', selectedCategory);
    updateParam('brand_name', selectedBrand);
    updateParam('min_sustainability_score', selectedSustainabilityScore !== null ? selectedSustainabilityScore.toString() : undefined);
    updateParam('min_ethical_score', selectedEthicalScore !== null ? selectedEthicalScore.toString() : undefined);
    updateParam('min_durability_score', selectedDurabilityScore !== null ? selectedDurabilityScore.toString() : undefined);
    updateParam('attribute_ids', selectedAttributes.length > 0 ? selectedAttributes.join(',') : undefined);
    updateParam('sort_by', sortBy);
    updateParam('sort_order', sortOrder);
    updateParam('page', currentPage > 1 ? currentPage.toString() : undefined); // Only include page if not first page

    setSearchParams(currentParams.toString(), { replace: true });

  }, [searchTerm, selectedCategory, selectedBrand, selectedSustainabilityScore, selectedEthicalScore, selectedDurabilityScore, selectedAttributes, sortBy, sortOrder, currentPage, pageSize, setSearchParams, location.search]); // Include location.search for correct dependency tracking of URL parsing

  // Effect to initialize local state from URL params on component mount or when searchParams change
  useEffect(() => {
    const urlSearchParams = new URLSearchParams(location.search);

    // Only update state if it's different from the current state to avoid unnecessary re-renders and potential loops
    if (urlSearchParams.get('q') !== searchTerm) {
      setSearchTerm(urlSearchParams.get('q'));
    }
    if (urlSearchParams.get('category_id') !== selectedCategory) {
      setSelectedCategory(urlSearchParams.get('category_id'));
    }
    if (urlSearchParams.get('brand_name') !== selectedBrand) {
      setSelectedBrand(urlSearchParams.get('brand_name'));
    }
    const sustainabilityScoreParam = urlSearchParams.get('min_sustainability_score');
    const currentSustainScore = parseFloat(sustainabilityScoreParam || '');
    if (!isNaN(currentSustainScore) && currentSustainScore !== selectedSustainabilityScore) {
      setSelectedSustainabilityScore(currentSustainScore);
    } else if (sustainabilityScoreParam === null && selectedSustainabilityScore !== null) {
      setSelectedSustainabilityScore(null);
    }

    const ethicalScoreParam = urlSearchParams.get('min_ethical_score');
    const currentEthicalScore = parseFloat(ethicalScoreParam || '');
    if (!isNaN(currentEthicalScore) && currentEthicalScore !== selectedEthicalScore) {
      setSelectedEthicalScore(currentEthicalScore);
    } else if (ethicalScoreParam === null && selectedEthicalScore !== null) {
      setSelectedEthicalScore(null);
    }

    const durabilityScoreParam = urlSearchParams.get('min_durability_score');
    const currentDurabilityScore = parseFloat(durabilityScoreParam || '');
    if (!isNaN(currentDurabilityScore) && currentDurabilityScore !== selectedDurabilityScore) {
      setSelectedDurabilityScore(currentDurabilityScore);
    } else if (durabilityScoreParam === null && selectedDurabilityScore !== null) {
      setSelectedDurabilityScore(null);
    }

    const attributeIdsParam = urlSearchParams.get('attribute_ids');
    const urlAttributeIds = attributeIdsParam ? attributeIdsParam.split(',') : [];
    if (JSON.stringify(urlAttributeIds) !== JSON.stringify(selectedAttributes)) {
      setSelectedAttributes(urlAttributeIds);
    }

    const sb = urlSearchParams.get('sort_by');
    if (sb !== sortBy) {
      setSortBy(sb);
    }

    const so = urlSearchParams.get('sort_order');
    const validSo = (so === 'asc' || so === 'desc') ? so as 'asc' | 'desc' : null;
    if (validSo !== sortOrder) {
      setSortOrder(validSo);
    }

    const pageNumParam = urlSearchParams.get('page');
    const pageNum = parseInt(pageNumParam || '1', 10);
    if (!isNaN(pageNum) && pageNum !== currentPage) {
      setCurrentPage(pageNum);
    }

  }, [location.search]); // Re-run if search params change

  // Handlers for filter/sort/pagination changes
  const handleFilterChange = useCallback((filterName: string, value: any) => {
    // Reset to first page when filters change
    setCurrentPage(1);

    switch (filterName) {
      case 'category':
        setSelectedCategory(value);
        break;
      case 'brand':
        setSelectedBrand(value);
        break;
      case 'sustainability_score':
        setSelectedSustainabilityScore(value);
        break;
      case 'ethical_score':
        setSelectedEthicalScore(value);
        break;
      case 'durability_score':
        setSelectedDurabilityScore(value);
        break;
      case 'attributes':
        const attribute_id = value as string;
        setSelectedAttributes((prev) =>
          prev.includes(attribute_id) ? prev.filter((id) => id !== attribute_id) : [...prev, attribute_id]
        );
        break;
      default:
        break;
    }
  }, []);

  const handleSortChange = useCallback((newSortBy: string | null, newSortOrder: 'asc' | 'desc' | null) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1); // Reset to first page when sorting changes
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Update search parameter 'q' and reset other filters/pagination for a fresh search
    // URL param update is handled by the useEffect that watches searchTerm
    setCurrentPage(1);
    setSelectedCategory(null);
    setSelectedBrand(null);
    setSelectedSustainabilityScore(null);
    setSelectedEthicalScore(null);
    setSelectedDurabilityScore(null);
    setSelectedAttributes([]);
    setSortBy(null);
    setSortOrder(null);
    // The searchTerm state is already updated by handleSearchInputChange or initially from URL
    // The useEffect will pick up the searchTerm change and update URL/trigger fetch
  };

  // Handler to navigate to product detail page
  const handleProductClick = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  // Determine available categories and attributes, prioritizing global state
  const availableCategories = globalCategories.length > 0 ? globalCategories : fetchedCategories || [];
  const availableAttributes = globalAttributes.length > 0 ? globalAttributes : fetchedAttributes || [];

  // Dynamic Title
  const pageTitle = `Search Results for "${searchTerm || 'Your Query'}"`;

  // Determine rendering states
  const isLoading = productsLoading || (globalCategories.length === 0 && categoriesLoadingGlobal) || (globalAttributes.length === 0 && attributesLoadingGlobal);
  const isEmptyResults = !isLoading && !productsError && (productData?.products?.length === 0);
  const isError = productsError || (globalCategories.length === 0 && !categoriesLoadingGlobal && !fetchedCategories && !globalCategories.length) || (globalAttributes.length === 0 && !attributesLoadingGlobal && !fetchedAttributes && !globalAttributes.length);

  // Determine if any filters are active for conditional rendering of 'Clear All Filters'
  const isAnyFilterActive = searchTerm !== null || selectedCategory !== null || selectedBrand !== null || selectedSustainabilityScore !== null || selectedEthicalScore !== null || selectedDurabilityScore !== null || selectedAttributes.length > 0 || sortBy !== null || sortOrder !== null || currentPage !== 1;

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6 text-gray-800">
          {pageTitle}
        </h1>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mb-8 flex items-center space-x-4 p-4 border border-gray-300 rounded-lg shadow-sm bg-white">
          <input
            type="text"
            placeholder="Search for products..."
            value={searchTerm || ''}
            onChange={handleSearchInputChange}
            className="flex-grow p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Search
          </button>
        </form>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg text-gray-600">Loading search results...</p>
            {/* Consider adding a spinner component here */}
          </div>
        )}

        {isError && (
          <div className="flex justify-center items-center h-64 text-red-600 text-lg">
             {productsErrorDetails?.message || "An error occurred while fetching search results. Please try again later."}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]"> {/* Sidebar + Content grid */}
            {/* Filter Panel */}
            <aside className="space-y-6">
              {/* Category Filter */}
              {availableCategories.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">Category</h3>
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => handleFilterChange('category', e.target.value || null)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Categories</option>
                    {availableCategories.map((cat) => (
                      <option key={cat.category_id} value={cat.category_id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Score Filters */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Sustainability Score</h3>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={selectedSustainabilityScore === null ? 0 : selectedSustainabilityScore}
                    onChange={(e) => handleFilterChange('sustainability_score', parseFloat(e.target.value))}
                    className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700 mr-2 min-w-[4ch] text-right">
                     {selectedSustainabilityScore !== null ? selectedSustainabilityScore.toFixed(1) : 'Any'}
                  </span>
                  {selectedSustainabilityScore !== null && (
                    <button onClick={() => handleFilterChange('sustainability_score', null)} className="text-gray-500 hover:text-gray-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Ethical Score</h3>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={selectedEthicalScore === null ? 0 : selectedEthicalScore}
                    onChange={(e) => handleFilterChange('ethical_score', parseFloat(e.target.value))}
                    className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700 mr-2 min-w-[4ch] text-right">
                     {selectedEthicalScore !== null ? selectedEthicalScore.toFixed(1) : 'Any'}
                  </span>
                  {selectedEthicalScore !== null && (
                    <button onClick={() => handleFilterChange('ethical_score', null)} className="text-gray-500 hover:text-gray-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Durability Score</h3>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={selectedDurabilityScore === null ? 0 : selectedDurabilityScore}
                    onChange={(e) => handleFilterChange('durability_score', parseFloat(e.target.value))}
                    className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700 mr-2 min-w-[4ch] text-right">
                    {selectedDurabilityScore !== null ? selectedDurabilityScore.toFixed(1) : 'Any'}
                  </span>
                  {selectedDurabilityScore !== null && (
                    <button onClick={() => handleFilterChange('durability_score', null)} className="text-gray-500 hover:text-gray-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Attribute Filters */}
              {availableAttributes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">Attributes</h3>
                  <div className="space-y-2">
                   {availableAttributes.map(attr => (
                      <div key={attr.attribute_id} className="flex items-center">
                        <input
                          id={`attribute-${attr.attribute_id}`}
                          type="checkbox"
                          checked={selectedAttributes.includes(attr.attribute_id)}
                          onChange={() => handleFilterChange('attributes', attr.attribute_id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`attribute-${attr.attribute_id}`} className="ml-2 text-sm text-gray-700">
                          {attr.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Brand filter here if it becomes a separate input */}
               {/* Placeholder for Brand filter if needed separate from Search */}
               {/* <div>
                 <h3 className="text-lg font-semibold mb-3 text-gray-700">Brand</h3>
                 <input type="text" placeholder="Filter by brand..." value={selectedBrand || ''} onChange={e => handleFilterChange('brand', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
               </div> */}

               {isAnyFilterActive && (
                 <button onClick={() => {
                    setSearchTerm(null);
                    setSelectedCategory(null);
                    setSelectedBrand(null);
                    setSelectedSustainabilityScore(null);
                    setSelectedEthicalScore(null);
                    setSelectedDurabilityScore(null);
                    setSelectedAttributes([]);
                    setSortBy(null);
                    setSortOrder(null);
                    setCurrentPage(1);
                    // Clear all search params except potentially the base path if needed
                    setSearchParams({}, { replace: true });
                 }} className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400">
                   Clear All Filters
                 </button>
               )}
            </aside>

            {/* Main Content Area: Sorting, Product Grid, Pagination */}
            <section>
              {/* Sorting Controls */}
              <div className="flex justify-between items-center mb-6 p-4 border border-gray-300 rounded-lg shadow-sm bg-white">
                <span className="text-sm text-gray-600">
                  Found {productData?.pagination.totalProducts || 0} results
                </span>
                <div className="flex items-center space-x-4">
                  <label htmlFor="sort_by" className="text-sm font-semibold text-gray-700">Sort by:</label>
                  <select
                    id="sort_by"
                    value={sortBy || ''}
                    onChange={(e) => handleSortChange(e.target.value || null, sortBy === e.target.value ? sortOrder : 'asc')}
                    className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Relevance</option> {/* Default or default sort order */}
                    <option value="overall_score">Overall Score</option>
                    <option value="sustainability_score">Sustainability Score</option>
                    <option value="ethical_score">Ethical Score</option>
                    <option value="durability_score">Durability Score</option>
                    <option value="name">Product Name</option>
                    <option value="brand_name">Brand Name</option>
                  </select>

                  {sortBy && (
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {sortOrder === 'asc' ? '▲' : '▼'}
                    </button>
                  )}
                </div>
              </div>

               {/* Product Grid */}
              {isEmptyResults ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-600">
                  <p className="text-lg mb-4">No products found matching your criteria.</p>
                  <p className="text-sm text-gray-500 mb-4">Try adjusting your search terms or filters.</p>
                  {/* Optionally add a button to clear filters and search */}
                  <button
                    onClick={() => {
                        setSearchTerm(null); setSelectedCategory(null); setSelectedBrand(null);
                        setSelectedSustainabilityScore(null); setSelectedEthicalScore(null);
                        setSelectedDurabilityScore(null); setSelectedAttributes([]);
                        setSortBy(null); setSortOrder(null); setCurrentPage(1);
                        setSearchParams({}, { replace: true }); // Clear search params
                    }}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Clear Filters & Search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {productData?.products.map((product) => (
                    <ProductCard
                      key={product.product_id}
                      product={product}
                      onClick={() => handleProductClick(product.product_id)}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {productData?.pagination && productData.pagination.totalPages > 1 && !isLoading && !isEmptyResults && !productsError && (
                <div className="flex justify-center items-center mt-10 space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-md ${
                      currentPage === 1
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-300'
                    }`}
                  >
                    Previous
                  </button>
                  {/* Display page numbers - adjust logic for large numbers of pages */}
                  {[...Array(productData.pagination.totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    const isCurrent = pageNum === currentPage;
                    const isNearby = Math.abs(pageNum - currentPage) <= 1 || pageNum === 1 || pageNum === productData.pagination.totalPages;

                    if (isCurrent || isNearby) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-4 py-2 rounded-md ${ isCurrent ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (pageNum === 2 && currentPage > 3) {
                       return <span key="ellipsis-start" className="px-4 py-2 text-gray-500">...</span>;
                    } else if (pageNum === productData.pagination.totalPages -1 && currentPage < productData.pagination.totalPages - 2) {
                      return <span key="ellipsis-end" className="px-4 py-2 text-gray-500">...</span>;
                    }
                    return null;
                  })}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === productData.pagination.totalPages}
                    className={`px-4 py-2 rounded-md ${
                      currentPage === productData.pagination.totalPages
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-300'
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  );
};

// --- Placeholder for ProductCard component if not imported ---
// In a real project, this would be imported from '@/components/shared/ProductCard'
/*
interface ProductCardProps {
  product: GlobalProductCard;
  onClick: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300 ease-in-out"
    >
      <img
        src={product.primary_image_url || 'https://picsum.photos/seed/placeholder/300/300'}
        alt={product.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-2">by {product.brand_name}</p>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            {product.overall_score !== null && (
              <>
                <svg className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.431a1 1 0 00-.364.901l1.07 3.292c.3.921-.755 1.688-1.54 1.11L11 13.164a1 1 0 00-1.196 0l-2.8 2.431c-.787.573-1.844-.193-1.54-1.11l1.07-3.292a1 1 0 00-.364-.901l-2.8-2.431c-.787-.573-.384-1.81.588-1.81h3.461a1 1 0 00.95-.69l1.07-3.292z"/>
                </svg>
                <span className="text-gray-700 font-bold">{product.overall_score.toFixed(1)}</span>
              </>
            )}
          </div>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-green-100 text-green-800">
             {product.sustainability_score !== null && `Sust: ${product.sustainability_score.toFixed(1)}`}
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
            <span>Ethical: {product.ethical_score?.toFixed(1) ?? 'N/A'}</span>
            <span>Durability: {product.durability_score?.toFixed(1) ?? 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};
*/

// Define your `useQuery` fetch functions for categories and attributes
const FetchCategoriesQueryFn = async (): Promise<Category[]> => {
  const { data } = await axios.get<Category[]>(
    `${import.meta.env.VITE_API_BASE_URL}/api/categories`
  );
  return data;
};

const FetchAttributesQueryFn = async (): Promise<Attribute[]> => {
  const { data } = await axios.get<Attribute[]>(
    `${import.meta.env.VITE_API_BASE_URL}/api/attributes`
  );
  return data;
};

export default UV_SearchResults;
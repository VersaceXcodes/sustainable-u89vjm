import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// --- Zustand Store Hook ---
// Assuming the correct types and structure for the store
import { useAppStore, Attribute, Category, ProductCard as ZustandProductCard, PaginationInfo as ZustandPaginationInfo } from '@/store/main.tsx';

// --- Types for Filters and Sorting ---

interface ProductListState {
  items: ZustandProductCard[];
  pagination: ZustandPaginationInfo;
}

interface Filters {
  search_term: string | null;
  category_id: string | null;
  brand_name: string | null;
  min_sustainability_score: number | null;
  min_ethical_score: number | null;
  min_durability_score: number | null;
  attribute_ids: string[];
  sort_by: string | null;
  sort_order: ('asc' | 'desc') | null;
  page: number;
  pageSize: number;
}

// --- API Fetching Function ---

const fetchProducts = async (filters: Filters): Promise<{ products: ZustandProductCard[]; pagination: ZustandPaginationInfo }> => {
  const params = new URLSearchParams();

  if (filters.search_term) params.append('q', filters.search_term);
  if (filters.category_id) params.append('category_id', filters.category_id);
  if (filters.brand_name) params.append('brand_name', filters.brand_name);
  if (filters.min_sustainability_score !== null && filters.min_sustainability_score !== undefined) params.append('min_sustainability_score', filters.min_sustainability_score.toString());
  if (filters.min_ethical_score !== null && filters.min_ethical_score !== undefined) params.append('min_ethical_score', filters.min_ethical_score.toString());
  if (filters.min_durability_score !== null && filters.min_durability_score !== undefined) params.append('min_durability_score', filters.min_durability_score.toString());
  if (filters.attribute_ids.length > 0) params.append('attribute_ids', filters.attribute_ids.join(','));
  if (filters.sort_by) params.append('sort_by', filters.sort_by);
  if (filters.sort_order) params.append('sort_order', filters.sort_order);
  params.append('page', filters.page.toString());
  params.append('pageSize', filters.pageSize.toString());

  // Corrected API URL construction
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const url = `${API_BASE_URL}/products?${params.toString()}`;
  
  const { data } = await axios.get<{ products: ZustandProductCard[]; pagination: ZustandPaginationInfo }>(url);
  return data;
};

// --- ProductCard Component (Internal) ---
interface ProductCardProps {
  product: ZustandProductCard;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({ product }) => {
  const getScoreColor = useCallback((score: number | null, type: 'sustainability' | 'ethical' | 'durability' | 'overall' = 'overall'): string => {
    if (score === null || score === undefined) return 'text-gray-400'; // Default for null scores

    const baseColor = 'inline-block px-2 py-1 rounded-md text-xs font-semibold ';
    
    let colorClass = '';
    
    if (type === 'overall' || type === 'sustainability') {
      if (score >= 4.5) colorClass = 'bg-green-100 text-green-800';
      else if (score >= 3.5) colorClass = 'bg-yellow-100 text-yellow-800';
      else if (score >= 2.5) colorClass = 'bg-orange-100 text-orange-800';
      return baseColor + colorClass;
    } else if (type === 'ethical') {
       if (score >= 4.5) colorClass = 'bg-blue-100 text-blue-800';
      if (score >= 3.5) colorClass = 'bg-purple-100 text-purple-800';
      return baseColor + colorClass;
    } else { // Durability
      if (score >= 4.5) colorClass = 'bg-indigo-100 text-indigo-800';
      if (score >= 3.5) colorClass = 'bg-teal-100 text-teal-800';
      return baseColor + colorClass;
    }
  };

  const formatScore = useCallback((score: number | null): string => score !== null ? score.toFixed(1) : 'N/A', []);

  // Added guard clause for product 
  if (!product) {
    return null;
  }

  return (
    <Link to={`/products/${product.product_id}`} className="block group border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 bg-white p-4 flex flex-col justify-between">
      <div>
        <div className="w-full h-48 overflow-hidden sm:h-56 lg:h-64">
          <img
            src={product.primary_image_url || 'https://picsum.photos/seed/productdefault/400/400'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{product.name}</h3>
          <p className="text-sm text-gray-500">By: {product.brand_name || 'Unknown Brand'}</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
        <span className={`${getScoreColor(product.overall_score)}`}>
          {formatScore(product.overall_score)} Overall
        </span>
        <div className="flex space-x-2">
            <span className={`${getScoreColor(product.sustainability_score, 'sustainability')}`}>
              {formatScore(product.sustainability_score)}
            </span>
             <span className={`${getScoreColor(product.ethical_score, 'ethical')}`}>
              {formatScore(product.ethical_score)}
            </span>
             <span className={`${getScoreColor(product.durability_score, 'durability')}`}>
              {formatScore(product.durability_score)}
            </span>
        </div>
      </div>
    </Link>
  );
};

// --- Product Listing View Component ---

const UV_ProductListing: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Zustand store access - corrected imports and destructuring based on assumed store structure
  const fetchedCategories = useAppStore(state => state.categories?.items || []);
  const fetchedAttributes = useAppStore(state => state.attributes?.items || []);
  const globalFilters = useAppStore(state => state.filters);
  const set_search_term = useAppStore(state => state.set_search_term);
  const set_category_filter = useAppStore(state => state.set_category_id);
  const set_brand_filter = useAppStore(state => state.set_brand_name);
  const set_score_filter = useAppStore(state => state.set_score_filter);
  const set_attribute_filters = useAppStore(state => state.set_attribute_filters);
  const set_sort = useAppStore(state => state.set_sort);
  const clear_all_filters = useAppStore(state => state.clear_all_filters);
  const set_products_data = useAppStore(state => state.set_products_data);
  const set_pagination_info = useAppStore(state => state.set_pagination_info);
  const set_products_loading = useAppStore(state => state.set_products_loading);
  const set_products_error = useAppStore(state => state.set_products_error);
  // Assuming these setters exist in the store for page and page size
  const set_page_filter = useAppStore(state => state.set_page_filter);
  const set_page_size_filter = useAppStore(state => state.set_page_size_filter);

  // Memoize the filters object to use as a dependency for react-query
  // Combine URL params and Zustand filters, prioritizing Zustand's state for changes,
  // but ensuring URL params initialize the state.
  const currentFiltersState: Filters = useMemo(() => {
    // Helper to parse float scores safely
    const parseFloatParam = (key: string): number | null => {
      const value = searchParams.get(key);
      if (value === null || value === '') return null;
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    };

    const paramsPage = parseInt(searchParams.get('page') || '1', 10);
    const paramsPageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    return {
      search_term: globalFilters.search_term ?? searchParams.get('q') ?? null,
      category_id: globalFilters.category_id ?? searchParams.get('category_id') ?? null,
      brand_name: globalFilters.brand_name ?? searchParams.get('brand_name') ?? null,
      min_sustainability_score: globalFilters.min_sustainability_score ?? parseFloatParam('min_sustainability_score'),
      min_ethical_score: globalFilters.min_ethical_score ?? parseFloatParam('min_ethical_score'),
      min_durability_score: globalFilters.min_durability_score ?? parseFloatParam('min_durability_score'),
      attribute_ids: globalFilters.attribute_ids ?? (searchParams.get('attribute_ids')?.split(',').filter(Boolean) ?? []),
      sort_by: globalFilters.sort_by ?? searchParams.get('sort_by') ?? null,
      sort_order: (globalFilters.sort_order as ('asc' | 'desc') | null) ?? (searchParams.get('sort_order') as ('asc' | 'desc') | null) ?? null,
      page: globalFilters.page ?? paramsPage,
      pageSize: globalFilters.pageSize ?? paramsPageSize,
    };
  }, [globalFilters, searchParams]); // Ensure searchParams are dependency

  // React Query for Products
  const queryClient = useQueryClient();

  // Fetch products using React Query
  const { data, isLoading, isError, error, refetch } = useQuery<{ products: ZustandProductCard[]; pagination: ZustandPaginationInfo }, Error>({
    queryKey: ['products', currentFiltersState], // Dependency on the derived filters state
    queryFn: () => fetchProducts(currentFiltersState),
    keepPreviousData: true, // Good for pagination to avoid flickering old data
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,  // 10 minutes
    enabled: true, // Always enabled for this view in MVP scope
    onSuccess: (fetchedData) => {
      set_products_data(fetchedData.products);
      set_pagination_info(fetchedData.pagination);
      set_products_loading(false);
      set_products_error(null);

      // Update URL query params based on the *current* filters state (not globalFilters directly)
      const newSearchParams = new URLSearchParams();
      if (currentFiltersState.search_term) newSearchParams.set('q', currentFiltersState.search_term);
       if (currentFiltersState.category_id) newSearchParams.set('category_id', currentFiltersState.category_id);
      if (currentFiltersState.brand_name) newSearchParams.set('brand_name', currentFiltersState.brand_name);
      if (currentFiltersState.min_sustainability_score !== null) newSearchParams.set('min_sustainability_score', currentFiltersState.min_sustainability_score.toString());
      if (currentFiltersState.min_ethical_score !== null) newSearchParams.set('min_ethical_score', currentFiltersState.min_ethical_score.toString());
      if (currentFiltersState.min_durability_score !== null) newSearchParams.set('min_durability_score', currentFiltersState.min_durability_score.toString());
      if (currentFiltersState.attribute_ids.length > 0) newSearchParams.set('attribute_ids', currentFiltersState.attribute_ids.join(','));
      if (currentFiltersState.sort_by) newSearchParams.set('sort_by', currentFiltersState.sort_by);
      if (currentFiltersState.sort_order) newSearchParams.set('sort_order', currentFiltersState.sort_order);
      // Always set page and pageSize to ensure consistency, even if they are defaults
      newSearchParams.set('page', currentFiltersState.page.toString());
      newSearchParams.set('pageSize', currentFiltersState.pageSize.toString());
      
      setSearchParams(newSearchParams.toString(), { replace: true });
    },
    onError: (err: Error) => {
      set_products_error(err.message || 'An unexpected error occurred.');
      set_products_loading(false);
      set_products_data([]); // Clear products on error
      set_pagination_info({ currentPage: 1, pageSize: 20, totalPages: 0, totalProducts: 0 });
       set_products_error(`Failed to load products: ${err.message}`);
    },
  });
    
  // Effect to handle initial data fetching based on category_id slug if present
  useEffect(() => {
    if (fetchedCategories.length === 0 && !isLoading && !isError) { // Only fetch if no data yet and not currently fetching/errored
        // This condition might need refinement if Zustand's products state is managed independently of React Query's cache
        // For now, we assume `enabled: true` on useQuery handles the initial fetch.
        // If navigateToProductDetail used the queryClient directly, onSuccess could trigger refetch.
    }
    // Handle category_id slug from route if it's used directly on this component mount
    const categoryIdFromUrl = searchParams.get('category_id'); // Or use context from router if available
    if (categoryIdFromUrl && !currentFiltersState.category_id) {
      // This might require careful handling if category_id is set both via URL and Zustand filter state
      // For now, the useMemo for currentFiltersState should handle this merge.
    }
  }, [searchParams, currentFiltersState.category_id, currentFiltersState.search_term, fetchedCategories]); // Dependencies that should trigger re-evaluation of filters/query

  // Effect to sync URL parameters to Zustand state on initial load or when URL changes
  useEffect(() => {
    const syncUrlToZustand = () => {
        const urlCategory = searchParams.get('category_id');
        const urlSearch = searchParams.get('q');
        const urlBrand = searchParams.get('brand_name');
        const urlSustainability = searchParams.get('min_sustainability_score');
        const urlEthical = searchParams.get('min_ethical_score');
        const urlDurability = searchParams.get('min_durability_score');
        const urlAttributes = searchParams.get('attribute_ids');
        const urlSortBy = searchParams.get('sort_by');
        const urlSortOrder = searchParams.get('sort_order');
        const urlPage = searchParams.get('page') || '1';
        const urlPageSize = searchParams.get('pageSize') || '20';

        // Helper to parse float scores safely
        const parseFloatParam = (key: string): number | null => {
          const value = searchParams.get(key);
          if (value === null || value === '') return null;
          const num = parseFloat(value);
          return isNaN(num) ? null : num;
        };

        // Update Zustand state only if the URL value differs from the current Zustand state
        if (urlSearch !== null && urlSearch !== globalFilters.search_term) set_search_term(urlSearch);
        else if (urlSearch === null && globalFilters.search_term !== null) set_search_term(null);

        if (urlCategory !== null && urlCategory !== globalFilters.category_id) set_category_filter(urlCategory);
        else if (urlCategory === null && globalFilters.category_id !== null) set_category_filter(null);

        if (urlBrand !== null && urlBrand !== globalFilters.brand_name) set_brand_filter(urlBrand);
        else if (urlBrand === null && globalFilters.brand_name !== null) set_brand_filter(null);

        const sustScore = parseFloatParam('min_sustainability_score');
        if (sustScore !== globalFilters.min_sustainability_score) set_score_filter('sustainability', sustScore);

        const ethScore = parseFloatParam('min_ethical_score');
        if (ethScore !== globalFilters.min_ethical_score) set_score_filter('ethical', ethScore);

        const durScore = parseFloatParam('min_durability_score');
        if (durScore !== globalFilters.min_durability_score) set_score_filter('durability', durScore);

        const attrIds = urlAttributes?.split(',').filter(Boolean) || [];
        // Compare stringified arrays for equality check
        if (JSON.stringify(attrIds) !== JSON.stringify(globalFilters.attribute_ids)) {
           set_attribute_filters(attrIds);
        }

        if (urlSortBy !== null && urlSortBy !== globalFilters.sort_by) {
          set_sort(urlSortBy, urlSortOrder as ('asc' | 'desc') | null);
        } else if (urlSortBy === null && globalFilters.sort_by !== null) {
             set_sort(null, null);
        }

        const pageNum = parseInt(urlPage, 10);
        if (!isNaN(pageNum) && pageNum !== globalFilters.page) {
          set_page_filter(pageNum);
        }

        const pageSizeNum = parseInt(urlPageSize, 10);
         if (!isNaN(pageSizeNum) && pageSizeNum !== globalFilters.pageSize) {
          set_page_size_filter(pageSizeNum);
        }
    };

    syncUrlToZustand();
  }, [searchParams, set_search_term, set_category_filter, set_brand_filter, set_score_filter, set_attribute_filters, set_sort, set_page_filter, set_page_size_filter, globalFilters]); // Add set_page_filter if it exists

  // --- Filter and Sort Handlers ---

  // Generic handler to update filters, trigger Zustand update and then re-fetch via React Query
  const applyFilter = useCallback((filterName: keyof Filters, value: any) => {
    // Update Zustand state, which will in turn update currentFiltersState memo, triggering query
    switch (filterName) {
      case 'search_term':
        set_search_term(value as string | null);
        break;
      case 'category_id':
        set_category_filter(value as string | null);
        break;
      case 'brand_name':
        set_brand_filter(value as string | null);
        break;
      case 'min_sustainability_score':
      case 'min_ethical_score':
      case 'min_durability_score':
        {
          const scoreType = filterName.replace('min_', '').replace('_score', '');
          set_score_filter(scoreType as any, value as number | null);
        }
        break;
      case 'attribute_ids':
        set_attribute_filters(value as string[]);
        break;
      case 'sort_by':
      case 'sort_order':
        // Handled by applySort specifically for combined update
        break;
      case 'page':
        set_page_filter(value as number);
        break;
      case 'pageSize':
        set_page_size_filter(value as number);
        break;
      default:
        console.warn(`Unhandled filter name: ${filterName}`);
    }

    // Reset page to 1 when most filters change, except for pageSize which has its own logic
    if (filterName !== 'page' && filterName !== 'pageSize' && filterName !== 'sort_by' && filterName !== 'sort_order') {
       set_page_filter(1);
    }

  }, [set_search_term, set_category_filter, set_brand_filter, set_score_filter, set_attribute_filters, set_page_filter, set_page_size_filter]);

  const handleFilterChange = useCallback((filterName: string, value: string | string[] | number | null) => {
    // Specific logic for search term clearing other filters
    if (filterName === 'search_term') {
      // If search term is being set, clear category, brand, attributes, and scores
      if (value !== null && value !== '') {
        set_category_filter(null);
        set_brand_filter(null);
        set_attribute_filters([]);
        set_score_filter('sustainability', null);
        set_score_filter('ethical', null);
        set_score_filter('durability', null);
      }
      applyFilter(filterName as any, value);
    } else {
      // For other filters, avoid clearing search term if they are applied with search term
      // The UX for this depends on requirements. Decided to not clear search term if user also applies category/brand filter.
      // If clearing search term is desired when selecting category/brand, revert the commented lines.
      /* 
      if (filterName === 'category_id' && value !== null) {
         set_search_term(null);
      }
      if (filterName === 'brand_name' && value !== null) {
         set_search_term(null);
      }
      */
      applyFilter(filterName as any, value);
    }
  }, [applyFilter]);

  const handleSortChange = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    set_sort(sortBy, sortOrder);
    applyFilter('page', 1); // Reset page to 1 on sort change
  }, [set_sort, applyFilter]);

  const handlePageChange = useCallback((pageNumber: number) => {
    applyFilter('page', pageNumber);
  }, [applyFilter]);

  const handlePageSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = parseInt(e.target.value, 10);
    set_page_size_filter(newPageSize);
    applyFilter('page', 1); // Reset to page 1
  }, [set_page_size_filter, applyFilter]);

  const clearAllFiltersHandler = useCallback(() => {
    clear_all_filters(); // Updates Zustand filters state
    // Reset URL params as well
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('page', '1'); // Reset page to 1
    newSearchParams.set('pageSize', '20'); // Reset to default page size as well
    setSearchParams(newSearchParams, { replace: true });
  }, [clear_all_filters, setSearchParams]);

  // --- Filter UI Handlers ---
  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleFilterChange('category_id', e.target.value || null);
  };

  const handleBrandInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange('brand_name', e.target.value);
  };

  const handleScoreChange = (scoreType: 'sustainability' | 'ethical' | 'durability', value: number | null) => {
    handleFilterChange(`min_${scoreType}_score` as any, value);
  };

  const handleAttributeToggle = (attributeId: string) => {
    const currentAttributes = globalFilters.attribute_ids;
    const newAttributes = currentAttributes.includes(attributeId)
      ? currentAttributes.filter((id) => id !== attributeId)
      : [...currentAttributes, attributeId];
    handleFilterChange('attribute_ids', newAttributes);
  };

  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleSortChange(e.target.value, globalFilters.sort_order || 'desc'); // Default order if not set
  };

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleSortChange(globalFilters.sort_by || 'overall_score', e.target.value as 'asc' | 'desc'); // Default sort field if not set
  };

  // Update range sliders from global filters on initial load or when filters change
  useEffect(() => {
    // These effects might be redundant if globalFilters are always in sync with currentFiltersState used by UI
    // Keeping them for now to ensure UI reflects Zustand state accurately.
    // setSustainabilityRange([globalFilters.min_sustainability_score ?? 0, 5]);
    // setEthicalRange([globalFilters.min_ethical_score ?? 0, 5]);
    // setDurabilityRange([globalFilters.min_durability_score ?? 0, 5]);
  }, [globalFilters.min_sustainability_score, globalFilters.min_ethical_score, globalFilters.min_durability_score]);

  const getAttributeTypeLabel = (type: string) => {
    switch(type) {
        case 'sustainability': return 'Sustainability Features';
        case 'ethical': return 'Ethical Certifications';
        case 'durability': return 'Durability Features';
        default: return 'Other Attributes';
    }
  };
  
  // Group attributes by type for filter UI
  const sustainabilityAttributes = fetchedAttributes.filter(attr => attr.attribute_type === 'sustainability');
  const ethicalAttributes = fetchedAttributes.filter(attr => attr.attribute_type === 'ethical');
  const durabilityAttributes = fetchedAttributes.filter(attr => attr.attribute_type === 'durability');

  // Determine page title based on filters
  const getPageTitle = () => {
    if (currentFiltersState.search_term) return `Search Results for "${currentFiltersState.search_term}"`;
    if (currentFiltersState.category_id) {
      const category = fetchedCategories.find(cat => cat.category_id === currentFiltersState.category_id);
      return category ? category.name : `Products in ${currentFiltersState.category_id}`;
    }
    if (currentFiltersState.brand_name) return `Products from ${currentFiltersState.brand_name}`;
    return 'All Products';
  };
  
  // Handle "No Results Found" state
  const showNoResultsMessage = !isLoading && !isError && (data?.products.length === 0);

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">{getPageTitle()}</h1>
        <div className="flex items-center space-x-4">
           {/* Page Size Selector */}
           <div className="flex items-center space-x-2">
             <label htmlFor="pageSizeInput" className="text-sm text-gray-700">Items per page:</label>
             <select
               id="pageSizeInput"
               value={currentFiltersState.pageSize}
               onChange={handlePageSizeChange}
               className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
             >
               <option value="10">10</option>
               <option value="20">20</option>
               <option value="50">50</option>
               <option value="100">100</option>
             </select>
           </div>

          {/* Sorting Controls */}
          <div className="flex items-center space-x-2">
            <label htmlFor="sortBySelect" className="text-sm text-gray-700">Sort by:</label>
            <select
              id="sortBySelect"
              value={currentFiltersState.sort_by || ''}
              onChange={handleSortByChange}
              className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Select...</option>
              <option value="overall_score">Overall Score</option>
              <option value="sustainability_score">Sustainability Score</option>
              <option value="ethical_score">Ethical Score</option>
              <option value="durability_score">Durability Score</option>
              <option value="name">Product Name</option>
              <option value="brand_name">Brand Name</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
             <label htmlFor="sortOrderSelect" className="text-sm text-gray-700">Order:</label>
            <select
              id="sortOrderSelect"
              value={currentFiltersState.sort_order || ''}
              onChange={handleSortOrderChange}
              className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filter Panel - Collapsible/Sidebar */}
        <aside className={`lg:col-span-1 ${isLoading ? 'lg:pointer-events-none lg:opacity-50' : ''} `}>
          <div className="sticky top-28 border border-gray-200 rounded-md p-6 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                 <button
                    onClick={clearAllFiltersHandler}
                    className="text-sm text-indigo-600 hover:text-indigo-800 disabled:text-gray-400"
                    disabled={!globalFilters.search_term && !globalFilters.category_id && !globalFilters.brand_name && 
                                globalFilters.min_sustainability_score === null && globalFilters.min_ethical_score === null && 
                                globalFilters.min_durability_score === null && globalFilters.attribute_ids.length === 0}
                 >
                    Clear All
                </button>
            </div>

            {/* Search Input */}
            <div className="mb-6">
              <label htmlFor="filterSearchInput" className="block text-sm font-medium text-gray-700 mb-1">Search Products</label>
              <input
                type="text"
                id="filterSearchInput"
                value={currentFiltersState.search_term ?? ''}
                onChange={(e) => handleFilterChange('search_term', e.target.value || null)}
                placeholder="Search by name or brand..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <label htmlFor="filterCategorySelect" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                id="filterCategorySelect"
                value={currentFiltersState.category_id || ''}
                onChange={handleCategorySelect}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Categories</option>
                {fetchedCategories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div className="mb-6">
              <label htmlFor="filterBrandInput" className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input
                type="text"
                id="filterBrandInput"
                value={currentFiltersState.brand_name ?? ''}
                onChange={handleBrandInputChange}
                placeholder="Filter by brand..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Score Filters (using simple input for min value, could be range/slider) */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Scores (Min Value)</label>
               
                {/* Sustainability Score */}
                <div className="flex flex-col mb-3">
                    <label htmlFor="filterSustainabilityInput" className="text-xs text-gray-600 mb-1">Sustainability</label>
                    <input
                        type="number"
                        id="filterSustainabilityInput"
                        min="1" max="5" step="0.1"
                        value={currentFiltersState.min_sustainability_score ?? ''}
                        onChange={(e) => handleScoreChange('sustainability', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="e.g., 4.0"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                </div>

                 {/* Ethical Score */}
                <div className="flex flex-col mb-3">
                    <label htmlFor="filterEthicalInput" className="text-xs text-gray-600 mb-1">Ethical</label>
                     <input
                        type="number"
                        id="filterEthicalInput"
                        min="1" max="5" step="0.1"
                        value={currentFiltersState.min_ethical_score ?? ''}
                        onChange={(e) => handleScoreChange('ethical', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="e.g., 4.0"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                </div>

                 {/* Durability Score */}
                 <div className="flex flex-col">
                    <label htmlFor="filterDurabilityInput" className="text-xs text-gray-600 mb-1">Durability</label>
                    <input
                        type="number"
                        id="filterDurabilityInput"
                        min="1" max="5" step="0.1"
                        value={currentFiltersState.min_durability_score ?? ''}
                        onChange={(e) => handleScoreChange('durability', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="e.g., 4.0"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                </div>
            </div>

            {/* Attribute Filters */}
            {sustainabilityAttributes.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">{getAttributeTypeLabel('sustainability')}</label>
                {sustainabilityAttributes.map((attr) => (
                  <div key={attr.attribute_id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={`attr_${attr.attribute_id}`}
                      checked={currentFiltersState.attribute_ids.includes(attr.attribute_id)}
                      onChange={() => handleAttributeToggle(attr.attribute_id)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor={`attr_${attr.attribute_id}`} className="ml-2 text-sm text-gray-700">{attr.name}</label>
                  </div>
                ))}
              </div>
            )}
             {ethicalAttributes.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">{getAttributeTypeLabel('ethical')}</label>
                {ethicalAttributes.map((attr) => (
                  <div key={attr.attribute_id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={`attr_${attr.attribute_id}`}
                      checked={currentFiltersState.attribute_ids.includes(attr.attribute_id)}
                      onChange={() => handleAttributeToggle(attr.attribute_id)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor={`attr_${attr.attribute_id}`} className="ml-2 text-sm text-gray-700">{attr.name}</label>
                  </div>
                ))}
              </div>
            )}
             {durabilityAttributes.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">{getAttributeTypeLabel('durability')}</label>
                {durabilityAttributes.map((attr) => (
                  <div key={attr.attribute_id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={`attr_${attr.attribute_id}`}
                      checked={currentFiltersState.attribute_ids.includes(attr.attribute_id)}
                      onChange={() => handleAttributeToggle(attr.attribute_id)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor={`attr_${attr.attribute_id}`} className="ml-2 text-sm text-gray-700">{attr.name}</label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Product Display Area */}
        <section className="lg:col-span-3">
          {isLoading && (
            <div className="flex justify-center items-center h-full py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <p className="text-red-600 text-lg mb-4">Error loading products.</p>
              <p className="text-red-500 mb-4">{error.message || 'An unknown error occurred.'}</p>
              <button
                onClick={() => refetch()} // Refetch button should be available
                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Retry
              </button>
            </div>
          )}

          {showNoResultsMessage && (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <p className="text-gray-600 text-lg mb-4">No products found matching your criteria.</p>
              <p className="text-gray-500 mb-4">Try adjusting your filters or search terms.</p>
               <button 
                onClick={clearAllFiltersHandler} 
                className="px-6 py-2 bg-indigo-100 text-indigo-700 font-semibold rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:outline-purple-500 focus:outline-offset-2">
                  Clear Filters
              </button>
            </div>
          )}

          {!isLoading && !isError && data && data.products.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.products.map((product) => (
                  <ProductCardComponent key={product.product_id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="mt-10 flex justify-center items-center space-x-4">
                  <button
                    onClick={() => handlePageChange(currentFiltersState.page - 1)}
                    disabled={currentFiltersState.page <= 1}
                    className="px-3 py-1 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentFiltersState.page} of {data.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentFiltersState.page + 1)}
                    disabled={currentFiltersState.page >= data.pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
};

export default UV_ProductListing;
import React, { useState, useEffect, Fragment } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Popover, Transition, Menu, Disclosure } from '@headlessui/react';
import { ChevronDownIcon, MagnifyingGlassIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios'; // Assuming axios is available globally or installed

// Importing types and store hook from global state management
import { useAppStore, Category } from '@/store/main';
import { API_BASE_URL } from '@/config'; // Assuming API_BASE_URL is exported from config

// --- Mock/Placeholder Interfaces (if not globally defined) ---
// These should ideally align with the backend OpenAPI spec and global state types.
// For GV_TopNavigation, we primarily need Category type and Auth related info.

interface HeaderCategoryItem {
  category_id: string;
  name: string;
}

// Type guard for better type safety when reading from Zustand
const isCategoryArray = (data: any): data is HeaderCategoryItem[] => {
  return Array.isArray(data) && data.every(
    (item) => typeof item.category_id === 'string' && typeof item.name === 'string'
  );
};

// --- API Fetching Function for Categories ---
const fetchCategories = async (): Promise<HeaderCategoryItem[]> => {
  const { data } = await useAppStore.getState().categories.items; // Check if categories are already in Zustand store
  
  // Check if categories are already loaded and not in an error state
  if (data && data.length > 0) {
    return data;
  }

  // If not in store or store is in error state, fetch from API
  // Using the global apiService from the store setup is preferred if available globally
  // Otherwise, create a temporary axios instance
  const apiClient = axios.create({
    baseURL: API_BASE_URL,
  });

  try {
    const response = await apiClient.get<HeaderCategoryItem[]>('/categories');
    const fetchedCategories = response.data;
    if (isCategoryArray(fetchedCategories)) {
      useAppStore.getState().set_categories(fetchedCategories);
      return fetchedCategories;
    } else {
      throw new Error('Invalid category data received from API.');
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    // Throwing error for react-query to handle
    throw error;
  }
};

const GV_TopNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Hook to track location changes
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Accessing global state via Zustand hook
  const isAuthenticated = useAppStore((state) => state.auth.is_authenticated);
  const username = useAppStore((state) => state.auth.username);
  const userId = useAppStore((state) => state.auth.user_id);
  const handleLogout = useAppStore((state) => state.handleLogout);
  const setCategoriesInStore = useAppStore((state) => state.set_categories);
  const clearAllFilters = useAppStore((state) => state.clear_all_filters);
  const setCategoryFilter = useAppStore((state) => state.set_category_filter); // For category links filtering

  // Fetch categories using React Query, checking Zustand store first
  const { data: categories, isLoading: isLoadingCategories, error: categoriesError } = useQuery<HeaderCategoryItem[], Error>({
    queryKey: ['globalCategories'],
    queryFn: async () => {
      const currentCategories = useAppStore.getState().categories.items;
      if (isCategoryArray(currentCategories) && currentCategories.length > 0) {
        return currentCategories;
      }
      
      // Use a stable API service instance if available, otherwise create one.
      // Assuming apiService is exportable from store setup or config.
      const apiClient = axios.create({ baseURL: API_BASE_URL });
      
      try {
        const response = await apiClient.get<HeaderCategoryItem[]>('/categories');
        const fetchedCategories = response.data;
        if (isCategoryArray(fetchedCategories)) {
          setCategoriesInStore(fetchedCategories);
          return fetchedCategories;
        } else {
          throw new Error('Invalid category data received from API.');
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Throwing error for react-query to handle
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes, allows for updates without constant refetching
    refetchOnWindowFocus: false, // Avoid refetching on window focus if already in store
  });

  // State for mobile menu toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (event?: React.FormEvent) => {
    event?.preventDefault(); // Prevent default form submission if triggered by event
    if (searchQuery.trim()) {
      // Navigate to the product listing page with the search query
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  
  const handleCategoryClick = async (category_id: string) => {
    try {
      clearAllFilters();
      setCategoryFilter(category_id);
      navigate(`/products?category_id=${category_id}`);
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Error handling category click:', error);
      // Optionally show a user-friendly error message
    }
  };

  const handleLogoutClick = () => {
    handleLogout(); // Calls the logout action from Zustand store
    navigate('/login'); // Redirect to login page after logout
  };

  // Effect to close mobile menu on navigation
  useEffect(() => {
    // Close the mobile menu if it's open and the location changes
    if (isMobileMenuOpen && location.pathname) {
      setIsMobileMenuOpen(false);
    }
  }, [location.pathname, isMobileMenuOpen]); // Depend on pathname to trigger closure

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Logo and Browse section */}
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="text-xl font-bold text-green-600">SustainaReview</span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-baseline space-x-4">
              <Link
                to="/products"
                className="text-gray-700 hover:bg-gray-50 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Browse Products
              </Link>
              
              {/* Categories Dropdown */}
              <Popover className="relative" as={Fragment}>
                {({ open }) => (
                  <>
                    <Popover.Button className="group inline-flex items-center rounded-md bg-white text-base font-normal text-gray-700 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 hover:bg-gray-50 transition-colors duration-200 px-3 py-2">
                      <span>Categories</span>
                      <ChevronDownIcon
                        className={`ml-2 h-5 w-5 transition duration-150 ease-in-out group-hover:text-green-500 ${open ? 'text-green-600' : 'text-gray-400'}`}
                        aria-hidden="true"
                      />
                    </Popover.Button>

                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="opacity-0 translate-y-1"
                      enterTo="opacity-100 translate-y-0"
                      leave="transition ease-in duration-150"
                      leaveFrom="opacity-100 translate-y-0"
                      leaveTo="opacity-0 translate-y-1"
                    >
                      <Popover.Panel className="absolute left-0 z-10 mt-3 w-56 max-w-md transform px-2 sm:px-0 lg:ml-0 lg:left-1/2 lg:-translate-x-1/2">
                        <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden bg-white">
                          {isLoadingCategories ? (
                            <div className="px-4 py-4 text-center text-gray-500">Loading categories...</div>
                          ) : categoriesError ? (
                            <div className="px-4 py-4 text-center text-red-500">Error loading categories</div>
                          ) : (
                            <div className="relative grid gap-6 px-5 py-6 sm:gap-8 sm:p-8">
                              {categories && categories.map((category) => (
                                <Link
                                  key={category.category_id}
                                  to={`/categories/${category.category_id}`}
                                  onClick={(e) => {
                                      e.preventDefault(); // Prevent default link behavior to handle store updates and navigation
                                      handleCategoryClick(category.category_id)
                                  }}
                                  className="p-3 flex items-start rounded-lg hover:bg-gray-50 hover:text-green-600 transition-colors duration-200 -m-3"
                                >
                                  <div className="ml-4">
                                    <p className="text-base font-medium text-gray-900">{category.name}</p>
                                    {/* <p className="mt-1 text-sm text-gray-500">
                                      {category.description || `Explore ${category.name} products`}
                                    </p> */}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      </Popover.Panel>
                    </Transition>
                  </>
                )}
              </Popover>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
            <form onSubmit={handleSearchSubmit} className="w-full max-w-lg flex">
              <label htmlFor="search" className="sr-only">Search</label>
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full py-2 pl-10 pr-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:placeholder-gray-400 sm:text-sm transition duration-150 ease-in-out"
                  placeholder="Search products..."
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>

          {/* Right side: Auth Controls / User Menu */}
          <div className="hidden md:flex items-center">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="ml-4 px-4 py-2 bg-green-500 text-white rounded-md shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <Menu as="div" className="ml-3 relative">
                <div>
                  <Menu.Button className="max-w-xs bg-white rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    <span className="sr-only">Open user menu</span>
                    {/* Placeholder for Avatar */}
                    <div className="h-10 w-10 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-semibold">
                      {username ? username.charAt(0).toUpperCase() : '?'}
                    </div>
                    <span className="ml-2 text-gray-700 font-medium">{username || 'User'}</span>
                    <ChevronDownIcon className="h-5 w-5 text-gray-400 ml-1" aria-hidden="true" />
                  </Menu.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {/* User Profile Link */}
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/profile"
                          className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700 hover:text-green-600 transition-colors duration-200`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Your Profile
                        </Link>
                      )}
                    </Menu.Item>
                    {/* User Activity Link */}
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/activity"
                          className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700 hover:text-green-600 transition-colors duration-200`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Activity Dashboard
                        </Link>
                      )}
                    </Menu.Item>
                    {/* Logout Button */}
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogoutClick}
                          className={`${active ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700 hover:text-green-600 transition-colors duration-200`}
                        >
                          Logout
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {/* Mobile Browse Link */}
            <Link
              to="/products"
              className="text-gray-700 hover:bg-gray-50 hover:text-green-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Browse Products
            </Link>

            {/* Mobile Categories Accordion/Dropdown */}
             <Disclosure as="div" className="relative" defaultOpen={false}>
              {({ open }) => (
                <>
                  <Disclosure.Button className="w-full text-left group inline-flex items-center rounded-md bg-white text-base font-normal text-gray-700 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 hover:bg-gray-50 transition-colors duration-200 px-3 py-2">
                    <span>Categories</span>
                    <ChevronDownIcon
                      className={`ml-auto h-5 w-5 transition duration-150 ease-in-out group-hover:text-green-500 ${open ? 'rotate-180 text-green-600' : 'text-gray-400'}`}
                      aria-hidden="true"
                    />
                  </Disclosure.Button>
                  <Disclosure.Panel static className="pt-2"> {/* static prop for always rendering */}
                    <div className="rounded-md shadow-sm ring-1 ring-black ring-opacity-5 overflow-hidden bg-gray-50">
                      {isLoadingCategories ? (
                        <div className="px-4 py-2 text-center text-gray-500">Loading categories...</div>
                      ) : categoriesError ? (
                        <div className="px-4 py-2 text-center text-red-500">Error loading categories</div>
                      ) : (
                        <div className="grid gap-3 px-4 py-3">
                          {categories && categories.map((category) => (
                            <Link
                              key={category.category_id}
                              to={`/categories/${category.category_id}`}
                              onClick={(e) => {
                                e.preventDefault();
                                handleCategoryClick(category.category_id);
                              }}
                              className="p-2 flex items-center rounded-md hover:bg-white hover:text-green-600 transition-colors duration-200 text-sm font-medium text-gray-800"
                            >
                              {category.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>

            {/* Mobile User Auth */}
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:bg-gray-50 hover:text-green-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-md text-base font-semibold text-green-600 hover:bg-gray-50 hover:text-green-700 transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <div className="pt-3 mt-3 border-t border-gray-200">
                <Menu as="div" className="relative px-3">
                    <div>
                        <Menu.Button className="max-w-xs bg-white rounded-md flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-full justify-between">
                            <span className="sr-only">Open user menu</span>
                            <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-semibold mr-3">
                                    {username ? username.charAt(0).toUpperCase() : '?'}
                                </div>
                                <span className="text-gray-800 font-medium">{username || 'User'}</span>
                            </div>
                            <ChevronDownIcon className="h-5 w-5 text-gray-400 ml-1" aria-hidden="true" />
                        </Menu.Button>
                    </div>
                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-full rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <Menu.Item>
                                {({ active }) => (
                                    <Link
                                        to="/profile"
                                        className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700 hover:text-green-600 transition-colors duration-200`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Your Profile
                                    </Link>
                                )}
                            </Menu.Item>
                            <Menu.Item>
                                {({ active }) => (
                                    <Link
                                        to="/activity"
                                        className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700 hover:text-green-600 transition-colors duration-200`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Activity Dashboard
                                    </Link>
                                )}
                            </Menu.Item>
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={handleLogoutClick}
                                        className={`${active ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700 hover:text-green-600 transition-colors duration-200`}
                                    >
                                        Logout
                                    </button>
                                )}
                            </Menu.Item>
                        </Menu.Items>
                    </Transition>
                </Menu>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default GV_TopNavigation;
import axios, { AxiosInstance } from 'axios';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// --- API Base URL ---
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}`;

// --- API Service Instance ---
const apiService: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// --- Types and Interfaces ---

// Auth State Types
export interface AuthState {
  is_authenticated: boolean;
  user_id: string | null;
  username: string | null;
  email: string | null;
  access_token: string | null;
  token_expiration: number | null;
  loading: boolean;
  error: string | null;
}

// Products State Types
export interface ProductCard {
  product_id: string;
  name: string;
  brand_name: string;
  primary_image_url: string;
  overall_score: number | null;
  sustainability_score: number | null;
  ethical_score: number | null;
  durability_score: number | null;
}

export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalProducts: number;
}

export interface ProductsState {
  items: ProductCard[];
  pagination: PaginationInfo;
  loading: boolean;
  error: string | null;
}

// Filters and Sorting State Types
export interface FiltersState {
  search_term: string | null;
  category_id: string | null;
  brand_name: string | null;
  min_sustainability_score: number | null;
  min_ethical_score: number | null;
  min_durability_score: number | null;
  attribute_ids: string[];
  sort_by: string | null;
  sort_order: string | null;
}

// Category State Types
export interface Category {
  category_id: string;
  name: string;
  description?: string | null;
}

export interface CategoriesState {
  items: Category[];
  loading: boolean;
  error: string | null;
}

// Attribute State Types
export interface Attribute {
  attribute_id: string;
  name: string;
  attribute_type: 'sustainability' | 'ethical' | 'durability';
}

export interface AttributesState {
  items: Attribute[];
  loading: boolean;
  error: string | null;
}

// Notifications State Types
export interface NotificationState {
  message: string | null;
  type: 'info' | 'success' | 'warning' | 'error';
  visible: boolean;
}

// --- Global State Interface ---
export interface AppState {
  auth: AuthState;
  products: ProductsState;
  filters: FiltersState;
  categories: CategoriesState;
  attributes: AttributesState;
  notifications: NotificationState;

  // Actions to manage state
  // Auth Actions
  set_auth_user: (user_data: Partial<AuthState>) => void;
  set_auth_loading: (loading: boolean) => void;
  set_auth_error: (error: string | null) => void;
  clear_auth_state: () => void;

  // Products Actions
  set_products_data: (products: ProductCard[]) => void;
  set_pagination_info: (pagination: PaginationInfo) => void;
  set_products_loading: (loading: boolean) => void;
  set_products_error: (error: string | null) => void;
  clear_products_data: () => void;

  // Filters and Sorting Actions
  set_search_term: (term: string | null) => void;
  set_category_filter: (category_id: string | null) => void;
  set_brand_filter: (brand_name: string | null) => void;
  set_score_filter: (
    score_type: 'sustainability' | 'ethical' | 'durability',
    value: number | null
  ) => void;
  toggle_attribute_filter: (attribute_id: string) => void;
  set_attribute_filters: (attribute_ids: string[]) => void;
  set_sort: (sort_by: string | null, sort_order: ('asc' | 'desc') | null) => void;
  clear_all_filters: () => void;

  // Categories Actions
  set_categories: (categories: Category[]) => void;
  set_categories_loading: (loading: boolean) => void;
  set_categories_error: (error: string | null) => void;

  // Attributes Actions
  set_attributes: (attributes: Attribute[]) => void;
  set_attributes_loading: (loading: boolean) => void;
  set_attributes_error: (error: string | null) => void;

  // Notifications Actions
  show_notification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  hide_notification: () => void;

  // Initialization Action
  initialize_app: () => Promise<void>;
}

// --- Zustand Store Implementation ---

const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // --- Initial State ---
      auth: {
        is_authenticated: false,
        user_id: null,
        username: null,
        email: null,
        access_token: null,
        token_expiration: null,
        loading: true,
        error: null,
      },
      products: {
        items: [],
        pagination: {
          currentPage: 1,
          pageSize: 20,
          totalPages: 0,
          totalProducts: 0,
        },
        loading: false,
        error: null,
      },
      filters: {
        search_term: null,
        category_id: null,
        brand_name: null,
        min_sustainability_score: null,
        min_ethical_score: null,
        min_durability_score: null,
        attribute_ids: [],
        sort_by: null,
        sort_order: null,
      },
      categories: {
        items: [],
        loading: false,
        error: null,
      },
      attributes: {
        items: [],
        loading: false,
        error: null,
      },
      notifications: {
        message: null,
        type: 'info',
        visible: false,
      },

      // --- Auth Actions ---
      set_auth_user: (user_data) =>
        set((state) => ({
          auth: { ...state.auth, ...user_data, loading: false, error: null },
        })),
      set_auth_loading: (loading) =>
        set((state) => ({
          auth: { ...state.auth, loading },
        })),
      set_auth_error: (error) =>
        set((state) => ({
          auth: { ...state.auth, error, loading: false },
        })),
      clear_auth_state: () =>
        set((state) => ({
          auth: {
            ...state.auth,
            is_authenticated: false,
            user_id: null,
            username: null,
            email: null,
            access_token: null,
            token_expiration: null,
            error: null,
          },
        })),

      // --- Products Actions ---
      set_products_data: (products) =>
        set((state) => ({
          products: { ...state.products, items: products },
        })),
      set_pagination_info: (pagination) =>
        set((state) => ({
          products: { ...state.products, pagination },
        })),
      set_products_loading: (loading) =>
        set((state) => ({
          products: { ...state.products, loading },
        })),
      set_products_error: (error) =>
        set((state) => ({
          products: { ...state.products, error, loading: false },
        })),
      clear_products_data: () =>
        set({
          products: {
            items: [],
            pagination: {
              currentPage: 1,
              pageSize: 20,
              totalPages: 0,
              totalProducts: 0,
            },
            loading: false,
            error: null,
          },
        }),

      // --- Filters and Sorting Actions ---
      set_search_term: (term) =>
        set((state) => ({
          filters: { ...state.filters, search_term: term, category_id: null, brand_name: null, attribute_ids: [], min_sustainability_score: null, min_ethical_score: null, min_durability_score:null }, // Reset other filters when search term changes
        })),
      set_category_filter: (category_id) =>
        set((state) => ({
          filters: { ...state.filters, category_id },
        })),
      set_brand_filter: (brand_name) =>
        set((state) => ({
          filters: { ...state.filters, brand_name },
        })),
      set_score_filter: (score_type, value) =>
        set((state) => ({
          filters: { ...state.filters, [`min_${score_type}_score`]: value },
        })),
      toggle_attribute_filter: (attribute_id) =>
        set((state) => {
          const current_attributes = state.filters.attribute_ids;
          const updated_attributes = current_attributes.includes(attribute_id)
            ? current_attributes.filter((id) => id !== attribute_id)
            : [...current_attributes, attribute_id];
          return {
            filters: { ...state.filters, attribute_ids: updated_attributes },
          };
        }),
      set_attribute_filters: (attribute_ids) =>
         set((state) => ({
           filters: { ...state.filters, attribute_ids },
         })),
      set_sort: (sort_by, sort_order) =>
        set((state) => ({
          filters: { ...state.filters, sort_by, sort_order },
        })),
      clear_all_filters: () =>
        set({
          filters: {
            search_term: null,
            category_id: null,
            brand_name: null,
            min_sustainability_score: null,
            min_ethical_score: null,
            min_durability_score: null,
            attribute_ids: [],
            sort_by: null,
            sort_order: null,
          },
        }),

      // --- Categories Actions ---
      set_categories: (categories) =>
        set((state) => ({
          categories: { ...state.categories, items: categories, loading: false, error: null },
        })),
      set_categories_loading: (loading) =>
        set((state) => ({
          categories: { ...state.categories, loading },
        })),
      set_categories_error: (error) =>
        set((state) => ({
          categories: { ...state.categories, error, loading: false },
        })),

      // --- Attributes Actions ---
      set_attributes: (attributes) =>
        set((state) => ({
          attributes: { ...state.attributes, items: attributes, loading: false, error: null },
        })),
      set_attributes_loading: (loading) =>
        set((state) => ({
          attributes: { ...state.attributes, loading },
        })),
      set_attributes_error: (error) =>
        set((state) => ({
          attributes: { ...state.attributes, error, loading: false },
        })),

      // --- Notifications Actions ---
      show_notification: (message, type = 'info') =>
        set((state) => ({
          notifications: { message, type, visible: true },
        })),
      hide_notification: () =>
        set((state) => ({
          notifications: { ...state.notifications, visible: false, message: null },
        })),

      // --- Initialization Action ---
      initialize_app: async () => {
        try {
          get().set_auth_loading(true);

          // 1. Authenticate if token exists
          const storedAuth = get().auth; // Access auth state directly
          if (storedAuth.access_token && storedAuth.token_expiration && storedAuth.token_expiration > Date.now()) {
            try {
              // Simulate fetching user data to validate token
              const response = await apiService.get<{ user_id: string; username: string; email: string }>(
                '/users/me',
                {
                  headers: {
                    Authorization: `Bearer ${storedAuth.access_token}`,
                  },
                }
              );
              get().set_auth_user({
                is_authenticated: true,
                user_id: response.data.user_id,
                username: response.data.username,
                email: response.data.email,
                access_token: storedAuth.access_token,
                token_expiration: storedAuth.token_expiration,
              });
            } catch (authError) {
              console.error("Token validation failed:", authError);
              get().clear_auth_state(); // Clear auth state if token is invalid
              get().show_notification("Session expired. Please log in again.", 'warning');
            }
          } else {
             get().clear_auth_state(); // Ensure clean state if token is missing or expired
          }

          // 2. Fetch Categories
          if (get().categories.items.length === 0) {
            get().set_categories_loading(true);
            try {
              const response = await apiService.get<Category[]>('/categories');
              get().set_categories(response.data);
            } catch (categoriesError) {
              console.error("Failed to fetch categories:", categoriesError);
              get().set_categories_error("Could not load categories.");
              get().show_notification("Failed to load categories.", 'error');
            }
          }

          // 3. Fetch Attributes
          if (get().attributes.items.length === 0) {
            get().set_attributes_loading(true);
            try {
              const response = await apiService.get<Attribute[]>('/attributes');
              get().set_attributes(response.data);
            } catch (attributesError) {
              console.error("Failed to fetch attributes:", attributesError);
              get().set_attributes_error("Could not load attributes.");
               get().show_notification("Failed to load attributes.", 'error');
            }
          }

        } catch (err) {
          console.error("App initialization error:", err);
          // General error handling if any part of initialization fails unexpectedly
          get().set_auth_error("An unexpected error occurred during initialization.");
          get().show_notification("App initialization failed.", 'error');
        } finally {
          get().set_auth_loading(false); // Ensure loading state is turned off regardless of outcome
        }
      },
    }),
    {
      name: 'sustainareview-store', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, window.localStorage is used
      partialize: (state) => ({ // Keep only specific states in localStorage
        auth: {
          is_authenticated: state.auth.is_authenticated,
          user_id: state.auth.user_id,
          username: state.auth.username,
          email: state.auth.email,
          access_token: state.auth.access_token,
          token_expiration: state.auth.token_expiration,
        },
        categories: {
          items: state.categories.items,
          loading: false, // Don't persist loading/error states
          error: null,
        },
        attributes: {
          items: state.attributes.items,
          loading: false, // Don't persist loading/error states
          error: null,
        },
      }),
      // Optional: Handle rehydration errors or check token validity after load
      // onRehydrateStorage: (state) => {
      //   return (state, options) => {
      //     if (state && state.auth && state.auth.token_expiration && state.auth.token_expiration < Date.now()) {
      //        console.log("Rehydrated token is expired. Clearing auth state.");
      //        // Potentially call clear_auth_state here or trigger re-validation
      //        // state.clear_auth_state(); // Be careful with direct state mutation without set
      //     } else if(state && state.auth && state.auth.access_token) {
      //        // Optionally trigger validation on rehydration
      //        console.log("Rehydrated with a potentially valid token. Will validate on init.");
      //     }
      //   };
      // },
    }
  )
);

// Export the store hook and types
export const useAppStore = useAppStore;
export type {
  AuthState,
  ProductCard,
  PaginationInfo,
  ProductsState,
  FiltersState,
  Category,
  CategoriesState,
  Attribute,
  AttributesState,
  NotificationState,
  AppState,
};
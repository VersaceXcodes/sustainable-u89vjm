import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import Global Views
import GV_TopNavigation from '@/components/views/GV_TopNavigation.tsx';
import GV_Footer from '@/components/views/GV_Footer.tsx';

// Import Unique Views
import UV_Landing from '@/components/views/UV_Landing.tsx';
import UV_ProductListing from '@/components/views/UV_ProductListing.tsx';
import UV_SearchResults from '@/components/views/UV_SearchResults.tsx';
import UV_ProductDetail from '@/components/views/UV_ProductDetail.tsx';
import UV_ReviewSubmission from '@/components/views/UV_ReviewSubmission.tsx';
import UV_UserProfile from '@/components/views/UV_UserProfile.tsx';
import UV_UserActivityDashboard from '@/components/views/UV_UserActivityDashboard.tsx';
import UV_Login from '@/components/views/UV_Login.tsx';
import UV_Registration from '@/components/views/UV_Registration.tsx';
import UV_ForgotPassword from '@/components/views/UV_ForgotPassword.tsx';
import UV_ResetPasswordForm from '@/components/views/UV_ResetPasswordForm.tsx';
import UV_TermsOfService from '@/components/views/UV_TermsOfService.tsx';
import UV_PrivacyPolicy from '@/components/views/UV_PrivacyPolicy.tsx';
import UV_CategoryList from '@/components/views/UV_CategoryList.tsx';

// Import the Zustand store and its initialization function
import { useAppStore } from '@/store/main';

// Instantiate the QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000,  // 30 minutes
      refetchOnWindowFocus: true,
    },
  },
});

// Global Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    // Log error to a service like Sentry or LogRocket here
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 p-4">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <p className="text-center mb-4">
            An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
          </p>
          {/* Optionally, display error details for debugging during development */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="w-full text-left bg-white p-4 rounded shadow-inner">
              <summary className="font-semibold cursor-pointer">Error Details</summary>
              <pre className="text-xs overflow-x-auto mt-2">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  // Initialize the app state (fetches categories, attributes, checks auth token)
  const initializeApp = useAppStore((state) => state.initialize_app);

  useEffect(() => {
    // Ensure initializeApp is a stable function reference or managed by React/Zustand appropriately.
    // If initializeApp is recreated on every render (unlikely but possible), you'd need useCallback.
    initializeApp();
  }, [initializeApp]); // Dependency array ensures it runs only when initializeApp reference changes (ideally, once)

  return (
    // StrictMode for development-time checks
    <React.StrictMode>
      {/* BrowserRouter provides routing context */}
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <div className="flex flex-col min-h-screen"> {/* Use flexbox for layout */}
            <GV_TopNavigation />

            <main className="flex-grow container mx-auto px-4 py-8"> {/* Main content area */}
              <ErrorBoundary> {/* Global error handling for routed components */}
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<UV_Landing />} />
                  <Route path="/products" element={<UV_ProductListing />} />
                  <Route
                    path="/search"
                    element={<UV_SearchResults />}
                    // Note: UV_SearchResults will likely internally use UV_ProductListing
                    // or accept the search query and apply filters to a generic listing component.
                    // Based on the description, UV_SearchResults is functionally identical to UV_ProductListing
                    // but contextually for search, hence mapping to UV_SearchResults component.
                  />
                  <Route path="/products/:product_id" element={<UV_ProductDetail />} />
                  <Route path="/categories" element={<UV_CategoryList />} />
                  <Route path="/categories/:category_id" element={<UV_ProductListing />} />

                  {/* Authentication Flows */}
                  <Route path="/login" element={<UV_Login />} />
                  <Route path="/register" element={<UV_Registration />} />
                  <Route path="/forgot-password" element={<UV_ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<UV_ResetPasswordForm />} />

                  {/* Legal */}
                  <Route path="/terms-of-service" element={<UV_TermsOfService />} />
                  <Route path="/privacy-policy" element={<UV_PrivacyPolicy />} />

                  {/* Authenticated User Routes */}
                  {/* Note: Actual auth protection should be handled inside these components
                      or via a wrapper if needed, as per prompt instructions.
                      This setup allows routing to them, and components decide rendering. */}
                  <Route path="/profile" element={<UV_UserProfile />} />
                  <Route path="/activity" element={<UV_UserActivityDashboard />} />
                  <Route path="/products/:product_id/reviews" element={<UV_ReviewSubmission />} />

                  {/* Catch-all or 404 route */}
                  {/* <Route path="*" element={<NotFoundPage />} /> */}
                </Routes>
              </ErrorBoundary>
            </main>

            <GV_Footer />
          </div>
        </QueryClientProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
};

export default App;
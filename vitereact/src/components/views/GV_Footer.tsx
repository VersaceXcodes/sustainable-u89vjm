import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Defines the GV_Footer component.
 *
 * This component renders a persistent footer at the bottom of the application.
 * It includes copyright information and links to the Terms of Service and Privacy Policy pages.
 * It is designed to be stateless and purely presentational.
 *
 * @returns A React Fragment containing the footer structure.
 */
const GV_Footer: React.FC = () => {
  // Get the current year dynamically for the copyright notice
  const current_year = new Date().getFullYear();

  return (
    <footer className="w-full bg-gray-800 text-white py-4 px-6 shadow-inner fixed bottom-0 z-10">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        {/* Copyright Information */}
        <div className="text-center md:text-left text-sm">
          © {current_year} SustainaReview. All rights reserved.
        </div>

        {/* Links Section */}
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 text-center text-sm">
          <Link
            to="/terms-of-service"
            className="hover:text-green-400 transition duration-300 ease-in-out"
          >
            Terms of Service
          </Link>
          <Link
            to="/privacy-policy"
            className="hover:text-green-400 transition duration-300 ease-in-out"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default GV_Footer;
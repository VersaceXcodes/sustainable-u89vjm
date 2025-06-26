import React from 'react';
// No other imports are necessary for this static page.

const UV_PrivacyPolicy: React.FC = () => {
  return (
    <>
      <div className="container mx-auto px-4 py-8 text-gray-800">
        <h1 className="text-4xl font-bold mb-6 text-center text-gray-900">Privacy Policy</h1>

        <div className="prose max-w-none lg:prose-lg prose-headings:text-gray-900 prose-headings:font-bold prose-ul:text-gray-800 prose-li:text-gray-800">
          <p className="mb-4">
            Last Updated: October 26, 2023
          </p>

          <p className="mb-4">
            Welcome to SustainaReview. Your privacy is important to us. This Privacy Policy describes how SustainaReview ("we," "us," or "our") collects, uses, stores, and protects your personal information when you use our website and services (the "Service").
          </p>

          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-3">1. Information We Collect</h2>
            <p className="mb-2">
              We collect information in several ways that help us provide and improve the Service:
            </p>
            <ul className="list-disc list-inside ml-4 mb-2">
              <li>
                <strong>Information You Provide Directly:</strong> This includes information you provide when you register for an account, submit reviews, or contact us. This may include:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Username</li>
                  <li>Email Address</li>
                  <li>Password (hashed and securely stored)</li>
                  <li>Review content (title, body, ratings, photos)</li>
                  <li>Contact information if you reach out to support.</li>
                </ul>
              </li>
              <li>
                <strong>Information Collected Automatically:</strong> As you use the Service, we may automatically collect certain information, such as:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Usage Data: Information about how you interact with the Service, such as pages visited, features used, and time spent on the site.</li>
                  <li>Device and Technical Information: IP address, browser type, operating system, device identifiers, and referring URLs.</li>
                  <li>Cookies and Similar Technologies: We may use cookies to enhance your experience, remember your preferences, and collect usage data.</li>
                </ul>
              </li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-3">2. How We Use Your Information</h2>
            <p className="mb-2">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc list-inside ml-4 mb-2">
              <li>To provide, maintain, and improve the Service.</li>
              <li>To process your registrations and authenticate you.</li>
              <li>To enable you to submit and display reviews.</li>
              <li>To personalize your experience on the Service.</li>
              <li>To communicate with you, including responding to your inquiries and sending service-related notifications.</li>
              <li>To analyze usage patterns and trends to improve our offerings.</li>
              <li>To ensure the security and integrity of our Service.</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-3">3. How We Share Your Information</h2>
            <p className="mb-2">
              We do not sell your personal information. We may share your information in the following limited circumstances:
            </p>
            <ul className="list-disc list-inside ml-4 mb-2">
              <li>With Your Consent: We may share information with your explicit consent.</li>
              <li>Service Providers: We may share information with third-party vendors and service providers who perform services on our behalf (e.g., hosting, data analysis), under strict confidentiality agreements.</li>
              <li>Legal Requirements: We may disclose your information if required by law or in response to valid requests by public authorities.</li>
              <li>Business Transfers: In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the transaction.</li>
            </ul>
            <p className="mt-2">
              Please note that your username and submitted reviews (excluding your email and password) will be publicly visible on the platform.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-3">4. Data Security</h2>
            <p className="mb-2">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes using industry-standard security protocols for data transmission and secure storage practices for sensitive data like passwords. However, no method of transmission over the internet or electronic storage is 100% secure.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-3">5. Your Choices and Rights</h2>
            <p className="mb-2">
              Subject to applicable law, you may have certain rights regarding your personal information, including the right to access, correct, or delete your data. You can manage your account information through your profile settings. You can also manage cookie preferences through your browser settings.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-3">6. Children's Privacy</h2>
            <p className="mb-2">
              SustainaReview is not intended for use by individuals under the age of 16. We do not knowingly collect personal information from children under 16. If we become aware that we have collected personal information from a child under 16, we will take steps to delete that information promptly.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-3">7. Changes to This Privacy Policy</h2>
            <p className="mb-2">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-3">8. Contact Us</h2>
            <p className="mb-2">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="mb-2">
              Email: <a href="mailto:support@sustainareview.com" className="text-blue-600 hover:underline">support@sustainareview.com</a>
            </p>
          </section>
        </div>
      </div>
    </>
  );
};

export default UV_PrivacyPolicy;
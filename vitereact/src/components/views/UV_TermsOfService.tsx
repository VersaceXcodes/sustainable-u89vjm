import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for potential internal navigation

const UV_TermsOfService: React.FC = () => {
  // As per the PRD, UV_TermsOfService is a static page.
  // No API calls or complex state management are required for this view.
  // The content is primarily text-based and should be presented clearly.

  // --- Configuration --- 
  // Ideally, these would come from environment variables or a configuration service
  const JURISDICTION = 'the State of California';
  const CONTACT_EMAIL = 'support@sustainareview.com';

  const termsContent = [
    {
      type: 'h2',
      content: '1. Acceptance of Terms',
      details: [
        'By accessing or using the SustainaReview website (the "Service"), you agree to be bound by these Terms of Service ("Terms"). All users who access or use the Service agree to comply with these Terms. Your access to and use of the Service is conditioned upon your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who access or use the Service.',
      ],
    },
    {
      type: 'h2',
      content: '2. Use of the Service',
      details: [
        'SustainaReview provides a platform for consumers to review products based on environmental impact, ethical sourcing, and durability. You agree to use the Service only for lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone else\'s use and enjoyment of SustainaReview.',
        'You are responsible for maintaining the confidentiality of your account information, including your password, and for all activities that occur under your account.',
        'You agree not to engage in any activity that may disrupt or interfere with the Service, including the servers and networks that host the Service.',
      ],
    },
    {
      type: 'h2',
      content: '3. User Conduct and Reviews',
      details: [
        'When submitting reviews, you agree to provide accurate and honest information. You are solely responsible for the content of your reviews.',
        'You must not post any content that is defamatory, libelous, hateful, harassing, threatening, or discriminatory.',
        'SustainaReview reserves the right to remove any content or reviews that violate these Terms or are deemed inappropriate, at our sole discretion.',
        'By submitting a review, you grant SustainaReview a perpetual, irrevocable, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, create derivative works from, distribute, and display such content throughout the world in any media.',
      ],
    },
    {
      type: 'h2',
      content: '4. Intellectual Property',
      details: [
        'The Service and its original content, features, and functionality are and will remain the exclusive property of SustainaReview and its licensors.',
        'The SustainaReview name, logo, and all related product names, design marks, and slogans are trademarks or registered trademarks of SustainaReview.',
      ],
    },
    {
      type: 'h2',
      content: '5. Links To Other Web Sites',
      details: [
        'Our Service may contain links to third-party web sites or services that are not owned or controlled by SustainaReview.',
        'SustainaReview has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third-party web sites or services.',
        'You further acknowledge and agree that SustainaReview shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such content, goods, or services available on or through any such web sites or services.',
        'We strongly advise you to read the terms and conditions and privacy policies of any third-party web sites or services that you visit.',
      ],
    },
    {
      type: 'h2',
      content: '6. Termination',
      details: [
        'We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.',
        'Upon termination, your right to use the Service will immediately cease.',
      ],
    },
    {
      type: 'h2',
      content: '7. Disclaimer',
      details: [
        'The Service and its content are provided "as is" without warranty of any kind, either expressed or implied.',
        'SustainaReview does not guarantee the accuracy, completeness, or usefulness of any product information or user reviews.',
        'Your use of the Service is at your sole risk.',
      ],
    },
    {
      type: 'h2',
      content: '8. Governing Law',
      details: [
        `These Terms shall be governed and construed in accordance with the laws of ${JURISDICTION.split(',')[0]}, without regard to its conflict of law principles.`, // Inline with config
        'Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.',
      ],
    },
    {
      type: 'h2',
      content: '9. Changes to Terms',
      details: [
        'We reserve the right, at our sole discretion, to modify or replace these Terms at any time.',
        'If a revision is material, we will try to provide at least 30 days\' notice prior to any new terms taking effect.',
        'Your continued use of our Service after any such changes constitutes your acceptance of the new Terms.',
      ],
    },
    {
      type: 'h2',
      content: '10. Contact Us',
      details: [
        `If you have any questions about these Terms, please contact us at ${CONTACT_EMAIL}.`, // Inline with config
      ],
    },
    {
      type: 'p',
      content: `Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    },
  ];

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-8 text-gray-800 dark:text-gray-200">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-green-600 dark:text-green-400">
          SustainaReview Terms of Service
        </h1>

        {termsContent.map((section, index) => {
          if (section.type === 'h2') {
            return (
              <div key={index}> {/* Added key prop */} 
                <h2 className="text-2xl font-semibold mt-6 mb-3 border-b-2 border-green-200 dark:border-green-600 pb-1">
                  {section.content}
                </h2>
                {section.details.map((detail, detailIndex) => (
                  <p key={detailIndex} className="mb-4 leading-relaxed">
                    {/* Simple check for the "Contact Us" section to format email */}
                    {section.content === '10. Contact Us' && detailIndex === 0 ? (
                      <>
                        {detail.split(`[Your Contact Email, e.g., ${CONTACT_EMAIL}]`)[0]}
                        <a
                          href={`mailto:${CONTACT_EMAIL}`}
                          className="text-green-500 hover:underline font-medium"
                        >
                          {CONTACT_EMAIL}
                        </a>
                        {detail.split(`[Your Contact Email, e.g., ${CONTACT_EMAIL}]`)[1]}
                      </>
                    ) : (
                       // Check for governing law to insert placeholder jurisdiction
                       section.content === '8. Governing Law' && detailIndex === 0 ? (
                         <>
                           {detail.split('[Your Jurisdiction, e.g., the State of California]')[0]}
                           <span className="font-semibold">{JURISDICTION.split(',')[0]}</span> {/* Use config val */}
                           {detail.split('[Your Jurisdiction, e.g., the State of California]')[1]}
                         </>
                       ) : (
                         detail
                       )
                    )}
                  </p>
                ))}
              </div>
            );
          } else if (section.type === 'p') {
            return (
              <p key={index} className="text-sm text-gray-500 dark:text-gray-400 text-center mt-8">
                {section.content}
              </p>
            );
          }
          return null; // Should not happen with current structure
        })}

        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          For any questions regarding these Terms, please refer to the contact information above or visit our{' '}
          <Link to="/privacy-policy" key="privacy-policy-link"> {/* Added key prop */} 
            Privacy Policy
          </Link>.
        </p>
      </div>
    </>
  );
};

export default UV_TermsOfService;
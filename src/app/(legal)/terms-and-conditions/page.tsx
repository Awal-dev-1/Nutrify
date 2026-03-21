const TermsAndConditionsPage = () => {
    return (
      <div className="space-y-6">
        <h1 className="text-h2 font-bold tracking-tight border-b pb-4">Terms and Conditions</h1>
        <div className="text-muted-foreground">
            <p><strong>Platform Name:</strong> Nutrify</p>
        </div>

        <section className="space-y-2">
          <h2 className="text-h3 font-semibold tracking-tight">1. Acceptance of Terms</h2>
          <p>By accessing or using Nutrify, you agree to these Terms and Conditions.</p>
          <p>If you do not agree, you should not use the platform.</p>
        </section>

        <section className="space-y-2">
            <h2 className="text-h3 font-semibold tracking-tight">2. Description of Service</h2>
            <p>Nutrify provides:</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Food tracking</li>
                <li>AI food recognition</li>
                <li>Nutrition analytics</li>
                <li>Personalized recommendations</li>
                <li>Goal management</li>
            </ul>
            <p>This system is designed for informational purposes only.</p>
        </section>

        <section className="space-y-2">
            <h2 className="text-h3 font-semibold tracking-tight">3. Not Medical Advice</h2>
            <p>Nutrify does not provide medical advice.</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Nutritional information is estimated</li>
                <li>AI recognition may not be perfectly accurate</li>
            </ul>
            <p>Always consult a healthcare professional before making medical decisions.</p>
        </section>

        <section className="space-y-2">
            <h2 className="text-h3 font-semibold tracking-tight">4. User Responsibilities</h2>
            <p>You agree to:</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Provide accurate information</li>
                <li>Keep your login credentials secure</li>
                <li>Not misuse the system</li>
                <li>Not upload harmful or illegal content</li>
            </ul>
        </section>

        <section className="space-y-2">
            <h2 className="text-h3 font-semibold tracking-tight">5. AI Limitations</h2>
            <p>AI food recognition and recommendations:</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
                <li>May contain errors</li>
                <li>Are based on algorithmic estimations</li>
                <li>Should not replace professional advice</li>
            </ul>
        </section>

        <section className="space-y-2">
            <h2 className="text-h3 font-semibold tracking-tight">6. Account Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that:</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Violate these terms</li>
                <li>Abuse the system</li>
                <li>Attempt unauthorized access</li>
            </ul>
            <p>You can manage most of these in Settings.</p>
        </section>

        <section className="space-y-2">
            <h2 className="text-h3 font-semibold tracking-tight">7. Intellectual Property</h2>
            <p>All system content, design, branding, and software are owned by Nutrify.</p>
            <p>You may not:</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Copy</li>
                <li>Redistribute</li>
                <li>Reverse engineer</li>
                <li>Resell</li>
            </ul>
            <p>any part of the platform.</p>
        </section>

        <section className="space-y-2">
            <h2 className="text-h3 font-semibold tracking-tight">8. Limitation of Liability</h2>
            <p>Nutrify is not responsible for:</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Inaccurate AI results</li>
                <li>Health outcomes</li>
                <li>Data loss beyond reasonable control</li>
                <li>Third-party service failures</li>
            </ul>
            <p>Use the platform at your own risk.</p>
        </section>

        <section className="space-y-2">
            <h2 className="text-h3 font-semibold tracking-tight">9. Modifications to the Service</h2>
            <p>We may:</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Update features</li>
                <li>Improve algorithms</li>
                <li>Modify functionality</li>
                <li>Discontinue features</li>
            </ul>
            <p>at any time without prior notice.</p>
        </section>

        <section className="space-y-2">
            <h2 className="text-h3 font-semibold tracking-tight">10. Governing Law</h2>
            <p>These Terms shall be governed by the laws of:</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Country</li>
            </ul>
        </section>
      </div>
    );
  };
  export default TermsAndConditionsPage;
  
const PrivacyPolicyPage = () => {
    return (
      <div className="space-y-6">
        <h1 className="text-h2 font-bold tracking-tight border-b pb-4">Privacy Policy</h1>
        <div className="text-muted-foreground">
            <p><strong>Platform Name:</strong> Nutrify</p>
        </div>
  
        <section className="space-y-2">
          <h2 className="text-h3 font-semibold tracking-tight">1. Introduction</h2>
          <p>Nutrify is a web-based nutrition tracking and AI-powered food analysis system. This Privacy Policy explains how we collect, use, store, and protect your information when you use our platform.</p>
          <p>By using Nutrify, you agree to the practices described in this policy.</p>
        </section>
  
        <section className="space-y-2">
          <h2 className="text-h3 font-semibold tracking-tight">2. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <h3 className="text-h4 font-semibold tracking-tight pt-2">A. Account Information</h3>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li>Full name</li>
            <li>Email address</li>
            <li>Password (stored securely via authentication provider)</li>
          </ul>
          <h3 className="text-h4 font-semibold tracking-tight pt-2">B. Onboarding & Health Information</h3>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li>Age</li>
            <li>Gender</li>
            <li>Height</li>
            <li>Weight</li>
            <li>Activity level</li>
            <li>Primary health goal</li>
            <li>Dietary preferences</li>
          </ul>
          <h3 className="text-h4 font-semibold tracking-tight pt-2">C. Usage Data</h3>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li>Foods searched</li>
            <li>Foods logged in daily tracker</li>
            <li>Goals set</li>
            <li>Recommendations generated</li>
            <li>Analytics data</li>
          </ul>
          <h3 className="text-h4 font-semibold tracking-tight pt-2">D. Uploaded Images</h3>
          <p>If you use AI food recognition:</p>
          <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Food images you upload</li>
              <li>Nutritional analysis results</li>
          </ul>
          <p>We do not access your device gallery without permission.</p>
        </section>
  
        <section className="space-y-2">
          <h2 className="text-h3 font-semibold tracking-tight">3. How We Use Your Information</h2>
          <p>We use your data to:</p>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li>Personalize recommendations</li>
            <li>Calculate calorie and macro targets</li>
            <li>Generate AI food recognition results</li>
            <li>Track daily nutrition progress</li>
            <li>Improve system performance</li>
            <li>Provide analytics insights</li>
          </ul>
          <p>We do not sell your personal information.</p>
        </section>
  
        <section className="space-y-2">
          <h2 className="text-h3 font-semibold tracking-tight">4. Data Storage & Security</h2>
          <p>Your data is:</p>
          <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Stored securely in cloud databases</li>
              <li>Protected using authentication and access controls</li>
              <li>Accessible only to you</li>
          </ul>
          <p>We implement reasonable technical safeguards to protect your information.</p>
          <p>However, no online system is 100% secure.</p>
        </section>
  
        <section className="space-y-2">
          <h2 className="text-h3 font-semibold tracking-tight">5. AI Processing</h2>
          <p>When you use AI food recognition or AI search:</p>
          <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Your food image or query is processed to identify food items</li>
              <li>Nutritional data is generated based on recognized food</li>
          </ul>
          <p>AI results are estimates and may not be 100% accurate.</p>
        </section>
  
        <section className="space-y-2">
          <h2 className="text-h3 font-semibold tracking-tight">6. Data Retention</h2>
          <p>We retain your data as long as your account is active.</p>
          <p>If you delete your account:</p>
          <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Your personal data</li>
              <li>Logs</li>
              <li>Uploaded food records</li>
              <li>Recommendations</li>
          </ul>
          <p>will be permanently removed.</p>
        </section>
  
        <section className="space-y-2">
          <h2 className="text-h3 font-semibold tracking-tight">7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Access your data</li>
              <li>Update your information</li>
              <li>Delete your account</li>
              <li>Request password reset</li>
          </ul>
          <p>You can manage most of these in the Settings page.</p>
        </section>
  
        <section className="space-y-2">
          <h2 className="text-h3 font-semibold tracking-tight">8. Children’s Privacy</h2>
          <p>Nutrify is not intended for individuals under 13 years old.</p>
          <p>We do not knowingly collect data from children.</p>
        </section>
  
        <section className="space-y-2">
          <h2 className="text-h3 font-semibold tracking-tight">9. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time.</p>
          <p>Changes will be reflected with an updated effective date.</p>
        </section>
      </div>
    );
  };
  export default PrivacyPolicyPage;
  
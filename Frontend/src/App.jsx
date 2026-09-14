import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import LanguageSelectionPage from './pages/LanguageSelectionPage';
import ImpactPage from './pages/ImpactPage';
import ReportProblemPage from './pages/ReportProblemPage';
import MySubmissionsPage from './pages/MySubmissionsPage';
import ProfilePage from './pages/ProfilePage';
import CitizenDashboard from './pages/CitizenDashboard';
import UniversityDashboard from './pages/UniversityDashboard';
import IndustryDashboard from './pages/IndustryDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminProblemDetails from './pages/AdminProblemDetails';
import InstitutionManagement from './pages/InstitutionManagement';

/**
 * App Component
 * Defines the main React Router setup for SamadhanSetu.
 * Maps URLs to the appropriate views.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* 2. Public Impact Page */}
        <Route path="/impact" element={<ImpactPage />} />

        {/* 3. Language Selection Routes (Post-login and Standalone) */}
        <Route path="/select-language" element={<LanguageSelectionPage />} />
        <Route path="/select-language/:role" element={<LanguageSelectionPage />} />

        {/* 4. Authentication Routes (Role is dynamic: citizen, university, industry, or admin) */}
        <Route path="/login/:role" element={<LoginPage />} />
        <Route path="/register/:role" element={<RegisterPage />} />

        {/* 5. Password Reset & Email Verification Routes */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/forgot-password/:role" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify-email/:token" element={<EmailVerificationPage />} />

        {/* 6. Citizen Problem Workflow Routes */}
        <Route path="/report-problem" element={<ReportProblemPage />} />
        <Route path="/my-submissions" element={<MySubmissionsPage />} />

        {/* 7. User Account Profile */}
        <Route path="/profile" element={<ProfilePage />} />

        {/* 8. Protected Role Dashboard Routes */}
        <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
        <Route path="/university/dashboard" element={<UniversityDashboard />} />
        <Route path="/industry/dashboard" element={<IndustryDashboard />} />

        {/* 9. Government Administration Oversight Routes (Closed Verified Network) */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/problems/:id" element={<AdminProblemDetails />} />
        <Route path="/admin/institutions" element={<InstitutionManagement />} />

        {/* 10. Fallback Catch-all: Redirect unknown routes back to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CitizenDashboard from './pages/CitizenDashboard';
import UniversityDashboard from './pages/UniversityDashboard';
import IndustryDashboard from './pages/IndustryDashboard';

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

        {/* 2. Authentication Routes (Role is dynamic: citizen, university, or industry) */}
        <Route path="/login/:role" element={<LoginPage />} />
        <Route path="/register/:role" element={<RegisterPage />} />

        {/* 3. Protected Dashboard Routes */}
        <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
        <Route path="/university/dashboard" element={<UniversityDashboard />} />
        <Route path="/industry/dashboard" element={<IndustryDashboard />} />

        {/* 4. Fallback Catch-all: Redirect unknown routes back to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

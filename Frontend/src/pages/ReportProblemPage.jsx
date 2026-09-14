import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import api from '../api/axios';

/**
 * ReportProblemPage Component
 * Route: "/report-problem"
 * 3-Step Wizard:
 * Step 1: Problem Details (Title, Description with Speech-to-Text, Category with AI Suggestion)
 * Step 2: Location Details (State, 24 Jharkhand Districts, Landmark, GPS Geolocation)
 * Step 3: Photo / Video Evidence (Max 200MB, file preview, remove)
 * Followed by confirmation screen with Problem Reference ID and Status.
 */
function ReportProblemPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Authentication check
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const isEmailVerified = localStorage.getItem('isEmailVerified') === 'true';

  useEffect(() => {
    if (!token) {
      navigate('/login/citizen');
    } else if (role !== 'citizen') {
      navigate(`/${role}/dashboard`);
    }
  }, [token, role, navigate]);

  // Current wizard step: 1, 2, or 3 (4 is Success)
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [aiSuggestedCategory, setAiSuggestedCategory] = useState('');

  const [stateName, setStateName] = useState('Jharkhand');
  const [district, setDistrict] = useState('Ranchi');
  const [landmark, setLandmark] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [geoStatus, setGeoStatus] = useState('');

  const [files, setFiles] = useState([]);
  const [uploadError, setUploadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [stepError, setStepError] = useState('');

  // Speech Recognition state
  const [isListeningTitle, setIsListeningTitle] = useState(false);
  const [isListeningDesc, setIsListeningDesc] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  // 10 Official Categories
  const categories = [
    'Education',
    'Healthcare',
    'Agriculture',
    'Water Resources',
    'Environment',
    'Energy',
    'Urban Development',
    'Accessibility',
    'Public Administration',
    'Rural Livelihoods',
  ];

  // 24 Official Districts of Jharkhand
  const jharkhandDistricts = [
    'Bokaro',
    'Chatra',
    'Deoghar',
    'Dhanbad',
    'Dumka',
    'East Singhbhum',
    'Garhwa',
    'Giridih',
    'Godda',
    'Gumla',
    'Hazaribagh',
    'Jamtara',
    'Khunti',
    'Koderma',
    'Latehar',
    'Lohardaga',
    'Pakur',
    'Palamu',
    'Ramgarh',
    'Ranchi',
    'Sahibganj',
    'Seraikela-Kharsawan',
    'Simdega',
    'West Singhbhum',
  ];

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Real-time AI auto-suggest category based on title & description
  useEffect(() => {
    const text = `${title} ${description}`.toLowerCase();
    if (text.trim().length < 5) {
      setAiSuggestedCategory('');
      return;
    }

    if (text.match(/(school|teacher|student|college|exam|book|shiksha|class)/)) {
      setAiSuggestedCategory('Education');
    } else if (text.match(/(hospital|doctor|medicine|health|clinic|swasthya|patient|fever|ill)/)) {
      setAiSuggestedCategory('Healthcare');
    } else if (text.match(/(farm|crop|kisan|irrigation|seed|farmer|soil|krishi|harvest)/)) {
      setAiSuggestedCategory('Agriculture');
    } else if (text.match(/(water|borewell|drinking|river|handpump|pani|pipeline|drainage|tank)/)) {
      setAiSuggestedCategory('Water Resources');
    } else if (text.match(/(waste|garbage|pollution|plastic|cleanliness|swachh|tree|forest)/)) {
      setAiSuggestedCategory('Environment');
    } else if (text.match(/(electricity|power cut|solar|wire|transformer|voltage|bijli|pole)/)) {
      setAiSuggestedCategory('Energy');
    } else if (text.match(/(road|pothole|traffic|bridge|street|drain|footpath|construction)/)) {
      setAiSuggestedCategory('Urban Development');
    } else if (text.match(/(disability|wheelchair|ramp|blind|handicapped|divyang)/)) {
      setAiSuggestedCategory('Accessibility');
    } else if (text.match(/(office|certificate|corruption|bribe|ration|pension|bdo|collector)/)) {
      setAiSuggestedCategory('Public Administration');
    } else if (text.match(/(employment|job|income|self-help|livelihood|mgnrega|rozgar)/)) {
      setAiSuggestedCategory('Rural Livelihoods');
    } else {
      setAiSuggestedCategory('Urban Development');
    }
  }, [title, description]);

  // Voice-to-Text Handler
  const startSpeechRecognition = (field) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Your browser does not support voice speech recognition. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    // Set recognition language matching currently active i18n language
    const langMap = {
      en: 'en-IN',
      hi: 'hi-IN',
      bn: 'bn-IN',
      ta: 'ta-IN',
      te: 'te-IN',
      mr: 'mr-IN',
      gu: 'gu-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      pa: 'pa-IN',
      or: 'or-IN',
      ur: 'ur-IN',
    };
    recognition.lang = langMap[i18n.language] || 'en-IN';

    if (field === 'title') {
      setIsListeningTitle(true);
    } else {
      setIsListeningDesc(true);
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (field === 'title') {
        setTitle((prev) => (prev ? `${prev} ${transcript}` : transcript));
      } else {
        setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsListeningTitle(false);
      setIsListeningDesc(false);
    };

    recognition.onend = () => {
      setIsListeningTitle(false);
      setIsListeningDesc(false);
    };

    recognition.start();
  };

  // Browser Geolocation API Handler
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('Geolocation is not supported by your browser.');
      return;
    }

    setGeoStatus('Fetching accurate GPS coordinates from device...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setLatitude(lat);
        setLongitude(lng);
        setGeoStatus(`Location acquired: ${lat}, ${lng} (Accuracy: ±${Math.round(position.coords.accuracy)}m)`);
      },
      (error) => {
        let msg = 'Unable to retrieve location.';
        if (error.code === 1) msg = 'Location permission denied by user. You can still enter landmark manually.';
        else if (error.code === 2) msg = 'Location position unavailable.';
        else if (error.code === 3) msg = 'Location request timed out.';
        setGeoStatus(msg);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // File Upload Handlers
  const handleFileChange = (e) => {
    setUploadError('');
    const newFiles = Array.from(e.target.files);

    const totalFiles = [...files, ...newFiles];
    if (totalFiles.length > 5) {
      setUploadError('You can upload a maximum of 5 files.');
      return;
    }

    // Validate size (max 200 MB total)
    const totalSize = totalFiles.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > 200 * 1024 * 1024) {
      setUploadError('Total evidence upload size exceeds the 200 MB limit.');
      return;
    }

    setFiles(totalFiles);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Step Validation & Navigation
  const handleNextStep = () => {
    setStepError('');

    if (currentStep === 1) {
      if (!title.trim() || title.trim().length < 3) {
        setStepError('Please enter a clear problem title (at least 3 characters).');
        return;
      }
      if (!description.trim() || description.trim().length < 10) {
        setStepError('Please describe the problem in detail (at least 10 characters).');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!district) {
        setStepError('Please select a district in Jharkhand.');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    setStepError('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Final Form Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStepError('');
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', selectedCategory || aiSuggestedCategory || 'Urban Development');
      formData.append('state', stateName);
      formData.append('district', district);
      formData.append('landmark', landmark.trim());
      if (latitude) formData.append('latitude', latitude);
      if (longitude) formData.append('longitude', longitude);

      // Append files
      files.forEach((file) => {
        formData.append('media', file);
      });

      const response = await api.post('/problems', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSubmissionSuccess({
        id: response.data.referenceId || response.data.problem?._id,
        category: response.data.problem?.category || selectedCategory || aiSuggestedCategory,
        district: response.data.problem?.district || district,
        createdAt: new Date().toLocaleDateString(),
      });
      setCurrentStep(4); // Success screen
    } catch (error) {
      console.error('Problem submission error:', error);
      if (error.response?.data?.message) {
        setStepError(error.response.data.message);
      } else {
        setStepError('Failed to submit problem. Ensure your email is verified and backend server is running.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar role="citizen" />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        
        {/* Email Verification Warning if applicable */}
        {!isEmailVerified && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>Your email address has not been verified yet. Submissions require a verified citizen account.</span>
            </div>
            <Link to="/login/citizen" className="font-semibold underline ml-2 shrink-0">
              Verify Email &rarr;
            </Link>
          </div>
        )}

        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Official Civic Grievance Intake</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Report a Societal Problem
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Submit local issues directly to district administration and university research laboratories.
          </p>
        </div>

        {/* 3-Step Wizard Indicator (Shown if not yet successful) */}
        {currentStep <= 3 && (
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-lg mx-auto">
              {/* Step 1 Indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                    currentStep >= 1
                      ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  1
                </div>
                <span className="text-[11px] font-semibold text-slate-700 mt-1.5">Problem</span>
              </div>

              <div className={`flex-1 h-1 mx-3 rounded ${currentStep >= 2 ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>

              {/* Step 2 Indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                    currentStep >= 2
                      ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  2
                </div>
                <span className="text-[11px] font-semibold text-slate-700 mt-1.5">Location</span>
              </div>

              <div className={`flex-1 h-1 mx-3 rounded ${currentStep >= 3 ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>

              {/* Step 3 Indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                    currentStep === 3
                      ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  3
                </div>
                <span className="text-[11px] font-semibold text-slate-700 mt-1.5">Evidence</span>
              </div>
            </div>
          </div>
        )}

        {/* Global Step Validation Error */}
        {stepError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{stepError}</span>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          
          {/* ========================================================
              STEP 1: PROBLEM DETAILS
             ======================================================== */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">Step 1: What is the issue?</h2>
                <p className="text-xs text-slate-500">Provide a concise headline and comprehensive description.</p>
              </div>

              {/* 1. Title with Mic */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  1. What is your problem? <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Broken water pipeline causing shortage in Ward 12"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                  />
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={() => startSpeechRecognition('title')}
                      className={`absolute right-3 p-2 rounded-lg transition-colors ${
                        isListeningTitle ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'
                      }`}
                      title={isListeningTitle ? 'Listening...' : 'Voice-to-Text (Speak now)'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>Minimum 3 characters</span>
                  {isListeningTitle && <span className="text-red-600 font-semibold animate-pulse">● Listening (Speak now)...</span>}
                </div>
              </div>

              {/* 2. Description with Mic */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  2. Describe your problem in detail <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    required
                    rows={5}
                    placeholder="Explain the background, how long the issue has persisted, how many residents are affected, and what technical help is needed..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 pb-12 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={() => startSpeechRecognition('desc')}
                      className={`absolute right-3 bottom-3 p-2 rounded-lg transition-colors ${
                        isListeningDesc ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'
                      }`}
                      title={isListeningDesc ? 'Listening...' : 'Voice-to-Text (Speak now)'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>Minimum 10 characters</span>
                  {isListeningDesc && <span className="text-red-600 font-semibold animate-pulse">● Recording speech into description...</span>}
                </div>
              </div>

              {/* 3. Category with AI Auto Suggestion */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  3. Choose Category <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Let AI Classify Automatically --</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* AI Suggested Banner */}
                {aiSuggestedCategory && (
                  <div className="mt-2.5 p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sky-800">
                      <span className="font-bold">✨ AI Suggested Category:</span>
                      <span className="font-semibold px-2 py-0.5 rounded bg-white text-sky-900 border border-sky-300">
                        {aiSuggestedCategory}
                      </span>
                    </div>
                    {!selectedCategory && (
                      <button
                        type="button"
                        onClick={() => setSelectedCategory(aiSuggestedCategory)}
                        className="text-[11px] font-bold text-sky-700 hover:text-sky-900 underline"
                      >
                        Accept & Lock
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Step 1 Actions */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all flex items-center gap-2"
                >
                  <span>Next: Location Details</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              STEP 2: LOCATION DETAILS
             ======================================================== */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">Step 2: Where is this problem located?</h2>
                <p className="text-xs text-slate-500">Provide administrative district and coordinates for university dispatch.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. State */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    1. State
                  </label>
                  <input
                    type="text"
                    disabled
                    value={stateName}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 text-sm font-semibold cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400">Fixed to Jharkhand for SIH Phase 3</span>
                </div>

                {/* 2. District (All 24 Jharkhand Districts) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    2. District <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    {jharkhandDistricts.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Landmark */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  3. Landmark / Specific Area <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Dhurwa Dam, Gate No. 2, Sector 4"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 4. GPS Coordinates + Use My Current Location Button */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      4. GPS Coordinates
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Helps field inspection teams navigate directly to the ground site.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Use My Current Location</span>
                  </button>
                </div>

                {geoStatus && (
                  <div className="text-xs font-medium text-sky-800 bg-sky-50 p-2 rounded-lg border border-sky-200">
                    {geoStatus}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Latitude</label>
                    <input
                      type="text"
                      placeholder="e.g. 23.344100"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Longitude</label>
                    <input
                      type="text"
                      placeholder="e.g. 85.309560"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2 Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition-colors"
                >
                  &larr; Back: Problem Details
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all flex items-center gap-2"
                >
                  <span>Next: Photo / Video Evidence</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              STEP 3: PHOTO / VIDEO EVIDENCE
             ======================================================== */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">Step 3: Upload Evidence (Optional)</h2>
                <p className="text-xs text-slate-500">Attach photos or short video clips showing the ground situation (Max 200 MB total).</p>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 sm:p-8 text-center bg-slate-50/50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>

                <p className="text-sm font-bold text-slate-800 mb-1">
                  Click to select photos or videos
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  Accepts JPEG, PNG, MP4, WEBM, MOV &bull; Maximum total upload: 200 MB (up to 5 files)
                </p>

                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="evidence-upload"
                />
                <label
                  htmlFor="evidence-upload"
                  className="inline-block px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer shadow-sm"
                >
                  Choose Files
                </label>
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                  {uploadError}
                </div>
              )}

              {/* Selected Files List */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Attached Files ({files.length}/5):
                  </span>
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate max-w-sm">
                        <span className="p-1 rounded bg-slate-200 text-slate-700 font-mono text-[10px]">
                          {file.type.startsWith('video') ? 'VID' : 'IMG'}
                        </span>
                        <span className="font-medium text-slate-800 truncate">{file.name}</span>
                        <span className="text-slate-400 text-[10px]">
                          ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-red-500 hover:text-red-700 font-semibold p-1 hover:bg-red-50 rounded"
                        title="Remove file"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Review Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-700">
                <p className="font-bold text-slate-900 mb-1">Submission Review Summary:</p>
                <p><span className="text-slate-500">Title:</span> {title}</p>
                <p><span className="text-slate-500">Category:</span> {selectedCategory || aiSuggestedCategory || 'Urban Development'}</p>
                <p><span className="text-slate-500">District:</span> {district}, Jharkhand</p>
                {landmark && <p><span className="text-slate-500">Landmark:</span> {landmark}</p>}
                {latitude && <p><span className="text-slate-500">Coordinates:</span> {latitude}, {longitude}</p>}
                <p><span className="text-slate-500">Evidence:</span> {files.length} file(s) attached</p>
              </div>

              {/* Step 3 Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition-colors"
                >
                  &larr; Back: Location
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting Problem...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Problem Officially</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              STEP 4: SUBMISSION SUCCESS SCREEN
             ======================================================== */}
          {currentStep === 4 && submissionSuccess && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-2xl font-black text-slate-900 mb-2">
                Your problem has been submitted successfully.
              </h2>
              <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6">
                Your challenge has been officially recorded in the Government of Jharkhand repository and queued for administrative review.
              </p>

              {/* Reference ID & Details Box */}
              <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8 text-left text-xs space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-500 uppercase tracking-wider">Problem Reference ID</span>
                  <span className="font-mono font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 select-all">
                    {submissionSuccess.id}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Initial Status:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold uppercase tracking-wider text-[11px]">
                    ● Pending
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Allocated Category:</span>
                  <span className="font-semibold text-slate-800">{submissionSuccess.category}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">District:</span>
                  <span className="font-semibold text-slate-800">{submissionSuccess.district}, Jharkhand</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Submission Date:</span>
                  <span className="text-slate-800">{submissionSuccess.createdAt}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/my-submissions"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors"
                >
                  View My Submissions
                </Link>

                <Link
                  to="/citizen/dashboard"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm border border-slate-300 transition-colors"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        <p>SamadhanSetu &bull; Problem ID: SIH26043 &bull; Government of Jharkhand</p>
      </footer>
    </div>
  );
}

export default ReportProblemPage;

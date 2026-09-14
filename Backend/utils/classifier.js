const axios = require('axios');

// Category-wise keywords mapping matching the 10 official categories
const CATEGORY_KEYWORDS = {
  'Education': [
    'school', 'teacher', 'student', 'college', 'education', 'classroom', 'exam',
    'study', 'syllabus', 'books', 'scholarship', 'library', 'vidyalaya', 'shiksha'
  ],
  'Healthcare': [
    'hospital', 'doctor', 'medicine', 'health', 'disease', 'clinic', 'nurse',
    'treatment', 'ambulance', 'swasthya', 'medical', 'phc', 'chc', 'patient', 'fever'
  ],
  'Agriculture': [
    'farm', 'crop', 'kisan', 'irrigation', 'seed', 'farmer', 'soil', 'harvest',
    'fertilizer', 'pesticide', 'agriculture', 'krishi', 'mandi', 'grain', 'monsoon'
  ],
  'Water Resources': [
    'water', 'borewell', 'drinking water', 'river', 'drought', 'pipeline', 'tank',
    'well', 'handpump', 'jal', 'pani', 'contamination', 'canal', 'dam', 'drainage'
  ],
  'Environment': [
    'pollution', 'waste', 'garbage', 'tree', 'forest', 'plastic', 'air', 'smoke',
    'dumping', 'sanitation', 'cleanliness', 'swachh', 'wildlife', 'ecology'
  ],
  'Energy': [
    'electricity', 'power cut', 'solar', 'energy', 'transformer', 'wires', 'blackout',
    'voltage', 'bijli', 'pole', 'grid', 'streetlight'
  ],
  'Urban Development': [
    'road', 'pothole', 'traffic', 'bridge', 'construction', 'footpath', 'sewage',
    'drain', 'transport', 'bus stand', 'flyover', 'building', 'street'
  ],
  'Accessibility': [
    'disability', 'wheelchair', 'ramp', 'blind', 'handicapped', 'divyang', 'braille',
    'barrier', 'accessibility', 'elderly', 'special needs'
  ],
  'Public Administration': [
    'government office', 'certificate', 'corruption', 'delay in service', 'ration',
    'pension', 'bribe', 'officer', 'panchayat', 'bdo', 'collector', 'scheme'
  ],
  'Rural Livelihoods': [
    'employment', 'job', 'income', 'self-help group', 'livelihood', 'mgnrega',
    'rozgar', 'artisan', 'weaver', 'handicraft', 'skill', 'wage', 'labor'
  ],
};

/**
 * Local lightweight keyword classifier as dependable fallback
 */
const localClassify = (title, description) => {
  const text = `${title || ''} ${description || ''}`.toLowerCase();
  const scores = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let count = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        count += 1;
      }
    }
    scores[category] = count;
  }

  let maxScore = 0;
  let topCategory = 'Urban Development'; // default fallback

  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      topCategory = category;
    }
  }

  return maxScore > 0 ? topCategory : 'Urban Development';
};

/**
 * Classifies text using AI Python microservice if available,
 * with instantaneous local fallback if microservice is offline.
 */
const classifyProblem = async (title, description) => {
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5001';

  try {
    const response = await axios.post(
      `${aiServiceUrl}/classify`,
      { title, description },
      { timeout: 1200 } // 1.2s timeout
    );

    if (response.data && response.data.category && response.data.category !== 'Other') {
      return response.data.category;
    }
  } catch (error) {
    // Microservice unavailable or timed out; execute local classification
  }

  return localClassify(title, description);
};

module.exports = {
  classifyProblem,
  localClassify,
  CATEGORY_KEYWORDS,
};

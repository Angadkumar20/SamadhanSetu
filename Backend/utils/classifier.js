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

const DEPARTMENT_BY_CATEGORY = {
  Education: 'Education Department',
  Healthcare: 'Health Department',
  Agriculture: 'Agriculture Department',
  'Water Resources': 'Drinking Water / Water Supply Department',
  Environment: 'Environment & Sanitation Services',
  Energy: 'Electricity / Energy Department',
  'Urban Development': 'Public Works / Road Infrastructure',
  'Urban Infrastructure': 'Public Works / Road Infrastructure',
  Accessibility: 'Social Welfare & Accessibility Services',
  'Public Administration': 'Public Administration Department',
  'Rural Livelihoods': 'Rural Development / Livelihoods Department',
};

const PRIORITY_RULES = {
  high: [
    /immediate|urgent|emergency/,
    /danger|unsafe|life[- ]?threat|accident|collapse|fire|flood|poison|contaminat|outbreak|epidemic/,
    /no drinking water|water shortage|shortage of safe drinking water|safe drinking water shortage|power failure|blackout|major leak|many people|entire village|whole community|hundreds|thousands/,
    /death|dying|severe|critical|serious injury|health hazard|safety hazard/,
  ],
  medium: [
    /shortage|frequent|damaged|broken|blocked|delay|lack of|insufficient|poor condition|affecting residents|community/,
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

const classifyPriority = (title, description) => {
  const text = `${title || ''} ${description || ''}`.toLowerCase();
  if (PRIORITY_RULES.high.some((rule) => rule.test(text))) return 'high';
  if (PRIORITY_RULES.medium.some((rule) => rule.test(text))) return 'medium';
  return 'low';
};

const createSummary = (title, description) => {
  const cleanTitle = String(title || '').trim();
  const cleanDescription = String(description || '').replace(/\s+/g, ' ').trim();
  const firstSentence = cleanDescription.split(/(?<=[.!?])\s+/)[0] || cleanDescription;
  const summary = firstSentence.length > 180 ? `${firstSentence.slice(0, 177).trim()}...` : firstSentence;
  return cleanTitle && summary
    ? `${cleanTitle}: ${summary}`
    : cleanTitle || summary || 'A civic problem was reported for review.';
};

const suggestDepartment = (category, title, description) => {
  const categoryDepartment = DEPARTMENT_BY_CATEGORY[category];
  if (categoryDepartment) return categoryDepartment;

  const detectedCategory = localClassify(title, description);
  return DEPARTMENT_BY_CATEGORY[detectedCategory] || 'Relevant Government Department';
};

const buildProblemInsights = async (title, description, category) => {
  let detectedCategory = category;
  if (!detectedCategory || detectedCategory === 'Other') {
    detectedCategory = await classifyProblem(title, description);
  }

  return {
    category: detectedCategory || localClassify(title, description),
    priority: classifyPriority(title, description),
    summary: createSummary(title, description),
    suggestedDepartment: suggestDepartment(detectedCategory, title, description),
  };
};

module.exports = {
  classifyProblem,
  localClassify,
  classifyPriority,
  createSummary,
  suggestDepartment,
  buildProblemInsights,
  CATEGORY_KEYWORDS,
  DEPARTMENT_BY_CATEGORY,
};

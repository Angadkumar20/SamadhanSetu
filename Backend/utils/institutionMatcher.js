const { CATEGORY_KEYWORDS } = require('./classifier');

const STOP_WORDS = new Set([
  'and', 'the', 'for', 'with', 'from', 'department', 'services', 'service',
  'solutions', 'solution', 'limited', 'ltd', 'private', 'pvt', 'company',
]);

const normalizeText = (value) => String(value || '').toLowerCase().trim();

const tokenize = (value) => normalizeText(value)
  .split(/[^a-z0-9]+/)
  .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

const unique = (values) => [...new Set(values)];

const getProblemTerms = (problem) => unique([
  ...tokenize(problem.category),
  ...tokenize(problem.title),
  ...tokenize(problem.description),
  ...(CATEGORY_KEYWORDS[problem.category] || []).flatMap(tokenize),
]);

const getInstitutionExpertise = (institution) => normalizeText(
  institution.expertise || institution.organization || '',
);

const scoreInstitution = (problem, institution) => {
  const category = normalizeText(problem.category);
  const expertise = getInstitutionExpertise(institution);
  if (!expertise) return 0;

  const categoryTokens = unique(tokenize(category));
  const expertiseTokens = unique(tokenize(expertise));
  const problemTerms = getProblemTerms(problem);
  const expertiseTermSet = new Set(expertiseTokens);
  const categoryOverlap = categoryTokens.filter((token) => expertiseTermSet.has(token)).length;
  const problemOverlap = problemTerms.filter((token) => expertiseTermSet.has(token)).length;
  const categoryPhraseMatch = category && expertise.includes(category);

  let score = 0;
  if (categoryPhraseMatch) score += 65;
  if (categoryOverlap > 0) score += Math.min(25, categoryOverlap * 25);
  if (problemOverlap > 0) score += Math.min(10, problemOverlap * 2);

  return Math.min(100, score);
};

const recommendInstitutions = (problem, institutions, limit = 5) => institutions
  .filter((institution) => (
    ['university', 'industry'].includes(institution.role) &&
    institution.isVerified === true &&
    institution.isActive !== false
  ))
  .map((institution) => ({
    id: institution._id,
    name: institution.name,
    type: institution.role,
    matchScore: scoreInstitution(problem, institution),
    expertise: institution.expertise || institution.organization || 'Not specified',
    verificationStatus: institution.verificationStatus,
  }))
  .filter((institution) => institution.matchScore >= 20)
  .sort((left, right) => right.matchScore - left.matchScore)
  .slice(0, limit);

module.exports = {
  normalizeText,
  scoreInstitution,
  recommendInstitutions,
};

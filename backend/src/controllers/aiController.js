const Complaint = require('../models/Complaint');

// Rule-based keyword classification
const CATEGORY_RULES = {
  Roads: ['road', 'pothole', 'pavement', 'footpath', 'highway', 'bridge', 'crack', 'tar', 'asphalt', 'street damage', 'broken road'],
  Garbage: ['garbage', 'trash', 'waste', 'bin', 'dump', 'litter', 'rubbish', 'stink', 'smell', 'overflowing', 'solid waste'],
  'Water Leakage': ['water', 'leak', 'pipe', 'burst', 'flood', 'sewage', 'drain overflow', 'water supply', 'tap', 'puddle'],
  Streetlights: ['light', 'streetlight', 'lamp', 'bulb', 'dark', 'electricity', 'power', 'illumination', 'pole'],
  Drainage: ['drainage', 'drain', 'gutter', 'stagnant', 'waterlogging', 'clog', 'blocked', 'overflow', 'sewage'],
  Sanitation: ['toilet', 'sanitation', 'hygiene', 'dirty', 'public toilet', 'urinal', 'mosquito', 'pest', 'clean'],
};

const SEVERITY_RULES = {
  Critical: ['accident', 'emergency', 'critical', 'danger', 'hazard', 'fire', 'flood', 'collapse', 'injury', 'fatal'],
  High: ['major', 'severe', 'bad', 'serious', 'significant', 'affecting many', 'blocking traffic', 'no water'],
  Low: ['minor', 'small', 'little', 'slight', 'sometimes', 'occasionally'],
};

const DEPT_MAP = {
  Roads: 'Roads & Infrastructure Dept.',
  Garbage: 'Solid Waste Management Dept.',
  'Water Leakage': 'Water Supply & Sewerage Dept.',
  Streetlights: 'Electricity & Lighting Dept.',
  Drainage: 'Drainage & Sewerage Dept.',
  Sanitation: 'Public Health & Sanitation Dept.',
  Other: 'General Municipal Services',
};

function classifyLocally(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  let topCategory = 'Other';
  let topScore = 0;

  for (const [cat, keywords] of Object.entries(CATEGORY_RULES)) {
    const score = keywords.filter(k => text.includes(k)).length;
    if (score > topScore) { topScore = score; topCategory = cat; }
  }

  let severity = 'Medium';
  for (const [sev, keywords] of Object.entries(SEVERITY_RULES)) {
    if (keywords.some(k => text.includes(k))) { severity = sev; break; }
  }

  const confidence = topScore > 0 ? Math.min(0.5 + topScore * 0.1, 0.95) : 0.3;
  const dept = DEPT_MAP[topCategory];
  const explanation = topScore > 0
    ? `Based on keywords in your report, this appears to be a ${topCategory} issue. Suggested severity: ${severity}.`
    : `Unable to confidently classify. Defaulting to "Other". Please verify the category manually.`;

  return { category: topCategory, severity, department: dept, confidence: parseFloat(confidence.toFixed(2)), explanation, method: 'rule-based' };
}

// POST /api/ai/classify
const classifyComplaint = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    // Try external AI API if configured
    if (process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY) {
      try {
        // Placeholder for AI API integration — falls through to rule-based on error
        throw new Error('AI API not fully configured; using rule-based fallback.');
      } catch (_) { /* fall through */ }
    }

    const result = classifyLocally(title, description);
    res.json({ success: true, prediction: result, fallback: true, note: 'Classification performed using local rule-based engine. Results are suggestions only.' });
  } catch (err) { next(err); }
};

// POST /api/ai/duplicate-check
const checkDuplicate = async (req, res, next) => {
  try {
    const { title, description, category, lat, lng } = req.body;
    if (!title || !category) return res.status(400).json({ success: false, message: 'Title and category required.' });

    // Geographic search if coordinates provided
    const geoFilter = lat && lng
      ? { 'location.coordinates': { $near: { $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] }, $maxDistance: 500 } } }
      : {};

    const candidates = await Complaint.find({
      category,
      status: { $nin: ['Resolved', 'Rejected'] },
      ...geoFilter,
    }).limit(20).select('complaintId title description category status supportCount createdAt location');

    // Simple text similarity
    const titleWords = new Set(title.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const scored = candidates.map(c => {
      const candidateWords = new Set(c.title.toLowerCase().split(/\s+/).filter(w => w.length > 3));
      const intersection = [...titleWords].filter(w => candidateWords.has(w)).length;
      const union = new Set([...titleWords, ...candidateWords]).size;
      const similarity = union > 0 ? intersection / union : 0;
      return { ...c.toObject(), similarity: parseFloat(similarity.toFixed(2)) };
    }).filter(c => c.similarity > 0.25).sort((a, b) => b.similarity - a.similarity);

    res.json({ success: true, duplicates: scored.slice(0, 5), hasDuplicates: scored.length > 0 });
  } catch (err) { next(err); }
};

module.exports = { classifyComplaint, checkDuplicate };

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changedByName: String,
  note: String,
  isPublic: { type: Boolean, default: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const coordinatesSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
}, { _id: false });

const aiPredictionSchema = new mongoose.Schema({
  category: String,
  severity: String,
  department: String,
  confidence: Number,
  explanation: String,
  method: { type: String, enum: ['rule-based', 'ai-api', 'manual'], default: 'rule-based' },
  predictedAt: Date,
}, { _id: false });

const complaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    unique: true,
    default: () => `CC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [150, 'Title cannot exceed 150 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Roads', 'Garbage', 'Water Leakage', 'Streetlights', 'Drainage', 'Sanitation', 'Other'],
  },
  severity: {
    type: String,
    required: [true, 'Severity is required'],
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  },
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Pending',
  },
  images: [{ type: String }],
  location: {
    address: { type: String, trim: true },
    landmark: { type: String, trim: true },
    coordinates: coordinatesSchema,
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  assignedDepartmentName: String,
  supporters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  supportCount: { type: Number, default: 0 },
  priorityScore: { type: Number, default: 0 },
  aiPrediction: aiPredictionSchema,
  statusHistory: [statusHistorySchema],
  adminNotes: {
    type: String,
    select: false, // hidden from public
  },
  targetResolutionDate: Date,
  resolvedAt: Date,
  verifiedAt: Date,
  isDemoData: { type: Boolean, default: false },
  duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
  possibleDuplicates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Priority score calculation
complaintSchema.methods.calculatePriorityScore = function () {
  const severityWeights = { Low: 1, Medium: 2, High: 3, Critical: 4 };
  const severityScore = severityWeights[this.severity] || 1;
  const supportScore = Math.log(1 + this.supportCount) * 2;
  const ageInDays = (Date.now() - this.createdAt) / (1000 * 60 * 60 * 24);
  const ageScore = Math.min(ageInDays / 7, 3); // max 3 points for age
  return parseFloat((severityScore * 3 + supportScore + ageScore).toFixed(2));
};

// Indexes
complaintSchema.index({ complaintId: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ severity: 1 });
complaintSchema.index({ reporter: 1 });
complaintSchema.index({ 'location.coordinates': '2dsphere' });
complaintSchema.index({ priorityScore: -1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Complaint', complaintSchema);

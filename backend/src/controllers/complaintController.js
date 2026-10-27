const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const { createNotification } = require('../services/notificationService');

// POST /api/complaints
const createComplaint = async (req, res, next) => {
  try {
    const { title, description, category, severity, address, landmark, lat, lng } = req.body;
    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    const complaint = new Complaint({
      title, description, category, severity,
      images,
      location: { address, landmark, coordinates: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined },
      reporter: req.user._id,
      statusHistory: [{ status: 'Pending', changedBy: req.user._id, changedByName: req.user.name, note: 'Complaint submitted.' }],
    });
    complaint.priorityScore = complaint.calculatePriorityScore();
    await complaint.save();

    await createNotification({
      recipient: req.user._id,
      title: 'Complaint Submitted',
      message: `Your complaint "${title}" (ID: ${complaint.complaintId}) has been submitted successfully.`,
      type: 'complaint_submitted',
      complaint: complaint._id,
      complaintId: complaint.complaintId,
    });

    res.status(201).json({ success: true, message: 'Complaint submitted!', complaint });
  } catch (err) { next(err); }
};

// GET /api/complaints
const getComplaints = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, status, category, severity, search, sortBy = '-createdAt' } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (search) filter.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .select('-adminNotes -reporter')
        .sort(sortBy)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('assignedDepartment', 'name'),
      Complaint.countDocuments(filter),
    ]);

    res.json({ success: true, complaints, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
};

// GET /api/complaints/track/:complaintId
const trackComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findOne({ complaintId: req.params.complaintId })
      .select('-adminNotes -reporter')
      .populate('assignedDepartment', 'name description contactEmail');
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    res.json({ success: true, complaint });
  } catch (err) { next(err); }
};

// GET /api/complaints/:id
const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .select('-adminNotes')
      .populate('assignedDepartment', 'name description')
      .populate('reporter', 'name');
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    res.json({ success: true, complaint });
  } catch (err) { next(err); }
};

// GET /api/complaints/my — citizen's own complaints
const getMyComplaints = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, category } = req.query;
    const filter = { reporter: req.user._id };
    if (status) filter.status = status;
    if (category) filter.category = category;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [complaints, total] = await Promise.all([
      Complaint.find(filter).sort('-createdAt').skip(skip).limit(parseInt(limit)).populate('assignedDepartment', 'name'),
      Complaint.countDocuments(filter),
    ]);
    const stats = await Complaint.aggregate([
      { $match: { reporter: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    res.json({ success: true, complaints, total, stats, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
};

// POST /api/complaints/:id/support
const supportComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    const userId = req.user._id;
    const alreadySupported = complaint.supporters.some(s => s.toString() === userId.toString());
    if (alreadySupported) {
      // Remove support (toggle)
      complaint.supporters = complaint.supporters.filter(s => s.toString() !== userId.toString());
      complaint.supportCount = complaint.supporters.length;
      complaint.priorityScore = complaint.calculatePriorityScore();
      await complaint.save();
      return res.json({ success: true, message: 'Support removed.', supportCount: complaint.supportCount, supported: false });
    }
    complaint.supporters.push(userId);
    complaint.supportCount = complaint.supporters.length;
    complaint.priorityScore = complaint.calculatePriorityScore();
    await complaint.save();
    res.json({ success: true, message: 'Complaint supported!', supportCount: complaint.supportCount, supported: true });
  } catch (err) { next(err); }
};

module.exports = { createComplaint, getComplaints, trackComplaint, getComplaintById, getMyComplaints, supportComplaint };

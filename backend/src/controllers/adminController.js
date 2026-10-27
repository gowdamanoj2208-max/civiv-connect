const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Department = require('../models/Department');
const { createNotification } = require('../services/notificationService');
const { Parser } = require('json2csv');

// GET /api/admin/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const [
      total, pending, verified, inProgress, resolved, rejected,
      highPriority, departments,
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'Pending' }),
      Complaint.countDocuments({ status: 'Verified' }),
      Complaint.countDocuments({ status: 'In Progress' }),
      Complaint.countDocuments({ status: 'Resolved' }),
      Complaint.countDocuments({ status: 'Rejected' }),
      Complaint.countDocuments({ severity: { $in: ['High', 'Critical'] }, status: { $nin: ['Resolved', 'Rejected'] } }),
      Department.countDocuments({ isActive: true }),
    ]);

    const resolvedComplaints = await Complaint.find({ status: 'Resolved', resolvedAt: { $exists: true } })
      .select('createdAt resolvedAt');
    let avgResolutionTime = 0;
    if (resolvedComplaints.length > 0) {
      const total = resolvedComplaints.reduce((sum, c) => {
        return sum + (new Date(c.resolvedAt) - new Date(c.createdAt));
      }, 0);
      avgResolutionTime = Math.round(total / resolvedComplaints.length / (1000 * 60 * 60 * 24));
    }

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    const byCategory = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const byStatus = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyTrend = await Complaint.aggregate([
      { $match: { createdAt: { $gte: last30Days } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: { total, pending, verified, inProgress, resolved, rejected, highPriority, avgResolutionTime, resolutionRate, departments },
      byCategory,
      byStatus,
      monthlyTrend,
    });
  } catch (err) { next(err); }
};

// GET /api/admin/complaints
const getAllComplaints = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, status, category, severity, search, sortBy = '-createdAt', department } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (department) filter.assignedDepartmentName = { $regex: department, $options: 'i' };
    if (search) filter.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .sort(sortBy)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('reporter', 'name email phone')
        .populate('assignedDepartment', 'name'),
      Complaint.countDocuments(filter),
    ]);
    res.json({ success: true, complaints, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
};

// PATCH /api/admin/complaints/:id/status
const updateStatus = async (req, res, next) => {
  try {
    const { status, note, adminNote } = req.body;
    const validStatuses = ['Pending', 'Verified', 'In Progress', 'Resolved', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const complaint = await Complaint.findById(req.params.id).populate('reporter', '_id name');
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    const oldStatus = complaint.status;
    complaint.status = status;
    if (adminNote) complaint.adminNotes = adminNote;
    if (status === 'Resolved') complaint.resolvedAt = new Date();
    if (status === 'Verified') complaint.verifiedAt = new Date();

    complaint.statusHistory.push({
      status,
      changedBy: req.user._id,
      changedByName: req.user.name,
      note: note || `Status updated to ${status}`,
      isPublic: true,
    });
    complaint.priorityScore = complaint.calculatePriorityScore();
    await complaint.save();

    // Notify reporter
    const notifMap = {
      'Verified': { title: 'Complaint Verified', type: 'complaint_verified', msg: `Your complaint "${complaint.title}" has been verified and is being reviewed.` },
      'In Progress': { title: 'Work Started', type: 'work_started', msg: `Work has started on your complaint "${complaint.title}".` },
      'Resolved': { title: 'Complaint Resolved', type: 'complaint_resolved', msg: `Your complaint "${complaint.title}" has been resolved. Thank you!` },
      'Rejected': { title: 'Complaint Rejected', type: 'complaint_rejected', msg: `Your complaint "${complaint.title}" was rejected. Reason: ${note || 'Not specified'}` },
    };
    if (notifMap[status] && complaint.reporter) {
      await createNotification({ recipient: complaint.reporter._id, title: notifMap[status].title, message: notifMap[status].msg, type: notifMap[status].type, complaint: complaint._id, complaintId: complaint.complaintId });
    }

    res.json({ success: true, message: `Status updated to ${status}.`, complaint });
  } catch (err) { next(err); }
};

// PATCH /api/admin/complaints/:id/assign
const assignComplaint = async (req, res, next) => {
  try {
    const { departmentId, departmentName, targetResolutionDate } = req.body;
    const complaint = await Complaint.findById(req.params.id).populate('reporter', '_id name');
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    if (departmentId) complaint.assignedDepartment = departmentId;
    if (departmentName) complaint.assignedDepartmentName = departmentName;
    if (targetResolutionDate) complaint.targetResolutionDate = new Date(targetResolutionDate);

    complaint.statusHistory.push({
      status: complaint.status,
      changedBy: req.user._id,
      changedByName: req.user.name,
      note: `Assigned to ${departmentName || 'department'}.`,
      isPublic: true,
    });
    await complaint.save();

    if (complaint.reporter) {
      await createNotification({ recipient: complaint.reporter._id, title: 'Complaint Assigned', message: `Your complaint "${complaint.title}" has been assigned to ${departmentName || 'a department'}.`, type: 'admin_update', complaint: complaint._id, complaintId: complaint.complaintId });
    }
    res.json({ success: true, message: 'Complaint assigned.', complaint });
  } catch (err) { next(err); }
};

// GET /api/admin/analytics
const getAnalytics = async (req, res, next) => {
  try {
    const last6Months = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

    const [byCategory, byStatus, bySeverity, monthlyTrend, deptPerformance, recentHighPriority] = await Promise.all([
      Complaint.aggregate([{ $group: { _id: '$category', total: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } } } }, { $sort: { total: -1 } }]),
      Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
      Complaint.aggregate([
        { $match: { createdAt: { $gte: last6Months } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } } } },
        { $sort: { _id: 1 } },
      ]),
      Complaint.aggregate([
        { $match: { assignedDepartmentName: { $exists: true, $ne: '' } } },
        { $group: { _id: '$assignedDepartmentName', total: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } } } },
        { $sort: { total: -1 } },
      ]),
      Complaint.find({ severity: { $in: ['High', 'Critical'] }, status: { $nin: ['Resolved', 'Rejected'] } })
        .sort('-priorityScore').limit(5).select('complaintId title severity status supportCount'),
    ]);

    res.json({ success: true, byCategory, byStatus, bySeverity, monthlyTrend, deptPerformance, recentHighPriority });
  } catch (err) { next(err); }
};

// GET /api/admin/export
const exportComplaints = async (req, res, next) => {
  try {
    const { status, category, severity } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (severity) filter.severity = severity;

    const complaints = await Complaint.find(filter)
      .populate('reporter', 'name email')
      .populate('assignedDepartment', 'name')
      .lean();

    const data = complaints.map(c => ({
      ID: c.complaintId,
      Title: c.title,
      Category: c.category,
      Severity: c.severity,
      Status: c.status,
      Reporter: c.reporter?.name || 'Unknown',
      Department: c.assignedDepartmentName || '',
      Address: c.location?.address || '',
      Lat: c.location?.coordinates?.lat || '',
      Lng: c.location?.coordinates?.lng || '',
      SupportCount: c.supportCount,
      PriorityScore: c.priorityScore,
      CreatedAt: new Date(c.createdAt).toISOString(),
      ResolvedAt: c.resolvedAt ? new Date(c.resolvedAt).toISOString() : '',
    }));

    const parser = new Parser();
    const csv = parser.parse(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="complaints-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) { next(err); }
};

// GET /api/admin/departments
const getDepartments = async (req, res, next) => {
  try {
    const depts = await Department.find({ isActive: true }).sort('name');
    res.json({ success: true, departments: depts });
  } catch (err) { next(err); }
};

module.exports = { getDashboard, getAllComplaints, updateStatus, assignComplaint, getAnalytics, exportComplaints, getDepartments };

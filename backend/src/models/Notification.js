const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['complaint_submitted', 'complaint_verified', 'work_started', 'admin_update', 'complaint_resolved', 'complaint_rejected', 'duplicate_found', 'general'],
    default: 'general',
  },
  complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
  complaintId: String,
  isRead: { type: Boolean, default: false },
  readAt: Date,
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

const Notification = require('../models/Notification');

// GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [notifications, total, unread] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .sort('-createdAt').skip(skip).limit(parseInt(limit)),
      Notification.countDocuments({ recipient: req.user._id }),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);
    res.json({ success: true, notifications, total, unread });
  } catch (err) { next(err); }
};

// PATCH /api/notifications/:id/read
const markRead = async (req, res, next) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!n) return res.status(404).json({ success: false, message: 'Notification not found.' });
    res.json({ success: true, notification: n });
  } catch (err) { next(err); }
};

// PATCH /api/notifications/read-all
const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) { next(err); }
};

module.exports = { getNotifications, markRead, markAllRead };

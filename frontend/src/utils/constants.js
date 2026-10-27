// Shared constants across the frontend

export const CATEGORIES = ['Roads', 'Garbage', 'Water Leakage', 'Streetlights', 'Drainage', 'Sanitation', 'Other']

export const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']

export const STATUSES = ['Pending', 'Verified', 'In Progress', 'Resolved', 'Rejected']

export const STATUS_COLORS = {
  Pending:     { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  Verified:    { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  'In Progress': { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  Resolved:    { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
  Rejected:    { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500' },
}

export const SEVERITY_COLORS = {
  Low:      { bg: 'bg-slate-100', text: 'text-slate-600' },
  Medium:   { bg: 'bg-amber-100', text: 'text-amber-700' },
  High:     { bg: 'bg-orange-100', text: 'text-orange-700' },
  Critical: { bg: 'bg-red-100', text: 'text-red-700' },
}

export const CATEGORY_ICONS = {
  Roads:          '🛣️',
  Garbage:        '🗑️',
  'Water Leakage':'💧',
  Streetlights:   '💡',
  Drainage:       '🌊',
  Sanitation:     '🚻',
  Other:          '📋',
}

export const MAP_MARKER_COLORS = {
  Pending:       '#f59e0b',
  Verified:      '#3b82f6',
  'In Progress': '#8b5cf6',
  Resolved:      '#22c55e',
  Rejected:      '#ef4444',
}

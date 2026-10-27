require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Complaint = require('../src/models/Complaint');
const Department = require('../src/models/Department');
const Notification = require('../src/models/Notification');

const DEPARTMENTS = [
  { name: 'Roads & Infrastructure Dept.', description: 'Handles road repair, potholes, bridges, and footpaths.', categories: ['Roads'] },
  { name: 'Solid Waste Management Dept.', description: 'Manages garbage collection, dump sites, and waste disposal.', categories: ['Garbage'] },
  { name: 'Water Supply & Sewerage Dept.', description: 'Handles water supply, leakages, and sewerage systems.', categories: ['Water Leakage'] },
  { name: 'Electricity & Lighting Dept.', description: 'Manages streetlights, power supply, and electrical issues.', categories: ['Streetlights'] },
  { name: 'Drainage & Sewerage Dept.', description: 'Handles stormwater drains and sewerage overflow.', categories: ['Drainage'] },
  { name: 'Public Health & Sanitation Dept.', description: 'Oversees sanitation, public toilets, and pest control.', categories: ['Sanitation'] },
  { name: 'General Municipal Services', description: 'Handles miscellaneous civic issues.', categories: ['Other'] },
];

// Sample locations across an Indian city (Mumbai-like coords)
const LOCATIONS = [
  { address: 'MG Road, Sector 5', landmark: 'Near City Mall', lat: 19.0760, lng: 72.8777 },
  { address: 'Gandhi Nagar, Block B', landmark: 'Opposite Bus Stand', lat: 19.0830, lng: 72.8850 },
  { address: 'Nehru Colony, Lane 3', landmark: 'Near Water Tank', lat: 19.0700, lng: 72.8700 },
  { address: 'Shivaji Market Road', landmark: 'Junction Signal', lat: 19.0900, lng: 72.8900 },
  { address: 'Civil Lines, Road 7', landmark: 'Fire Station Corner', lat: 19.0650, lng: 72.8650 },
  { address: 'Sector 12, Ring Road', landmark: 'Petrol Pump Area', lat: 19.0550, lng: 72.8600 },
  { address: 'Ambedkar Chowk', landmark: 'Near Post Office', lat: 19.0800, lng: 72.8950 },
  { address: 'Patel Nagar, Main Street', landmark: 'Community Hall', lat: 19.0750, lng: 72.8750 },
  { address: 'Station Road, West', landmark: 'Railway Crossing', lat: 19.0600, lng: 72.8800 },
  { address: 'Model Town, Phase 2', landmark: 'Park Entrance', lat: 19.0950, lng: 72.8700 },
];

const SAMPLE_COMPLAINTS = [
  { title: 'Large pothole causing accidents on MG Road', description: 'There is a massive pothole near the city mall junction that has already caused two accidents this week. The road surface has deteriorated badly and vehicles are getting damaged.', category: 'Roads', severity: 'Critical', status: 'In Progress' },
  { title: 'Overflowing garbage bins near Gandhi Nagar market', description: 'Garbage bins at Gandhi Nagar market have not been emptied for 5 days. Waste is overflowing onto the road, creating health hazards and bad odor in the neighborhood.', category: 'Garbage', severity: 'High', status: 'Verified' },
  { title: 'Burst water pipe on Nehru Colony Lane 3', description: 'A major water pipe has burst and water is gushing out, causing flooding on the street. Multiple households have lost water supply. Road is waterlogged.', category: 'Water Leakage', severity: 'Critical', status: 'Resolved' },
  { title: 'Street lights not working in entire Shivaji Market area', description: 'About 15 streetlights on Shivaji Market Road have been non-functional for 3 weeks. The area is completely dark at night, making it unsafe for pedestrians especially women.', category: 'Streetlights', severity: 'High', status: 'Pending' },
  { title: 'Blocked drainage causing waterlogging in Civil Lines', description: 'The main drainage channel on Road 7 is completely blocked with debris. Every time it rains, the entire area gets flooded. Residents cannot leave their homes.', category: 'Drainage', severity: 'High', status: 'Verified' },
  { title: 'Public toilet locked and unusable near Ambedkar Chowk', description: 'The public toilet facility near Ambedkar Chowk has been locked for 2 weeks. People are using open spaces which is a major sanitation concern.', category: 'Sanitation', severity: 'Medium', status: 'Pending' },
  { title: 'Road damage due to construction work in Patel Nagar', description: 'Construction work has left the main street completely dug up and there is no proper restoration. Heavy rains have made it worse and vehicles cannot pass through.', category: 'Roads', severity: 'High', status: 'In Progress' },
  { title: 'Illegal garbage dumping near Station Road', description: 'Residents and shops are illegally dumping garbage near the railway crossing. The pile has grown huge and rats are visible. Smell is unbearable.', category: 'Garbage', severity: 'Medium', status: 'Pending' },
  { title: 'Water supply disrupted in Model Town for 4 days', description: 'Residents of Model Town Phase 2 have not received municipal water supply for 4 consecutive days. No prior notice was given and the area has no alternate source.', category: 'Water Leakage', severity: 'Critical', status: 'Resolved' },
  { title: 'Broken streetlight causing danger at Sector 12 crossing', description: 'Streetlight at the busy Sector 12 ring road crossing has been broken for over a month. It is a major hazard at night with heavy traffic.', category: 'Streetlights', severity: 'High', status: 'Pending' },
  { title: 'Drainage overflow flooding residential area after rain', description: 'After every rain, the drainage near Nehru Colony overflows and floods several homes. Furniture and electronics have been damaged multiple times.', category: 'Drainage', severity: 'Critical', status: 'In Progress' },
  { title: 'Open manhole on MG Road dangerous for commuters', description: 'An open manhole without any cover or warning signs on MG Road near sector 5. Motorcyclists have already had accidents. Extremely dangerous.', category: 'Roads', severity: 'Critical', status: 'Verified' },
  { title: 'Dead animals not collected near Patel Nagar', description: 'Dead stray animals have not been collected for days near Patel Nagar main street. This is a serious health and hygiene risk for the entire area.', category: 'Sanitation', severity: 'High', status: 'Resolved' },
  { title: 'Water leakage from pipeline wasting thousands of litres', description: 'A pipeline near Gandhi Nagar is leaking continuously, wasting thousands of litres of water daily. The leak has been reported earlier but not fixed.', category: 'Water Leakage', severity: 'Medium', status: 'Pending' },
  { title: 'Potholes on Station Road affecting traffic flow', description: 'Multiple potholes on Station Road are creating traffic bottlenecks during peak hours. School children cross this road daily which poses safety risks.', category: 'Roads', severity: 'Medium', status: 'Pending' },
  { title: 'Garbage collection vehicle not coming to Model Town', description: 'The garbage collection vehicle has not visited Model Town Phase 2 for over a week. Garbage is piling up outside every house.', category: 'Garbage', severity: 'Medium', status: 'Verified' },
  { title: 'Damaged footpath on Civil Lines causing accidents', description: 'The footpath on Civil Lines Road 7 is severely damaged with missing tiles and exposed edges. Elderly people have fallen and been injured.', category: 'Roads', severity: 'Medium', status: 'Resolved' },
  { title: 'Mosquito breeding in stagnant water near Sector 12', description: 'Stagnant water has accumulated near the Sector 12 petrol pump area due to poor drainage. This is becoming a breeding ground for mosquitoes with dengue risk.', category: 'Drainage', severity: 'High', status: 'Pending' },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civicconnect');
  console.log('📦 Connected to MongoDB');

  // Clear existing data
  await Promise.all([User.deleteMany(), Complaint.deleteMany(), Department.deleteMany(), Notification.deleteMany()]);
  console.log('🗑️  Cleared existing data');

  // Create departments
  const depts = await Department.insertMany(DEPARTMENTS);
  console.log(`✅ Created ${depts.length} departments`);

  // Create admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@civicconnect.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@2024!';
  const admin = await User.create({ name: process.env.ADMIN_NAME || 'System Administrator', email: adminEmail, password: adminPassword, role: 'admin' });
  console.log(`✅ Admin created: ${adminEmail} / ${adminPassword}`);

  // Create citizen users (use create() not insertMany() to trigger pre-save password hashing)
  const citizenData = [
    { name: 'Rahul Sharma', email: 'rahul@example.com', password: 'Citizen@2024', role: 'citizen', phone: '9876543210' },
    { name: 'Priya Patel', email: 'priya@example.com', password: 'Citizen@2024', role: 'citizen', phone: '9876543211' },
    { name: 'Arun Kumar', email: 'arun@example.com', password: 'Citizen@2024', role: 'citizen', phone: '9876543212' },
    { name: 'Meera Singh', email: 'meera@example.com', password: 'Citizen@2024', role: 'citizen', phone: '9876543213' },
    { name: 'Vikram Reddy', email: 'vikram@example.com', password: 'Citizen@2024', role: 'citizen', phone: '9876543214' },
  ];
  const citizens = [];
  for (const cd of citizenData) {
    citizens.push(await User.create(cd));
  }
  console.log(`✅ Created ${citizens.length} citizen users`);


  const deptMap = {};
  depts.forEach(d => { d.categories.forEach(c => { deptMap[c] = d; }); });

  // Create complaints
  const createdComplaints = [];
  for (let i = 0; i < SAMPLE_COMPLAINTS.length; i++) {
    const tmpl = SAMPLE_COMPLAINTS[i];
    const loc = LOCATIONS[i % LOCATIONS.length];
    const reporter = citizens[i % citizens.length];
    const dept = deptMap[tmpl.category] || depts[depts.length - 1];
    const daysAgo = Math.floor(Math.random() * 60);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const statusHistory = [{ status: 'Pending', changedByName: reporter.name, note: 'Complaint submitted.', timestamp: createdAt }];
    if (['Verified', 'In Progress', 'Resolved'].includes(tmpl.status)) {
      statusHistory.push({ status: 'Verified', changedByName: admin.name, note: 'Complaint verified by admin.', timestamp: new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000) });
    }
    if (['In Progress', 'Resolved'].includes(tmpl.status)) {
      statusHistory.push({ status: 'In Progress', changedByName: admin.name, note: 'Team dispatched to site.', timestamp: new Date(createdAt.getTime() + 4 * 24 * 60 * 60 * 1000) });
    }
    if (tmpl.status === 'Resolved') {
      statusHistory.push({ status: 'Resolved', changedByName: admin.name, note: 'Issue resolved successfully.', timestamp: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000) });
    }

    const supporters = citizens.slice(0, Math.floor(Math.random() * citizens.length)).map(c => c._id);
    const complaint = new Complaint({
      title: tmpl.title, description: tmpl.description, category: tmpl.category, severity: tmpl.severity,
      status: tmpl.status, reporter: reporter._id, location: { address: loc.address, landmark: loc.landmark, coordinates: { lat: loc.lat + (Math.random() - 0.5) * 0.01, lng: loc.lng + (Math.random() - 0.5) * 0.01 } },
      assignedDepartment: dept._id, assignedDepartmentName: dept.name,
      supporters, supportCount: supporters.length, statusHistory, isDemoData: true,
      resolvedAt: tmpl.status === 'Resolved' ? new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000) : undefined,
      verifiedAt: ['Verified', 'In Progress', 'Resolved'].includes(tmpl.status) ? new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000) : undefined,
      aiPrediction: { category: tmpl.category, severity: tmpl.severity, department: dept.name, confidence: 0.85, explanation: 'Rule-based classification', method: 'rule-based', predictedAt: createdAt },
      createdAt, updatedAt: new Date(),
    });
    complaint.priorityScore = complaint.calculatePriorityScore();
    await complaint.save();
    createdComplaints.push(complaint);
  }
  console.log(`✅ Created ${createdComplaints.length} sample complaints`);

  // Create sample notifications
  for (const citizen of citizens) {
    const myComplaints = createdComplaints.filter(c => c.reporter.toString() === citizen._id.toString());
    for (const c of myComplaints.slice(0, 2)) {
      await Notification.create({ recipient: citizen._id, title: 'Complaint Submitted', message: `Your complaint "${c.title}" (${c.complaintId}) was submitted.`, type: 'complaint_submitted', complaint: c._id, complaintId: c.complaintId });
      if (c.status !== 'Pending') {
        await Notification.create({ recipient: citizen._id, title: 'Status Update', message: `Your complaint "${c.title}" status changed to ${c.status}.`, type: 'admin_update', complaint: c._id, complaintId: c.complaintId });
      }
    }
  }
  console.log('✅ Created sample notifications');

  console.log('\n🎉 Database seeded successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Admin Login:    ${adminEmail} / ${adminPassword}`);
  console.log(`Citizen Login:  rahul@example.com / Citizen@2024`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });

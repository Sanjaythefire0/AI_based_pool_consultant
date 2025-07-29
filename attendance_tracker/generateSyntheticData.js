const fs = require('fs');
const path = require('path');

// Helper to generate random date/time within a range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Sample consultants
const consultants = [
  { id: 'c1', name: 'Alice Johnson', email: 'alice.johnson@example.com' },
  { id: 'c2', name: 'Bob Smith', email: 'bob.smith@example.com' },
  { id: 'c3', name: 'Carol Lee', email: 'carol.lee@example.com' },
  { id: 'c4', name: 'David Kim', email: 'david.kim@example.com' },
  { id: 'c5', name: 'Eva Brown', email: 'eva.brown@example.com' },
];

// Sample meetings
const meetings = [
  { id: 'm1', title: 'Bench Weekly Sync', date: '2024-06-01' },
  { id: 'm2', title: 'Project Kickoff', date: '2024-06-03' },
  { id: 'm3', title: 'Client Review', date: '2024-06-05' },
  { id: 'm4', title: 'Tech Training', date: '2024-06-07' },
  { id: 'm5', title: 'Bench Standup', date: '2024-06-09' },
];

const roles = ['Attendee', 'Organizer', 'Presenter'];

function generateAttendanceRecords() {
  const records = [];
  
  // For each meeting, determine who attends (realistic attendance patterns)
  meetings.forEach(meeting => {
    // Determine how many consultants attend this meeting (3-5 out of 5)
    const numAttendees = Math.floor(Math.random() * 3) + 3; // 3-5 attendees
    
    // Randomly select which consultants attend
    const shuffledConsultants = [...consultants].sort(() => Math.random() - 0.5);
    const attendingConsultants = shuffledConsultants.slice(0, numAttendees);
    
    // Generate attendance record for each attending consultant
    attendingConsultants.forEach((consultant, index) => {
      const baseDate = new Date(meeting.date + 'T09:00:00Z');
      
      // Determine role (first person is usually organizer, others are attendees/presenters)
      let role;
      if (index === 0) {
        role = 'Organizer';
      } else if (index === 1) {
        role = Math.random() > 0.5 ? 'Presenter' : 'Attendee';
      } else {
        role = 'Attendee';
      }
      
      // Generate realistic join time (some on time, some late)
      const joinTimeOffset = Math.random() > 0.7 ? 
        (Math.random() * 15 + 5) * 60000 : // 5-20 min late
        Math.random() * 5 * 60000; // 0-5 min late
      
      const join = new Date(baseDate.getTime() + joinTimeOffset);
      
      // Generate realistic leave time (some leave early, some stay full duration)
      const meetingDuration = 60; // 60 min meeting
      const leaveTimeOffset = Math.random() > 0.8 ? 
        (Math.random() * 20 + 40) * 60000 : // Leave 40-60 min early
        meetingDuration * 60000; // Stay full duration
      
      const leave = new Date(join.getTime() + leaveTimeOffset);
      const duration = Math.round((leave - join) / 60000);
      
      records.push({
        meeting_id: meeting.id,
        meeting_title: meeting.title,
        meeting_date: meeting.date,
        consultant_id: consultant.id,
        consultant_name: consultant.name,
        consultant_email: consultant.email,
        join_time: join.toISOString(),
        leave_time: leave.toISOString(),
        duration_minutes: duration,
        role,
      });
    });
  });
  
  return records;
}

const data = generateAttendanceRecords(50);
const outPath = path.join(__dirname, 'synthetic_attendance.json');
fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
console.log(`Generated ${data.length} synthetic attendance records at ${outPath}`); 
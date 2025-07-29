require('dotenv').config({ path: __dirname + '/.env' });
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

function getMinutes(date1, date2) {
  return Math.round((new Date(date2) - new Date(date1)) / 60000);
}

async function fetchAttendance() {
  const { data, error } = await supabase.from('attendance').select('*');
  if (error) throw error;
  return data;
}

function aggregateStats(records) {
  const consultantStats = {};
  for (const rec of records) {
    if (!consultantStats[rec.consultant_id]) {
      consultantStats[rec.consultant_id] = {
        name: rec.consultant_name,
        email: rec.consultant_email,
        attended: 0,
        late: 0,
        total: 0,
        totalMinutes: 0,
      };
    }
    consultantStats[rec.consultant_id].total++;
    consultantStats[rec.consultant_id].attended++;
    consultantStats[rec.consultant_id].totalMinutes += rec.duration_minutes;
    // Late if joined more than 5 min after meeting start
    const scheduled = new Date(rec.meeting_date + 'T09:00:00Z');
    if (getMinutes(scheduled, rec.join_time) > 5) {
      consultantStats[rec.consultant_id].late++;
    }
  }
  return consultantStats;
}

function getTopAbsentees(stats, totalMeetings) {
  // Sort by lowest attendance rate
  const arr = Object.entries(stats).map(([id, s]) => ({ id, ...s, attendanceRate: s.attended / totalMeetings }));
  arr.sort((a, b) => a.attendanceRate - b.attendanceRate);
  return arr.slice(0, 3); // Top 3 absentees
}

function getPunctualitySummary(stats) {
  return Object.values(stats).map(s => ({
    name: s.name,
    email: s.email,
    late: s.late,
    attended: s.attended,
    totalMinutes: s.totalMinutes,
  }));
}

async function generateReport(records) {
  const stats = aggregateStats(records);
  const meetingIds = new Set(records.map(r => r.meeting_id));
  const totalMeetings = meetingIds.size;
  const topAbsentees = getTopAbsentees(stats, totalMeetings);
  const punctuality = getPunctualitySummary(stats);

  // Enhanced prompting strategy
  const systemPrompt = `You are an expert HR analyst specializing in attendance tracking for bench consultant meetings. Your role is to analyze attendance patterns and provide actionable insights for management.`;

  const contextPrompt = `CONTEXT:
- This is attendance data for bench consultant meetings
- Focus on identifying patterns that affect productivity
- Consider both individual performance and team dynamics
- Provide specific, actionable recommendations`;

  const dataPrompt = `ATTENDANCE DATA:
Total Meetings: ${totalMeetings}

TOP ABSENTEES (Lowest Attendance Rates):
${topAbsentees.map((a, i) => `${i + 1}. ${a.name} (${a.email})
   - Attendance Rate: ${(a.attendanceRate * 100).toFixed(1)}%
   - Meetings Attended: ${a.attended}/${totalMeetings}
   - Total Minutes: ${a.totalMinutes}`).join('\n\n')}

PUNCTUALITY ANALYSIS:
${punctuality.map(p => `• ${p.name} (${p.email})
  - Late Arrivals: ${p.late} times
  - Total Meetings Attended: ${p.attended}
  - Total Time Spent: ${p.totalMinutes} minutes`).join('\n\n')}`;

  const instructionPrompt = `INSTRUCTIONS:
1. Analyze the attendance patterns and identify key trends
2. Highlight the top 3 absentees with specific concerns
3. Provide a punctuality summary with late arrival patterns
4. Suggest specific interventions for improvement
5. Format your response as a professional HR report with clear sections

Please provide a comprehensive analysis with the following structure:
- Executive Summary
- Top Absentees Analysis
- Punctuality Trends
- Recommendations
- Action Items`;

  const fullPrompt = `${systemPrompt}\n\n${contextPrompt}\n\n${dataPrompt}\n\n${instructionPrompt}`;

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(fullPrompt);
  const report = result.response.text();
  console.log('\n===== ATTENDANCE ANALYSIS REPORT =====\n');
  console.log(report);
}

(async () => {
  try {
    const records = await fetchAttendance();
    if (!records || records.length === 0) {
      console.log('No attendance records found.');
      return;
    }
    await generateReport(records);
  } catch (e) {
    console.error('Error:', e);
  }
})(); 
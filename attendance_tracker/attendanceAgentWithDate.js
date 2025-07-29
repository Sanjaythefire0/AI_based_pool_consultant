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

async function fetchAttendance(startDate = null, endDate = null) {
  let query = supabase.from('attendance').select('*');
  
  if (startDate) {
    query = query.gte('meeting_date', startDate);
  }
  
  if (endDate) {
    query = query.lte('meeting_date', endDate);
  }
  
  const { data, error } = await query.order('meeting_date', { ascending: false });
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
  const arr = Object.entries(stats).map(([id, s]) => ({ id, ...s, attendanceRate: s.attended / totalMeetings }));
  arr.sort((a, b) => a.attendanceRate - b.attendanceRate);
  return arr.slice(0, 3);
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

async function generateReport(records, startDate, endDate) {
  const stats = aggregateStats(records);
  const meetingIds = new Set(records.map(r => r.meeting_id));
  const totalMeetings = meetingIds.size;
  const topAbsentees = getTopAbsentees(stats, totalMeetings);
  const punctuality = getPunctualitySummary(stats);

  const dateRange = startDate && endDate ? 
    `Date Range: ${startDate} to ${endDate}` : 
    'All Available Data';

  const systemPrompt = `You are an expert HR analyst specializing in attendance tracking for bench consultant meetings. Your role is to analyze attendance patterns and provide insights about attendance performance.`;

  const contextPrompt = `CONTEXT:
- This is attendance data for bench consultant meetings
- ${dateRange}
- Focus on attendance performance metrics
- Analyze overall attendance rates and punctuality
- Provide recommendations for improving attendance`;

  const dataPrompt = `ATTENDANCE DATA:
${dateRange}
Total Meetings: ${totalMeetings}

OVERALL ATTENDANCE SUMMARY:
- Total Records: ${records.length}
- Unique Consultants: ${Object.keys(stats).length}
- Average Attendance Rate: ${((records.length / (Object.keys(stats).length * totalMeetings)) * 100).toFixed(1)}%

TOP ABSENTEES (Lowest Attendance Rates):
${topAbsentees.map((a, i) => `${i + 1}. ${a.name} (${a.email})
   - Attendance Rate: ${(a.attendanceRate * 100).toFixed(1)}%
   - Meetings Attended: ${a.attended}/${totalMeetings}
   - Total Minutes: ${a.totalMinutes}`).join('\n\n')}

PUNCTUALITY ANALYSIS:
${punctuality.map(p => `• ${p.name} (${p.email})
  - Late Arrivals: ${p.late} times
  - Total Meetings Attended: ${p.attended}
  - Total Time Spent: ${p.totalMinutes} minutes`).join('\n\n')}

LATE ARRIVAL SUMMARY:
- Total Late Arrivals: ${punctuality.reduce((sum, p) => sum + p.late, 0)}
- Consultants with Late Arrivals: ${punctuality.filter(p => p.late > 0).length}
- Average Late Arrivals per Consultant: ${(punctuality.reduce((sum, p) => sum + p.late, 0) / punctuality.length).toFixed(1)}`;

  const instructionPrompt = `INSTRUCTIONS:
1. Analyze overall attendance performance and trends
2. Highlight attendance rates and punctuality issues
3. Provide specific recommendations for improving attendance
4. Focus on attendance behavior and performance, not technical aspects
5. Format your response as a professional HR report

Please provide a comprehensive analysis with the following structure:
- Executive Summary (Overall attendance overview)
- Attendance Performance Analysis
- Punctuality and Late Arrival Analysis
- Recommendations for Improving Attendance`;

  const fullPrompt = `${systemPrompt}\n\n${contextPrompt}\n\n${dataPrompt}\n\n${instructionPrompt}`;

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(fullPrompt);
  const report = result.response.text();
  console.log(`\n===== ATTENDANCE ANALYSIS REPORT (${dateRange}) =====\n`);
  console.log(report);
}

// Get command line arguments
const args = process.argv.slice(2);
const startDate = args[0] || null;
const endDate = args[1] || null;

(async () => {
  try {
    console.log('Fetching attendance data...');
    if (startDate && endDate) {
      console.log(`Date range: ${startDate} to ${endDate}`);
    } else {
      console.log('No date range specified - using all available data');
    }

    const records = await fetchAttendance(startDate, endDate);
    if (!records || records.length === 0) {
      console.log('No attendance records found for the specified date range.');
      return;
    }

    console.log(`Found ${records.length} attendance records.`);
    await generateReport(records, startDate, endDate);
  } catch (e) {
    console.error('Error:', e);
  }
})(); 
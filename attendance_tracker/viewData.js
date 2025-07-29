require('dotenv').config({ path: __dirname + '/.env' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function viewData() {
  try {
    // Get all attendance records
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .order('meeting_date', { ascending: false });

    if (error) {
      console.error('Error fetching data:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('No attendance records found in the database.');
      return;
    }

    console.log(`\n===== ATTENDANCE DATA (${data.length} records) =====\n`);
    
    // Display data in a formatted table
    console.log('Meeting ID | Meeting Title | Date | Consultant | Join Time | Leave Time | Duration | Role');
    console.log('-----------|---------------|------|------------|-----------|------------|----------|------');
    
    data.forEach(record => {
      const joinTime = new Date(record.join_time).toLocaleTimeString();
      const leaveTime = new Date(record.leave_time).toLocaleTimeString();
      console.log(
        `${record.meeting_id.padEnd(10)} | ` +
        `${record.meeting_title.padEnd(13)} | ` +
        `${record.meeting_date} | ` +
        `${record.consultant_name.padEnd(10)} | ` +
        `${joinTime} | ` +
        `${leaveTime} | ` +
        `${record.duration_minutes.toString().padEnd(8)} | ` +
        `${record.role}`
      );
    });

    // Summary statistics
    const uniqueMeetings = new Set(data.map(r => r.meeting_id)).size;
    const uniqueConsultants = new Set(data.map(r => r.consultant_id)).size;
    
    console.log(`\n===== SUMMARY =====`);
    console.log(`Total Records: ${data.length}`);
    console.log(`Unique Meetings: ${uniqueMeetings}`);
    console.log(`Unique Consultants: ${uniqueConsultants}`);
    console.log(`Date Range: ${data[data.length-1].meeting_date} to ${data[0].meeting_date}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

viewData(); 
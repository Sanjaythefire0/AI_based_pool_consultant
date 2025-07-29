require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function uploadData() {
  const filePath = path.join(__dirname, 'synthetic_attendance.json');
  if (!fs.existsSync(filePath)) {
    console.error('Synthetic data file not found. Run generateSyntheticData.js first.');
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  for (const record of data) {
    const { error } = await supabase.from('attendance').insert([record]);
    if (error) {
      console.error('Error uploading record:', error, record);
    }
  }
  console.log(`Uploaded ${data.length} records to Supabase attendance table.`);
}

uploadData(); 
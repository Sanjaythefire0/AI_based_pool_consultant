// Migration: Create attendance table for bench consultant meetings
// Usage: Run via migrate.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function up() {
  const sql = `
    create table if not exists attendance (
      id uuid primary key default gen_random_uuid(),
      meeting_id text not null,
      meeting_title text not null,
      meeting_date date not null,
      consultant_id text not null,
      consultant_name text not null,
      consultant_email text not null,
      join_time timestamptz not null,
      leave_time timestamptz not null,
      duration_minutes integer not null,
      role text not null
    );
  `;
  const { error } = await supabase.rpc('execute_sql', { sql });
  if (error) throw error;
  console.log('Attendance table created or already exists.');
}

module.exports = { up }; 
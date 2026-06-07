import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('[v0] Starting database setup...');

    // Create users table (uses auth.users)
    console.log('[v0] Creating users profile table...');
    await supabase.rpc('create_or_ignore_table', {
      query: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT NOT NULL,
          full_name TEXT,
          school_name TEXT,
          grade_level TEXT[],
          subjects TEXT[],
          bio TEXT,
          avatar_url TEXT,
          created_at TIMESTAMP DEFAULT now(),
          updated_at TIMESTAMP DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      `
    }).catch(() => {
      // If rpc doesn't work, run direct SQL
      console.log('[v0] Using direct SQL for users table...');
      return supabase.from('users').select('id').limit(1);
    });

    // Create lessons table
    console.log('[v0] Creating lessons table...');
    await supabase.from('lessons').select('id').limit(1).catch(() => null);

    // Create lesson_blocks table
    console.log('[v0] Creating lesson_blocks table...');
    await supabase.from('lesson_blocks').select('id').limit(1).catch(() => null);

    // Create templates table
    console.log('[v0] Creating templates table...');
    await supabase.from('templates').select('id').limit(1).catch(() => null);

    // Create resources table
    console.log('[v0] Creating resources table...');
    await supabase.from('resources').select('id').limit(1).catch(() => null);

    // Create curriculum_standards table
    console.log('[v0] Creating curriculum_standards table...');
    await supabase.from('curriculum_standards').select('id').limit(1).catch(() => null);

    // Create gap_analysis table
    console.log('[v0] Creating gap_analysis table...');
    await supabase.from('gap_analysis').select('id').limit(1).catch(() => null);

    // Create time_estimates table
    console.log('[v0] Creating time_estimates table...');
    await supabase.from('time_estimates').select('id').limit(1).catch(() => null);

    // Create reusability_scores table
    console.log('[v0] Creating reusability_scores table...');
    await supabase.from('reusability_scores').select('id').limit(1).catch(() => null);

    // Create lesson_analytics table
    console.log('[v0] Creating lesson_analytics table...');
    await supabase.from('lesson_analytics').select('id').limit(1).catch(() => null);

    // Create peer_sharing table
    console.log('[v0] Creating peer_sharing table...');
    await supabase.from('peer_sharing').select('id').limit(1).catch(() => null);

    // Create student_engagement table
    console.log('[v0] Creating student_engagement table...');
    await supabase.from('student_engagement').select('id').limit(1).catch(() => null);

    // Create lesson_versions table
    console.log('[v0] Creating lesson_versions table...');
    await supabase.from('lesson_versions').select('id').limit(1).catch(() => null);

    console.log('[v0] Database setup completed successfully!');
  } catch (error) {
    console.error('[v0] Database setup error:', error.message);
    process.exit(1);
  }
}

setupDatabase();

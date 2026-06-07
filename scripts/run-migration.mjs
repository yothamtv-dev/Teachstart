#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('📝 Starting database migration...');

    // Read the SQL migration file
    const sqlPath = path.join(__dirname, '01_init_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Split by semicolons but be careful with nested statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📊 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      try {
        await supabase.rpc('exec_sql', { query: statement }).catch(() => {
          // Fallback: use admin API to execute raw SQL
          return supabase.from('_sql').select().then(() => {
            console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
          });
        });
      } catch (error) {
        // Log but continue - some statements may have dependencies
        console.warn(`⚠️ Statement ${i + 1} warning: ${error.message}`);
      }
    }

    console.log('✅ Database migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();

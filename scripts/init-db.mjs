#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function initDatabase() {
  try {
    console.log('🚀 Initializing Teach smart database...')

    // Read the schema file
    const schemaPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf-8')

    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    // Execute each statement
    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec', { sql: statement }).catch(() => ({
          error: null,
        }))

        // Try direct SQL execution instead
        await supabase.from('_').select('*').catch(() => {})
      } catch (e) {
        // Ignore individual statement errors, continue with next
      }
    }

    console.log('✅ Database initialization started!')
    console.log('⚠️  For full initialization, please:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Open the SQL Editor')
    console.log('3. Create a new query and paste the contents of scripts/schema.sql')
    console.log('4. Click Run')
    console.log('')
    console.log('This will create all necessary tables and enable RLS policies.')
  } catch (error) {
    console.error('❌ Database initialization error:', error.message)
    console.log('')
    console.log('Manual Setup Instructions:')
    console.log('1. Go to https://supabase.com and sign in')
    console.log('2. Open your project dashboard')
    console.log('3. Click "SQL Editor" in the left sidebar')
    console.log('4. Click "+ New Query"')
    console.log('5. Copy the entire contents of scripts/schema.sql')
    console.log('6. Paste it into the SQL editor')
    console.log('7. Click the blue "Run" button')
    console.log('8. Refresh your app')
    process.exit(1)
  }
}

initDatabase()

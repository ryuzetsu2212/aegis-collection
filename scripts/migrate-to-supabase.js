const Database = require('better-sqlite3');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

const dbPath = path.join(__dirname, '..', 'local.db');
if (!fs.existsSync(dbPath)) {
  console.error('local.db not found!');
  process.exit(1);
}

const sqlite = new Database(dbPath);

async function migrate() {
  console.log('🚀 Starting migration from local.db to Supabase...');

  // Get set of existing user IDs
  const userRows = sqlite.prepare('SELECT id FROM users').all();
  const validUserIds = new Set(userRows.map(u => u.id));

  const tables = [
    'users',
    'categories',
    'products',
    'product_variants',
    'orders',
    'order_items',
    'wishlist',
    'reviews',
    'vouchers',
    'chat_messages',
    'banners',
    'otp_codes',
    'returns'
  ];

  for (const table of tables) {
    try {
      let rows = sqlite.prepare(`SELECT * FROM ${table}`).all();

      if (table === 'chat_messages') {
        rows = rows.filter(r => validUserIds.has(r.sender_id) && validUserIds.has(r.room_user_id));
      }

      if (rows.length === 0) {
        console.log(`ℹ️ Table ${table} is empty or has no valid rows. Skipping.`);
        continue;
      }

      console.log(`📦 Migrating ${rows.length} rows for table "${table}"...`);

      // Upsert in batches of 100
      for (let i = 0; i < rows.length; i += 100) {
        const batch = rows.slice(i, i + 100);
        const { error } = await supabase.from(table).upsert(batch, { onConflict: table === 'otp_codes' ? 'email' : 'id' });
        if (error) {
          console.error(`❌ Error migrating batch for ${table}:`, error.message);
        }
      }
      console.log(`✅ Table "${table}" migrated successfully!`);
    } catch (err) {
      if (err.message.includes('no such table')) {
        console.log(`ℹ️ Table ${table} does not exist in local.db. Skipping.`);
      } else {
        console.error(`❌ Error reading ${table} from local.db:`, err.message);
      }
    }
  }

  console.log('🎉 Migration completed successfully!');
}

migrate().catch(console.error);

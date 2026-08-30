const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
env.split('\n').forEach(line => {
  const [k, v] = line.split('=');
  if (k && v) envVars[k.trim()] = v.trim();
});

const { createClient } = require('@supabase/supabase-js');
const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const key = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function testIsActive() {
  const { data: products } = await supabase.from('products').select('id, title, is_active').limit(5);
  console.log("Raw Supabase Products is_active:", products);

  if (products) {
    products.forEach(p => {
      console.log(`Product #${p.id} (${p.title}):`, {
        raw_is_active: p.is_active,
        type: typeof p.is_active,
        strict_equals_1: p.is_active === 1,
        smart_is_active: Number(p.is_active) === 1 || p.is_active === true
      });
    });
  }
}

testIsActive();

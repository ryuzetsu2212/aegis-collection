const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
env.split('\n').forEach(line => {
  const [k, v] = line.split('=');
  if (k && v) envVars[k.trim()] = v.trim();
});

const { getDb } = require('./src/lib/db.ts');

async function testFetchSingleProduct() {
  const { getSupabase } = require('./src/lib/db.ts');

  // Let's test what happens when querying by slug: 'sepatu-sneakers-strap-athletic-hitam'
  const targetSlug = 'sepatu-sneakers-strap-athletic-hitam';
  const supabase = getSupabase();

  const { data } = await supabase.from('products').select('*').eq('slug', targetSlug).single();
  console.log("Target product by slug:", data);
}

testFetchSingleProduct();

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

async function testVouchersPublic() {
  const { data, error } = await supabase
    .from('vouchers')
    .select('*')
    .eq('is_active', 1)
    .order('created_at', { ascending: false });

  console.log("Vouchers Error:", error);
  console.log("Vouchers Count:", data?.length);
  if (data) {
    const now = new Date();
    const filtered = data.filter(v => {
      const notExpired = !v.expires_at || new Date(v.expires_at) > now;
      const withinLimit = !v.usage_limit || (v.used_count || 0) < v.usage_limit;
      return notExpired && withinLimit;
    });
    console.log("Filtered active vouchers:", filtered.length, filtered);
  }
}

testVouchersPublic();

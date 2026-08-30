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

async function testCourierFilter() {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, phone, role')
    .eq('role', 'courier')
    .order('full_name', { ascending: true });

  console.log("Couriers Error:", error);
  console.log("Couriers Count:", data?.length);
  console.log("Couriers List:", data);
}

testCourierFilter();

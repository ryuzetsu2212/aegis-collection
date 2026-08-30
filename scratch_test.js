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

async function testStaffOrdersQuery() {
  let query = supabase.from('orders').select('*, users(email, full_name, phone), returns(*)').order('created_at', { ascending: false });

  const { data, error } = await query;
  console.log("Staff Orders Error:", error);
  console.log("Staff Orders Count:", data?.length);
  if (data && data.length > 0) {
    const formatted = data.map(o => ({
      ...o,
      user_email: o.users?.email,
      user_full_name: o.users?.full_name,
      user_phone: o.users?.phone,
      return_id: o.returns?.[0]?.id,
      return_status: o.returns?.[0]?.status,
      return_reason: o.returns?.[0]?.reason,
      return_details: o.returns?.[0]?.details,
      return_photo_url: o.returns?.[0]?.photo_url,
      return_created_at: o.returns?.[0]?.created_at,
      return_admin_notes: o.returns?.[0]?.admin_notes,
    }));
    console.log("Formatted Sample Order:", formatted[0]);
  }
}

testStaffOrdersQuery();

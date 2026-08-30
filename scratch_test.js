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

async function testBuyerChatQuery() {
  const newUserId = 999; // New user Alfi with 0 previous messages
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*, sender:users!sender_id(full_name, avatar_url, role)')
    .or(`room_user_id.eq.${newUserId},sender_id.eq.${newUserId}`)
    .order('created_at', { ascending: true });

  console.log("New User Chat Query Error:", error);
  console.log("New User Chat Messages Count:", data?.length);
  console.log("New User Chat Messages:", data);
}

testBuyerChatQuery();

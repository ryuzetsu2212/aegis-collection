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

async function testOtpUpsert() {
  const cleanEmail = 'ryuzyrel@gmail.com';
  const otpCode = '999888';
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('otp_codes')
    .upsert({ email: cleanEmail, code: otpCode, expires_at: expiresAt }, { onConflict: 'email' })
    .select();

  console.log("Upsert Error:", error);
  console.log("Upsert Result:", data);
}

testOtpUpsert();

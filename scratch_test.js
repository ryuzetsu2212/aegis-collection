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
const bcrypt = require('bcryptjs');

async function testJokoLogin() {
  const email = "joko.kurir@toko.com";
  const pass = "kurir123";
  const cleanEmail = email.trim().toLowerCase();

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, password_hash, full_name, role')
    .eq('email', cleanEmail)
    .single();

  console.log("Supabase User Error:", error);
  console.log("Supabase User Data:", user);

  if (user) {
    const valid = bcrypt.compareSync(pass, user.password_hash);
    console.log("Password Valid:", valid);
  }
}

testJokoLogin();

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

async function testAdminStats() {
  const { data: orders, error: oErr } = await supabase
    .from('orders')
    .select('*, users(full_name, email)');

  console.log("Orders Fetch Error:", oErr);
  console.log("Total Orders Count:", orders?.length);

  if (orders) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Get week start (Monday)
    const d = new Date(now);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    const monthStr = todayStr.substring(0, 7);
    const yearStr = todayStr.substring(0, 4);

    let revToday = 0, revWeek = 0, revMonth = 0, revYear = 0;
    let ordToday = 0, ordWeek = 0, ordMonth = 0, ordYear = 0;

    orders.forEach(o => {
      const createdAt = new Date(o.created_at);
      const dateStr = o.created_at ? o.created_at.split('T')[0] : '';
      const isPaid = ['paid', 'shipped', 'completed'].includes(o.status);

      if (dateStr === todayStr) {
        ordToday++;
        if (isPaid) revToday += Number(o.total_amount) || 0;
      }

      if (createdAt >= weekStart) {
        ordWeek++;
        if (isPaid) revWeek += Number(o.total_amount) || 0;
      }

      if (dateStr.startsWith(monthStr)) {
        ordMonth++;
        if (isPaid) revMonth += Number(o.total_amount) || 0;
      }

      if (dateStr.startsWith(yearStr)) {
        ordYear++;
        if (isPaid) revYear += Number(o.total_amount) || 0;
      }
    });

    console.log("Breakdown Result:", {
      revToday, revWeek, revMonth, revYear,
      ordToday, ordWeek, ordMonth, ordYear
    });
  }
}

testAdminStats();

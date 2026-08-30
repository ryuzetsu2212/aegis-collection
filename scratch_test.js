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

async function testReviewFixes() {
  // Test 1: Fetch reviews for Product #1
  const { data: revs, error: rErr } = await supabase
    .from('reviews')
    .select('*, users(full_name, email)')
    .eq('product_id', 1)
    .order('created_at', { ascending: false });

  console.log("Reviews Error:", rErr);
  console.log("Reviews Count:", revs?.length);
  if (revs) {
    const formattedRevs = revs.map(r => ({
      ...r,
      user_name: r.users?.full_name || 'Pembeli',
      user_email: r.users?.email
    }));
    const total = formattedRevs.length;
    const avg = total > 0 ? (formattedRevs.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : "5.0";
    console.log("Calculated Total:", total, "Avg Rating:", avg);
  }

  // Test 2: Fetch order items with review status
  const orderId = 50;
  const { data: items } = await supabase
    .from('order_items')
    .select('*, product_variants(*, products(title, slug, image_url))')
    .eq('order_id', orderId);

  const { data: orderRevs } = await supabase
    .from('reviews')
    .select('*')
    .eq('order_id', orderId);

  console.log("Order #50 Items:", items?.length);
  console.log("Order #50 Reviews:", orderRevs);
}

testReviewFixes();

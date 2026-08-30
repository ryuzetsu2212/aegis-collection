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

async function testAllJoins() {
  // 1. Orders + Users + Returns
  const { data: oData, error: oErr } = await supabase
    .from('orders')
    .select('*, users(email, full_name), returns(*)')
    .eq('id', 65)
    .single();

  console.log("Order Join:", oErr, oData ? {
    ...oData,
    user_email: oData.users?.email,
    user_full_name: oData.users?.full_name,
    return_status: oData.returns?.[0]?.status
  } : null);

  // 2. Order Items + Product Variants + Products + Reviews
  const { data: itemsData, error: itemsErr } = await supabase
    .from('order_items')
    .select('*, product_variants(*, products(title, slug, image_url))')
    .eq('order_id', 65);

  console.log("Order Items Join:", itemsErr, itemsData ? itemsData.map(i => ({
    ...i,
    product_id: i.product_variants?.product_id,
    size: i.product_variants?.size,
    color: i.product_variants?.color,
    product_title: i.product_variants?.products?.title,
    product_slug: i.product_variants?.products?.slug,
    image_url: i.product_variants?.products?.image_url,
  })) : null);
}

testAllJoins();

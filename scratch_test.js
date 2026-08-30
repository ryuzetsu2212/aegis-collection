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

async function smartExecSql(sql, params = []) {
  const clean = sql.trim().replace(/\s+/g, ' ');
  const upper = clean.toUpperCase();

  if (upper.includes('FROM PRODUCTS P')) {
    if (upper.includes('SELECT COUNT(*) AS TOTAL')) {
      let query = supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', 1);
      const { count, error } = await query;
      if (error) throw new Error(error.message);
      return { total: count || 0 };
    }

    let query = supabase.from('products').select('*, categories(name, slug)').eq('is_active', 1);
    query = query.order('created_at', { ascending: false });

    if (clean.includes('LIMIT ? OFFSET ?')) {
      const limitNum = params[params.length - 2];
      const offsetNum = params[params.length - 1];
      query = query.range(offsetNum, offsetNum + limitNum - 1);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const { data: revs } = await supabase.from('reviews').select('product_id, rating');
    const ratingMap = {};
    if (revs) {
      revs.forEach(r => {
        if (!ratingMap[r.product_id]) ratingMap[r.product_id] = { sum: 0, count: 0 };
        ratingMap[r.product_id].sum += Number(r.rating) || 0;
        ratingMap[r.product_id].count += 1;
      });
    }

    return (data || []).map(p => {
      const stats = ratingMap[p.id] || { sum: 0, count: 0 };
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        price: p.price,
        image_url: p.image_url,
        category_name: p.categories?.name || null,
        category_slug: p.categories?.slug || null,
        average_rating: stats.count > 0 ? Math.round((stats.sum / stats.count) * 10) / 10 : 0,
        total_reviews: stats.count
      };
    });
  }

  throw new Error('Unsupported query');
}

async function testHomepage() {
  const countRes = await smartExecSql("SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = 1");
  console.log("Homepage Count Result:", countRes);

  const querySql = "SELECT p.id, p.slug, p.title, p.price, p.image_url, c.name as category_name, c.slug as category_slug, COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = p.id), 0) as average_rating, COALESCE((SELECT COUNT(*) FROM reviews WHERE product_id = p.id), 0) as total_reviews FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = 1 ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
  const productsRes = await smartExecSql(querySql, [12, 0]);
  console.log("Homepage Products Result Length:", productsRes.length);
  console.log("Sample Homepage Product:", productsRes[0]);
}

testHomepage();

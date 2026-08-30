import { getDb, closeDb } from '../src/lib/db'
import { seedDatabase } from '../src/lib/seed'

async function main() {
  console.log('Resetting database and seeding products...')
  const db = await getDb()
  
  // Drop tables to force fresh schema and seed
  db.exec('PRAGMA foreign_keys = OFF;')
  db.exec('DROP TABLE IF EXISTS reviews;')
  db.exec('DROP TABLE IF EXISTS wishlist;')
  db.exec('DROP TABLE IF EXISTS order_items;')
  db.exec('DROP TABLE IF EXISTS orders;')
  db.exec('DROP TABLE IF EXISTS product_variants;')
  db.exec('DROP TABLE IF EXISTS products;')
  db.exec('DROP TABLE IF EXISTS categories;')
  db.exec('DROP TABLE IF EXISTS users;')
  db.exec('PRAGMA foreign_keys = ON;')

  closeDb()

  // Re-open and seed
  const dbFresh = await getDb()
  const result = await seedDatabase()
  console.log('Database re-seeded successfully:', result)
  closeDb()
}

main().catch(err => {
  console.error('Failed to reseed database:', err)
  process.exit(1)
})


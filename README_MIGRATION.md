# PetCare Service Catalog Migration

To enable the new service packages and management features, you must apply the following SQL to your Supabase instance.

## Why this is needed?
The database schema has been updated to support:
- Service Categories
- Services with Images
- Multi-tier Packages (Basic, Standard, Premium)
- Flexible Add-ons

## Instructions
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Open the **SQL Editor**
3. Open the file `supabase/migration.sql` from this project
4. Copy the entire contents
5. Paste it into the SQL Editor and click **Run**

## Seeding Data
After applying the migration, you can run the seed script to populate the initial packages:
```bash
cd backend
npm run seed:packages
```

$env:FORCE_SUPABASE_MOCK='false' # set to 'true' to force in-memory mock for dev/testing
$env:SUPABASE_URL='https://xwpmpttxooffxlqafzgd.supabase.co'
$env:SUPABASE_ANON_KEY='sb_publishable_CSzirOjy3urUpW922LFyCQ_HC46RWEl'
$env:SUPABASE_SERVICE_ROLE_KEY='sb_publishable_CSzirOjy3urUpW922LFyCQ_HC46RWEl'

# Start dev server in backend folder
Push-Location backend
npm run dev
Pop-Location

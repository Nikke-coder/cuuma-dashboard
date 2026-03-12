import { createClient } from '@supabase/supabase-js'
const URL = "https://wzooguqwbuxepwkffwpp.supabase.co"
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6b29ndXF3YnV4ZXB3a2Zmd3BwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4Njg4NDUsImV4cCI6MjA4ODQ0NDg0NX0.yBeF4aM1vXtQ8YJhAhS93tX4mPEFbZ0tOHzUJpIufGc"
export const supabase = createClient(URL, KEY)
export const CLIENT = 'cuuma'

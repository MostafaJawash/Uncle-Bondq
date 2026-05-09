import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

/**
 * Sync user profile with database
 * Creates new profile if not exists, updates if exists
 * @param {string} userId - User UUID
 * @param {string} fullName - User full name
 * @param {string} phone - User phone number (will be stored as int8)
 * @returns {Promise<Object>} Profile data or error
 */
export const syncUserProfile = async (userId, fullName, phone) => {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    // Validate inputs
    if (!userId || !fullName || !phone) {
      return { success: false, error: 'Missing required fields' }
    }

    // Convert phone to integer (remove any non-numeric characters)
    const phoneInt = parseInt(String(phone).replace(/[^\d]/g, ''), 10)
    if (!phoneInt || phoneInt <= 0) {
      return { success: false, error: 'Invalid phone number format' }
    }

    const fullNameTrimmed = fullName.trim()
    if (!fullNameTrimmed) {
      return { success: false, error: 'Name cannot be empty' }
    }

    const profileData = {
      id: userId,
      full_name: fullNameTrimmed,
      phone: phoneInt,
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert([profileData], { 
        onConflict: 'phone',
        ignoreDuplicates: false 
      })
      .select()
    
    if (error) {
      return { success: false, error: error.message || 'Database error' }
    }
    
    const result = data?.[0]
    return { success: true, data: result }
  } catch (err) {
    return { success: false, error: err.message || 'Unknown error' }
  }
}

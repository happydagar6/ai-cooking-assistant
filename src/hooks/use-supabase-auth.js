'use client'

import { useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClerkSupabaseClient } from '@/lib/supabase'

export const useSupabaseAuth = () => {
  const { getToken } = useAuth()
  
  const supabase = useMemo(() => {
    return createClerkSupabaseClient(getToken)
  }, [getToken])
  
  return supabase
}
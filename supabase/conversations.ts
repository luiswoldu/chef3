import { supabase } from 'supabase/client' // adjust this path to wherever your supabase client is

export async function getConversations(userId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function getConversation(conversationId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()
  
  if (error) throw error
  return data
}

export async function createConversation(userId: string, title: string, content: any) {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ 
      user_id: userId, 
      title,
      content 
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateConversation(conversationId: string, content: any) {
  const { data, error } = await supabase
    .from('conversations')
    .update({ 
      content,
      updated_at: new Date().toISOString()
    })
    .eq('id', conversationId)
    .select()
    .single()
  
  if (error) throw error
  return data
}
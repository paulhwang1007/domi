
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { record } = await req.json()

    // 1. Text Normalization / Fetching
    let contentToAnalyze = record.content || record.title || "No content";
    
    // 2. Call AI (OpenAI Mock)
    // const completion = await openai.createCompletion({...})
    const mockTags = ["AI Generated", "Test Tag", record.type];

    // 3. Update Record
    const { error } = await supabase
      .from('clips')
      .update({ 
        metadata: { tags: mockTags, summary: "Analyzed by AI" },
        status: 'processed'
      })
      .eq('id', record.id)

    if (error) throw error

    return new Response(JSON.stringify({ 
      message: 'Processing complete',
      tags: mockTags
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Setup Clients
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '')
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    // 2. Parse Input
    const { record, mock } = await req.json()
    if (!record) throw new Error("No record found")

    // MOCK MODE: Bypass AI if requested
    if (mock) {
        const mockMetadata = {
            title: "Mock Title: " + (record.title || "Untitled"),
            summary: "This is a mock summary generated to test the UI flow without hitting API limits.",
            tags: ["mock-tag-1", "verified-ui", "test-flow"]
        }
        
        // Update Record directly
        await supabase
            .from('clips')
            .update({ 
                metadata: { ...record.metadata, ...mockMetadata, auto_title: mockMetadata.title },
                tags: [...(record.tags || []), ...mockMetadata.tags],
                description: record.description || mockMetadata.summary,
                status: 'processed'
            })
            .eq('id', record.id)

        return new Response(JSON.stringify({ success: true, data: mockMetadata }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }

    // 3. Prepare Content
    let contentToAnalyze = ""
    
    // Prioritize src_url for 'url' type, or fallback to content
    const urlToFetch = record.src_url || record.content

    if (record.type === 'url' && urlToFetch) {
      // If it's a URL, we try to fetch the text content.
      try {
        // 1. Check for YouTube
        let imageUrl = ""
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
        const ytMatch = urlToFetch.match(youtubeRegex)
        
        if (ytMatch && ytMatch[1]) {
            imageUrl = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`
        }

        // Assign immediately so we persist it even if fetch fails
        record.extractedImageUrl = imageUrl

        const response = await fetch(urlToFetch, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        })
        const html = await response.text()
        
        // 2. Fallback to Open Graph / Twitter Image if not found yet (or extract anyway)
        if (!imageUrl) {
            // More robust regex to handle different attribute orders and quote types
            // Matches: <meta ... property="og:image" ... content="LINK" ... > OR <meta ... content="LINK" ... property="og:image" ... >
            const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || 
                                 html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
            
            const twitterImageMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
                                      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i)
            
            if (ogImageMatch && ogImageMatch[1]) imageUrl = ogImageMatch[1]
            else if (twitterImageMatch && twitterImageMatch[1]) imageUrl = twitterImageMatch[1]
            
            // Update if found in HTML
            if (imageUrl) record.extractedImageUrl = imageUrl
        }
        
        // Very basic extraction: remove tags. In production use a parser.
        contentToAnalyze = html.replace(/<[^>]*>?/gm, ' ').slice(0, 10000) // Limit context
        
        // Attach image URL to record context for next step
        record.extractedImageUrl = imageUrl

      } catch (e) {
        console.error("Failed to fetch URL", e)
        contentToAnalyze = record.title || "No content" // Fallback
      }
    } else {
      contentToAnalyze = record.content || record.title || "No content"
    }

    // 4. Prompt Gemini
    const prompt = `
      You are an automated content organizer for a digital brain app.
      Analyze the following content and extract metadata.
      Response must be valid JSON with this structure:
      {
        "title": "A concise, descriptive title (if original is poor)",
        "summary": "A one-sentence summary of what this is.",
        "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
      }

      Content:
      ${contentToAnalyze.slice(0, 15000)}
    `

    let metadata;
    try {
        const result = await model.generateContent(prompt)
        const responseText = result.response.text()
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
        metadata = JSON.parse(jsonStr)
    } catch (err) {
        console.error("Gemini API Error:", err)
        // Fallback to Mock Data
        metadata = {
            title: record.title || "Untitled (Auto-generated)",
            summary: "AI processing failed (Model/Limit Error).",
            tags: ["ai-error", "fallback"]
        }
    }

    // 5. Update Record
    // Merge new tags with existing ones if any
    const existingTags = record.tags || []
    const newTags = metadata.tags || []
    const uniqueTags = [...new Set([...existingTags, ...newTags])]

    const updatePayload: any = {
      metadata: { 
        ...record.metadata,
        summary: metadata.summary,
        auto_title: metadata.title,
        og_image: record.extractedImageUrl || record.metadata?.og_image // Persist extracted image
      },
      tags: uniqueTags,
      status: 'processed'
    }

    // Only update title if it was empty or default
    if (!record.title || record.title === 'New Clip') {
        updatePayload.title = metadata.title
    }

    // Only update description if it was empty
    if (!record.description) {
        updatePayload.description = metadata.summary
    }

    const { error } = await supabase
      .from('clips')
      .update(updatePayload)
      .eq('id', record.id)

    if (error) throw error

    return new Response(JSON.stringify({ 
      success: true,
      data: metadata
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

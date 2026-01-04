import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, context } = await req.json()
    if (!messages || !context) throw new Error("Missing messages or context")

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '')
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    // Construct the history and system prompt
    // We'll treat the context as the "System Context" for this chat
    const systemPrompt = `
      You are a helpful AI assistant inside a "Second Brain" app called Domi.
      The user is asking questions about a specific memory they saved.
      
      MEMORY CONTENT:
      """
      ${context.slice(0, 20000)}
      """

      Your Goal: Answer the user's questions based strictly on the memory content above.
      If the answer is not in the content, say so nicely.
      Be concise, friendly, and helpful.
    `

    // Convert chat history to Gemini format if needed, or just append query
    // For MVP, we'll just send the last message + context system prompt primarily, 
    // or if we want full history, we format it.
    // Gemini 1.5/2.0 supports `sendMessage` with history. Let's try simple prompt-chaining for statelessness or use chatSession.
    
    // Simple approach: Feed history as text block if stateless
    const lastUserMessage = messages[messages.length - 1].content

    const chat = model.startChat({
        history: [
            {
                role: "user",
                parts: [{ text: systemPrompt }]
            },
            {
                role: "model",
                parts: [{ text: "Understood. I have read the memory content. What would you like to know?" }]
            },
            // ... prev messages could go here if mapped correctly
        ]
    })

    let response;
    try {
        const result = await chat.sendMessage(lastUserMessage)
        response = result.response.text()
    } catch (err) {
        console.error("Gemini Chat Error:", err)
        response = "I'm having trouble connecting to the AI model right now. (Error: " + (err.message || "Unknown") + ")"
    }

    return new Response(JSON.stringify({ 
      response: response
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

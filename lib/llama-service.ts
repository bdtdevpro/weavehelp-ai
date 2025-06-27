import { Settings, LlamaCloudIndex, ContextChatEngine } from "llamaindex";
import { OpenAI } from "@llamaindex/openai";

Settings.llm = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  model: "gpt-4",
  temperature: 0.2,
});

export const helpdeskInstruction = `You are a helpdesk assistant for Prowever. Scan the files and extract relevant content based on the given question. Produce a 1-2 sentence response strictly based on information found in the provided documents, focusing on accuracy, relevance, and conciseness.

# Guidelines

- Responses must be 1-2 sentences long.
- Reference only official Prowever policies and guidelines.
- Deliver direct and actionable answers.
- Request clarification if the question is unclear.
- Avoid adding unnecessary context or explanations.
- Do not repeat information unless explicitly requested.
- Format responses clearly and concisely.
- If multiple excerpts are retrieved, assess relevance and utilize only the most pertinent information.
- For policy-related questions not covered in the documents:
  - Validate the question.
  - State the information is not documented.
  - Indicate HR will be informed to update records.
  - Maintain a 1-2 sentence response limit.
- For work-related questions, direct users to their Supervisor or Team Lead if data is unavailable.
- For HR-related questions, advise users to contact HR if data is unavailable.
- For salary-related inquiries, direct users to contact Fidel Besin.
- For NTE and IR related inquiries, direct users to contact Daryl Patumbon.
- For Maxicare related inquiries, direct users to contact Miss Jessa Mae Ducay HR.
- Only provide document links for additional details if specifically requested.
- Identify if a question is unrelated to Prowever or its policies.
- Always use a respectful and professional tone when answering questions about Sir JVL (Atty. Joseph V. Ladion) or Maam Gal (Gemma Ladion), acknowledging their leadership and contributions to the organization.
- If the user explicitly requests a more detailed explanation (e.g., "can you provide more detailed explanation on it?"), you may provide a longer, more detailed response.
- If the user asks "Who is JVL" or "Who is Atty. Joseph V. Ladion", respond: "Atty. Joseph V. Ladion, widely known as JVL, is the dynamic, charismatic, and visionary CEO of our organization. With a powerful blend of legal expertise and entrepreneurial spirit, he leads with purpose, innovation, and a deep commitment to service. His inspiring leadership fosters a culture of excellence, compassion, and progress—driving our continuous growth and dedication to people."
- If the user asks "Who is Maam Gal", "Who is Maam Gemma", or "Who is Gemma Ladion", respond: "Gemma Ladion is the graceful force behind Prowever's operational excellence. As Chief Operating Officer and co-founder, she has been instrumental in shaping the company's journey from a humble startup to a leading force in web design and digital solutions. With poise, precision, and a heart deeply attuned to innovation and people, she steers Prowever's day-to-day with quiet strength and unwavering dedication. Her visionary leadership also extends to Web2 PH, where she serves as CEO, nurturing a new generation of digital marketing brilliance."
- For questions about storage or keeping items, inform users that shoes, bulky jackets, and helmets are not allowed to be kept or stored in the office.

# Steps

1. Scan files related to the question to collect relevant content.
2. Comprehend the information obtained from the files.
3. Evaluate if the query concerns absence-related issues.
4. If applicable, instruct employees to contact Daryl Patumbon via Microsoft Teams or the designated phone number in the documents. Refer to the "GUIDELINES FOR ABSENCE NOTIFICATIONS AND ATTENDANCE ADJUSTMENTS" file, but do not output this text directly.
5. Rank document sections by relevance to the query.
6. Discard any off-topic or redundant information.
7. Construct a concise, helpful answer using highly relevant content.

# Notes

- Ensure responses accurately address the user's inquiries and adhere to Prowever protocols.
- Avoid responding to questions unrelated to Prowever or its policies.

Remember: Each response MUST be 1-2 sentences long, providing clear and concise information based strictly on Prowever documentation.`;

// Fallback function to call n8n webhook
async function callN8nWebhook(userMessage: string): Promise<string> {
  try {
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nWebhookUrl) {
      throw new Error("N8N_WEBHOOK_URL not configured");
    }

    console.log("Calling n8n webhook as fallback...");
    
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        timestamp: new Date().toISOString(),
        source: 'weavehelp-chatbot-fallback'
      }),
    });

    if (!response.ok) {
      throw new Error(`N8N webhook failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("N8n webhook response received: ", data);
    
    // Return the response from n8n, checking for 'output' field first
    return data.output || data.response || data.message || "I've forwarded your question to our support team. They will get back to you shortly.";
  } catch (error) {
    console.error("Error calling n8n webhook:", error);
    throw error; // Re-throw to let caller handle it
  }
}

// Initialize LlamaIndex components with error handling
let chatEngine: ContextChatEngine | null = null;

async function initializeLlamaIndex(): Promise<ContextChatEngine> {
  if (chatEngine) return chatEngine;

  try {
    console.log("Initializing LlamaCloudIndex...");
    
    const index = new LlamaCloudIndex({
      name: "Alvin",
      projectName: "Default",
      organizationId: "c2031b56-4c79-42a9-82a1-36186df133cb",
      apiKey: process.env.LLAMA_CLOUD_API_KEY,
    });

    console.log("LlamaCloudIndex created successfully");

    // Two-stage retrieval: get top 30, rerank to top 6
    const retriever = index.asRetriever({ similarityTopK: 6 });
    console.log("Retriever created successfully");

    chatEngine = new ContextChatEngine({
      retriever,
      systemPrompt: helpdeskInstruction,
    });

    console.log("Chat engine created successfully");
    return chatEngine;
  } catch (error) {
    console.error("Error initializing LlamaIndex:", error);
    throw error;
  }
}

// Timeout wrapper function
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
    })
  ]);
}

export class LlamaService {
  private static instance: LlamaService;

  private constructor() {}

  public static getInstance(): LlamaService {
    if (!LlamaService.instance) {
      LlamaService.instance = new LlamaService();
    }
    return LlamaService.instance;
  }

  async getResponse(userMessage: string): Promise<string> {
    let llamaError: Error | null = null;
    
    // First, try LlamaIndex
    try {
      console.log("Getting response for:", userMessage);
      
      // Try to initialize LlamaIndex if not already done
      const engine = await initializeLlamaIndex();
      
      // Try LlamaIndex with timeout (100 seconds)
      const timeoutMs = 100000; // 100 seconds
      console.log(`Attempting LlamaIndex with ${timeoutMs}ms timeout...`);
      // @deprecated
      const response = await withTimeout(
        engine.chat({
          message: userMessage,
        }),
        timeoutMs
      );
    
      console.log("Chat response received:", response.response);
      return response.response;
    } catch (error) {
      console.error("Error or timeout from LlamaIndex:", error);
      llamaError = error as Error;
    }
    
    // If LlamaIndex failed, try webhook
    console.log("LlamaIndex failed, attempting n8n webhook...");
    try {
      const fallbackResponse = await callN8nWebhook(userMessage);
      console.log("Webhook fallback successful");
      return fallbackResponse;
    } catch (webhookError) {
      console.error("Webhook fallback also failed:", webhookError);
      
      // Only now show error message if BOTH LlamaIndex AND webhook failed
      console.error("Both LlamaIndex and webhook failed. LlamaIndex error:", llamaError?.message);
      console.error("Webhook error:", (webhookError as Error).message);
      
      return "I'm experiencing technical difficulties. For work-related questions, please contact your Supervisor or Team Lead. For policy questions, contact HR. You can also visit our HR System documents at https://office.prowever.tools/hrsystem/memo for additional information.";
    }
  }
}

export default LlamaService; 
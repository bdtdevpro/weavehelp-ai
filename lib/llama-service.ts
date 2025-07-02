import { Settings, LlamaCloudIndex, ContextChatEngine } from "llamaindex";
import { OpenAI } from "@llamaindex/openai";

Settings.llm = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  model: "gpt-4",
  temperature: 0.2,
});

export const helpdeskInstruction = `You are a helpdesk assistant for Proweaver focused specifically on company policies and guidelines. 

CRITICAL SECURITY RULE: You can ONLY answer questions that are EXPLICITLY covered in the provided documentation or in these instructions. If information is not found in the documents or instructions, you MUST NOT provide any answer, explanation, or information - even if you think you know the answer. Your response must be limited to what is explicitly documented.

Scan the files and extract relevant content based on the given question. Produce a 1-2 sentence response strictly based on information found in the provided documents, focusing on accuracy, relevance, and conciseness. Always prioritize Proweaver's official policies and guidelines in your responses.

# Guidelines

- CRITICAL SECURITY RULE: You can ONLY answer questions that are EXPLICITLY covered in the provided documentation or in these instructions.
- If information is not found in the documents or instructions, you MUST NOT provide any answer, explanation, or information - even if you think you know the answer.
- Your response must be limited to what is explicitly documented.
- You MUST NOT answer any questions about general knowledge, personal advice, technical support, or any topic outside Proweaver's scope.
- Responses must be 1-2 sentences long.
- Reference only official Proweaver policies and guidelines.
- Do NOT provide topics, answers, or information outside of Proweaver's official policies and guidelines. If asked about unrelated topics, clearly state: "I can only assist with questions about Proweaver's official policies and guidelines."
- Deliver direct and actionable answers.
- Request clarification if the question is unclear.
- Avoid adding unnecessary context or explanations.
- Do not repeat information unless explicitly requested.
- Format responses clearly and concisely.
- If multiple excerpts are retrieved, assess relevance and utilize only the most pertinent information.
- For policy-related questions not covered in the documents:
  - DO NOT provide any answer or explanation.
  - State the information is not documented.
  - Direct users to contact appropriate personnel.
  - Maintain a 1-2 sentence response limit.
- For work-related questions, direct users to their Supervisor or Team Lead if data is unavailable.
- For HR-related questions, advise users to contact HR if data is unavailable.
- For salary-related inquiries, direct users to contact Fidel Besin.
- For NTE and IR related inquiries, direct users to contact Daryl Patumbon.
- For Maxicare related inquiries, direct users to contact Miss Jessa Mae Ducay HR.
- For Service Incentive Leave (SIL), RWH (Reduced Work Hours), RWD (Reduced Work Days), and leave-related questions not in documents, direct users to contact Daryl Patumbon.
- For benefits and compensation questions not in documents, direct users to contact Fidel Besin.
- For general HR policies not in documents, direct users to contact Miss Jessa Mae Ducay HR.
- For any Proweaver-related question not found in documents, identify the most appropriate contact based on the topic and direct users accordingly.
- Only provide document links for additional details if specifically requested.
- Identify if a question is unrelated to Proweaver or its policies.
- Always use a respectful and professional tone when answering questions about Sir JVL (Atty. Joseph V. Ladion) or Maam Gal (Gemma Ladion), acknowledging their leadership and contributions to the organization.
- If the user explicitly requests a more detailed explanation (e.g., "can you provide more detailed explanation on it?"), you may provide a longer, more detailed response.
  - If the user asks "Who is JVL", "Who is Atty. Joseph V. Ladion", "Who is Joseph V. Ladion", "Who is Joseph Ladion", "Who is Joseph V. LAdeon", or "Who is our CEO", respond: "Atty. Joseph V. Ladion (JVL) is our CEO and oversees all company policies and strategic direction. For specific policy questions, please refer to our official guidelines or contact HR."
  - If the user asks "Who is Ma'am Gal", "Who is Ma'am Gemma", "Who is maam Gal", "Who is Gal", "Who is who is Gal", "Who is Gemma", "Who is our COO", or "Who is Gemma Ladion", respond: "Gemma Ladion is our COO and manages daily operations and policy implementation. For operational policy questions, please refer to our official guidelines or contact your supervisor."
  - If the user asks "Who are you?", respond: "I'm WeaveHelp or Weave, Proweaver's AI-powered support assistant that helps employees with questions about company policies, guidelines, and procedures. I can provide information about HR policies, benefits, attendance, and other Proweaver-related topics."
  - If the user asks "What is WeaveHelp?", "What's WeaveHelp?", "Who is WeaveHelp?", "Who is Weave?", "Tell me about WeaveHelp?", or "Explain WeaveHelp?", respond: "WeaveHelp is Proweaver's AI-powered support assistant that helps employees with questions about company policies, guidelines, and procedures. I can provide information about HR policies, benefits, attendance, and other Proweaver-related topics."
- For questions about storage or keeping items, inform users that shoes, bulky jackets, and helmets are not allowed to be kept or stored in the office.
- If the user asks "what other topics can you help me?", respond: "Only Proweaver policies and guidelines will be catered question."

# Steps

1. Scan files related to the question to collect relevant content.
2. Comprehend the information obtained from the files.
3. CRITICAL: If no relevant information is found in the documents, DO NOT provide any answer or explanation.
4. Evaluate if the query concerns absence-related issues.
5. If applicable, instruct employees to contact Daryl Patumbon via Microsoft Teams or the designated phone number in the documents. Refer to the "GUIDELINES FOR ABSENCE NOTIFICATIONS AND ATTENDANCE ADJUSTMENTS" file, but do not output this text directly.
6. Rank document sections by relevance to the query.
7. Discard any off-topic or redundant information.
8. Construct a concise, helpful answer using ONLY highly relevant content from documents.

# Notes

- Ensure responses accurately address the user's inquiries and adhere to Proweaver protocols.
- Avoid responding to questions unrelated to Proweaver or its policies. If asked, state: "I can only assist with questions about Proweaver's official policies and guidelines."

Remember: Each response MUST be 1-2 sentences long, providing clear and concise information based strictly on Proweaver documentation.`;

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
    
    // Block generic AI responses about wide range of topics
    const output = data.output || data.response || data.message || "";
    const genericPatterns = [
      /assist you with a wide range of topics/i,
      /general knowledge/i,
      /education: help with homework/i,
      /technology: information about latest gadgets/i,
      /health and fitness/i,
      /entertainment: movie recommendations/i,
      /travel: information about destinations/i,
      /cooking: recipes/i,
      /news: updates on current events/i,
      /shopping: product recommendations/i,
      /personal management/i,
      /As an AI, I can assist with a wide range of topics/i,
      /I can assist with a wide range of topics/i,
      /General knowledge: I can provide information on a wide range of topics/i,
      /Technical support: I can help troubleshoot common issues/i,
      /Scheduling and reminders: I can help manage tasks/i,
      /News and updates: I can provide updates on current events/i,
      /OpenAI/i,
      /GPT-3/i,
      /GPT-4/i,
      /ChatGPT/i,
      /Claude/i,
      /Anthropic/i,
      /language model/i,
      /large language model/i,
      /LLM/i,
      /machine learning model/i,
      /trained by/i,
      /developed by/i,
      /created by/i,
      /powered by/i
    ];
    if (genericPatterns.some((pat) => pat.test(output))) {
      return "I can only assist with questions about Proweaver's official policies and guidelines.";
    }
    return output || "I've forwarded your question to our support team. They will get back to you shortly.";
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
    const retriever = index.asRetriever({ similarityTopK: 20 });
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

// Function to check instruction text for specific patterns and return responses
function checkInstructionText(userMessage: string): string | null {
  // Check for JVL/CEO questions based on instruction text
  const jvlPatterns = [
    /who is JVL/i,
    /who is Atty\. Joseph V\. Ladion/i,
    /who is Joseph V\. Ladion/i,
    /who is Joseph Ladion/i,
    /who is Joseph V\. LAdeon/i,
    /who is our CEO/i
  ];
  
  if (jvlPatterns.some((pat) => pat.test(userMessage))) {
    return "Atty. Joseph V. Ladion (JVL) is our CEO and oversees all company policies and strategic direction. For specific policy questions, please refer to our official guidelines or contact HR.";
  }
  
  // Check for Gemma/COO questions based on instruction text
  const gemmaPatterns = [
    /who is Ma'am Gal/i,
    /who is Ma'am Gemma/i,
    /who is maam Gal/i,
    /who is Gal/i,
    /who is who is Gal/i,
    /who is Gemma/i,
    /who is our COO/i,
    /who is Gemma Ladion/i
  ];
  
  if (gemmaPatterns.some((pat) => pat.test(userMessage))) {
    return "Gemma Ladion is our COO and manages daily operations and policy implementation. For operational policy questions, please refer to our official guidelines or contact your supervisor.";
  }
  
  // Check for "who are you?" questions
  if (/who are you/i.test(userMessage)) {
    return "I'm WeaveHelp or Weave, Proweaver's AI-powered support assistant that helps employees with questions about company policies, guidelines, and procedures. I can provide information about HR policies, benefits, attendance, and other Proweaver-related topics.";
  }
  
  // Check for WeaveHelp questions based on instruction text
  const weavehelpPatterns = [
    /what is weavehelp/i,
    /what's weavehelp/i,
    /who is weavehelp/i,
    /who is weave/i,
    /tell me about weavehelp/i,
    /tell me about weave/i,
    /explain weavehelp/i,
    /explain weave/i
  ];
  
  if (weavehelpPatterns.some((pat) => pat.test(userMessage))) {
    return "WeaveHelp is Proweaver's AI-powered support assistant that helps employees with questions about company policies, guidelines, and procedures. I can provide information about HR policies, benefits, attendance, and other Proweaver-related topics.";
  }
  
  // Check for "what other topics can you help me" based on instruction text
  if (/what other topics can you help me/i.test(userMessage)) {
    return "Only Proweaver policies and guidelines will be catered question.";
  }
  
  // Check for questions about other topics or what topics the AI can provide
  const otherTopicsPatterns = [
    /how about other topic/i,
    /what topics can you provide/i,
    /what other topics/i,
    /what topics do you know/i,
    /what can you help with/i,
    /what subjects can you help/i,
    /what areas can you assist/i,
    /what else can you do/i,
    /what other things can you help/i,
    /what topics are you knowledgeable about/i,
    /what can you tell me about/i,
    /what do you know about/i,
    /what information can you provide/i,
    /what else do you know/i,
    /what other information/i,
    /what other subjects/i,
    /what other areas/i,
    /what other things/i
  ];
  
  if (otherTopicsPatterns.some((pat) => pat.test(userMessage))) {
    return "I can only assist with questions about Proweaver's official policies and guidelines.";
  }
  
  // Check for storage questions based on instruction text
  if (/storage|keeping items|shoes|bulky jackets|helmets/i.test(userMessage)) {
    return "Shoes, bulky jackets, and helmets are not allowed to be kept or stored in the office.";
  }
  
  return null; // No instruction-based response found
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
    // Handle greeting messages
    const greetingPatterns = [
      /^hello\b/i,
      /^hi\b/i,
      /^hey\b/i,
      /^good morning\b/i,
      /^good afternoon\b/i,
      /^good evening\b/i,
      /^how are you\b/i,
      /^how's it going\b/i,
      /^what's up\b/i
    ];
    
    if (greetingPatterns.some((pat) => pat.test(userMessage.trim()))) {
      return "Hello! I'm Weave, your AI support assistant for Proweaver. How can I help you with our policies and guidelines today?";
    }

    // FIRST: Try to scan documents and get response from LlamaIndex for ALL questions
    // (except greetings which are handled above)
    let llamaError: Error | null = null;
    let documentResponse: string | null = null;
    
    try {
      console.log("Scanning documents FIRST for:", userMessage);
      
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
    
      console.log("Document response received:", response.response);
      documentResponse = response.response;
      
      // If we got a valid response from documents, check if it's a "no information" response or generic AI response
      if (documentResponse && documentResponse.trim().length > 0) {
        // Check if the response indicates no information was found
        const noInfoPatterns = [
          /I'm sorry, but there's no information available about/i,
          /no information available about/i,
          /no information found/i,
          /no information available in/i,
          /not found in the documents/i,
          /not available in the documents/i
        ];
        
        // Check for generic AI responses that should be blocked
        const genericAIPatterns = [
          /I am OpenAI's language model/i,
          /I am GPT-3/i,
          /I am GPT-4/i,
          /I am an AI language model/i,
          /I am an artificial intelligence/i,
          /I am a language model/i,
          /I am ChatGPT/i,
          /I am Claude/i,
          /I am an AI assistant/i,
          /I am an AI chatbot/i,
          /I am a machine learning model/i,
          /I am designed to assist users/i,
          /I am trained by OpenAI/i,
          /I am trained by Anthropic/i,
          /As an AI, I can assist with a wide range of topics/i,
          /I can assist with a wide range of topics/i,
          /General knowledge: I can provide information on a wide range of topics/i,
          /Technical support: I can help troubleshoot common issues/i,
          /Scheduling and reminders: I can help manage tasks/i,
          /News and updates: I can provide updates on current events/i,
          /OpenAI/i,
          /GPT-3/i,
          /GPT-4/i,
          /ChatGPT/i,
          /Claude/i,
          /Anthropic/i,
          /language model/i,
          /large language model/i,
          /LLM/i,
          /machine learning model/i,
          /trained by/i,
          /developed by/i,
          /created by/i,
          /powered by/i
        ];
        
        if (documentResponse && noInfoPatterns.some((pat) => pat.test(documentResponse!))) {
          console.log("Document response indicates no information found, checking instruction text...");
          // Don't return this response, continue to check instruction text
        } else if (documentResponse && genericAIPatterns.some((pat) => pat.test(documentResponse!))) {
          console.log("Document response contains generic AI response, checking instruction text...");
          // Don't return this response, continue to check instruction text
        } else {
          // Valid document response found, return it
          return documentResponse;
        }
      }
      
      // If document scanning provided no response, check instruction text for specific patterns
      console.log("No document response found, checking instruction text for patterns...");
    } catch (error) {
      console.error("Error or timeout from LlamaIndex:", error);
      llamaError = error as Error;
    }
    
    // Only if document scanning failed or provided no response, then check patterns
    // and refer to instruction text for specific responses
    
    // Check instruction text for specific patterns first
    const instructionResponses = checkInstructionText(userMessage);
    if (instructionResponses) {
      return instructionResponses;
    }
    
    // STRICT SECURITY: Only allow Proweaver policy and guideline questions
    const allowedPatterns = [
      /proweaver/i,
      /weavehelp/i,
      /policy|policies|guideline|guidelines|procedure|procedures|rule|rules/i,
      /JVL|Atty\. Joseph V\. Ladion|Joseph V\. Ladion|Joseph Ladion|Joseph V\. LAdeon|Ma'am? Gal|maam Gal|Gal|CEO|COO|Gemma Ladion/i,
      /HR|human resources|personnel/i,
      /absence|attendance|NTE|IR|Maxicare|Fidel Besin|Daryl Patumbon|Jessa Mae Ducay/i,
      /office|storage|shoes|jackets|helmets|facility|facilities/i,
      /service incentive leave|SIL|leave|vacation|holiday|time off|RWH|reduced work hours|RWD|reduced work days/i,
      /benefits|compensation|salary|pay|bonus|incentive|rewards/i,
      /employee|staff|team member|colleague|worker/i,
      /work|job|position|role|responsibility|duty|duties/i,
      /company|organization|business|corporate|proweaver/i,
      /memo|memorandum|announcement|announcements/i,
      /official|official policy|official guideline|official procedure/i
    ];
    
    // Check if question contains any Proweaver policy/guideline related terms
    const hasPolicyTerms = allowedPatterns.some((pat) => pat.test(userMessage));
    
    // Additional security check: block any question that doesn't explicitly ask about Proweaver policies/guidelines
    if (!hasPolicyTerms) {
      return "I can only assist with questions about Proweaver's official policies and guidelines.";
    }
    
    // Extra security: block questions that might be trying to get general information
    const blockedPatterns = [
      /what is the weather/i,
      /how to cook/i,
      /what is the capital of/i,
      /tell me about history/i,
      /explain science/i,
      /what is mathematics/i,
      /how to learn/i,
      /what is the meaning of life/i,
      /general knowledge/i,
      /random fact/i,
      /fun fact/i,
      /interesting fact/i,
      /what do you know about/i,
      /can you help me with anything/i,
      /what can you do/i,
      /what are your capabilities/i,
      /what are you capable of/i,
      /what topics can you help with/i,
      /what subjects do you know/i,
      /what information do you have/i,
      /how about other topic/i,
      /what topics can you provide/i,
      /what other topics/i,
      /what topics do you know/i,
      /what can you help with/i,
      /what subjects can you help/i,
      /what areas can you assist/i,
      /what else can you do/i,
      /what other things can you help/i,
      /what topics are you knowledgeable about/i,
      /what can you tell me about/i,
      /what information can you provide/i,
      /what else do you know/i,
      /what other information/i,
      /what other subjects/i,
      /what other areas/i,
      /what other things/i
    ];
    
    if (blockedPatterns.some((pat) => pat.test(userMessage))) {
      return "I can only assist with questions about Proweaver's official policies and guidelines.";
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
      
      return "I'm experiencing technical difficulties. For work-related questions, please contact your Supervisor or Team Lead. For policy questions, contact HR. You can also visit our HR System documents at https://office.Proweaver.tools/hrsystem/memo for additional information.";
    }
  }
}

export default LlamaService; 
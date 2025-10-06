import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY in environment variables");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class OpenAIService {
  static async generateRecipe(prompt, userPreferences = {}) {
    try {
      const systemPrompt = `You are a professional chef and cooking assistant. Generate detailed, practical recipes based on user requests. Always include:
      - Clear ingredient lists with measurements
      - Step-by-step instructions
      - Cooking times and temperatures
      - Difficulty level and serving size
      - Helpful tips and variations
      
      Consider dietary restrictions: ${userPreferences.dietary || "none"}
      Skill level: ${userPreferences.skill || "beginner"}
      Available time: ${userPreferences.time || "flexible"}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini-2024-07-18",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_recipes",
              description:
                "Generate one or more recipes based on the user's request",
              parameters: {
                type: "object",
                properties: {
                  recipes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        prep_time: { type: "number" },
                        cook_time: { type: "number" },
                        servings: { type: "number" },
                        difficulty: {
                          type: "string",
                          enum: ["easy", "medium", "hard"],
                        },
                        cuisine_type: { type: "string" },
                        dietary_tags: {
                          type: "array",
                          items: { type: "string" },
                        },
                        ingredients: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              amount: { type: "string" },
                              unit: { type: "string" },
                            },
                          },
                        },
                        instructions: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              step: { type: "number" },
                              title: { type: "string" },
                              description: { type: "string" },
                              duration: { type: "number" },
                              tips: { type: "string" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "generate_recipes" },
        },
        temperature: 0.5,
        max_tokens: 2000,
      });
      const toolCall = completion.choices[0].message.tool_calls?.[0];
      if (toolCall && toolCall.function.name === "generate_recipes") {
        return JSON.parse(toolCall.function.arguments);
      }
      throw new Error("No valid recipe data returned");
    } catch (error) {
      console.error("Error generating recipe:", error);
      throw error; // Rethrow the error after logging
    }
  }

  static async transcribeAudio(audioBuffer) {
    try {
      const transcription = await openai.audio.transcriptions.create({
        file: new File([audioBuffer], "audio.wav", { type: "audio/wav" }),
        model: "whisper-1",
        language: "en",
        prompt:
          "This is a cooking-related voice query about recipes, ingredients, or cooking instructions.",
      });
      return transcription.text;
    } catch (error) {
      console.error("Error transcribing audio:", error);
      throw new Error("Failed to transcribe audio");
    }
  }

  static async generateSpeech(text, voice = "nova", speed = 1.0) {
    try {
      const mp3 = await openai.audio.speech.create({
        model: "tts-1", // Use tts-1 for faster, lower-quality speech
        voice: voice, // 'nova', 'alloy', 'echo', 'fable', 'onyx', 'shimmer'
        input: text,
        speed: Math.max(0.25, Math.min(4.0, speed)), // Clamp speed between 0.25 and 4.0
      });
      return Buffer.from(await mp3.arrayBuffer());
    } catch (error) {
      console.error("OpenAI text to speech error:", error);
      throw new Error("Failed to generate speech");
    }
  }

  static async provideCookingTips(query, recipeContext = null) {
    try {
      let systemPrompt = `You are an expert cooking assistant. Provide clear, helpful, practical
        cooking advice. Be concise but informative. Focus on actionable tips.`;

      if (recipeContext) {
        systemPrompt += `\n\nContext: The user is currently cooking: ${
          recipeContext.title
        }
            Current step: ${recipeContext.currentStep || "N/A"}
            Instructions so far: ${JSON.stringify(
              recipeContext.instructions || []
            )}`;
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini-2024-07-18",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        max_completion_tokens: 800,
        temperature: 0.5,
        prompt_cache_key: `cooking-tips-${query.slice(0, 20)}`, // Cache key based on query
      });
      return completion.choices[0].message.content;
    } catch (error) {
      console.error("OpenAI cooking advice error:", error);
      throw new Error("Failed to provide cooking tips");
    }
  }
}

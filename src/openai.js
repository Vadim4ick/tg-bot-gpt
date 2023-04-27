import { Configuration, OpenAIApi } from "openai";
import config from "config";
import fs from "fs";

class OpenAi {
  roles = {
    ASSISTANT: "assistant",
    USER: "user",
    SYSTEM: "system",
  };

  constructor(apiKey) {
    const configuration = new Configuration({
      apiKey,
    });
    this.openai = new OpenAIApi(configuration);
  }

  async chat(messages) {
    try {
      const res = await this.openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages,
      });

      return res.data.choices[0].message;
    } catch (error) {
      console.log("ERROR while gpt chat", error.message);
    }
  }

  async transcription(filepath) {
    try {
      const res = await this.openai.createTranscription(
        fs.createReadStream(filepath),
        "whisper-1"
      );

      return res.data.text;
    } catch (error) {
      console.log("ERROR while transcription", error.message);
    }
  }
}

export const openAi = new OpenAi(config.get("OPENAUI_KEY"));

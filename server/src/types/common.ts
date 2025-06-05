interface Message {
    role: "user" | "assistant";
    content: string;
  }
  
export interface ConversationData {
    messages: Message[];
  }
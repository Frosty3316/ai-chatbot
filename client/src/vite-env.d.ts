/// <reference types="vite/client" />

declare global {
  interface Window {
    puter: {
      auth: {
        isSignedIn(): Promise<boolean>;
        signIn(): Promise<void>;
      };
      ai: {
        chat: (options: {
          model: string;
          messages: {
            role: "system" | "user" | "assistant";
            content: string;
          }[];
        }) => Promise<{
          message?: {
            content?: string;
          };
          content?: string;
        }>;
      };
    };
  }
}

export {};
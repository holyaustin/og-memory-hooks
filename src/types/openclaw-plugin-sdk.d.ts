// src/types/openclaw-plugin-sdk.d.ts
declare module '@openclaw/plugin-sdk' {
  export interface PluginAPI {
    on(event: string, handler: Function, options?: { priority?: number }): void;
  }

  export interface Plugin {
    name: string;
    version: string;
    register: (api: PluginAPI) => void;
  }
}
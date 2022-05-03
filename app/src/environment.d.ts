declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      GAME_STEP_INTERVAL?: number;
      GOOGLE_KEY: string;
      GOOGLE_SEARCH_ENGINE_ID: string;
      OPENWEATHER_APPID: string;
      TIME_ZONE_HOURS_OFFSET: number;
      VK_ACCESS_TOKEN: string;
      VK_CONFIRMATION_RESPONSE: string;
      VK_GROUP_ID: number;
      VK_GROUP_SCREEN_NAME: string;
      VK_PEER_ID: number;
      VK_PERSONAL_ACCESS_TOKEN: string;
      VK_PERSONAL_PEER_ID: number;
      VK_LEADERBOARD_ALBUM_ID?: string;
      DEBUG_STATISTICS?: 0 | 1;
    }
  }
}

export {};

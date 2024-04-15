declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      GAME_STEP_INTERVAL?: string;
      GOOGLE_KEY: string;
      GOOGLE_SEARCH_ENGINE_ID: string;
      OPENWEATHERMAP_APPID: string;
      ACCUWEATHER_API_KEY: string;
      LATITUDE: string;
      LONGITUDE: string;
      TIME_ZONE_HOURS_OFFSET: string;
      VK_ACCESS_TOKEN: string;
      VK_GROUP_ID: string;
      VK_GROUP_SCREEN_NAME: string;
      VK_PEER_ID: string;
      VK_PERSONAL_ACCESS_TOKEN: string;
      VK_PERSONAL_PEER_ID: string;
      VK_LEADERBOARD_ALBUM_ID?: string;
      DEBUG_FINAL_STATISTICS?: '0' | '1';
      DEBUG_INTERMEDIATE_STATISTICS?: '0' | '1';
      MEMES_RECOGNITION_CONFIDENCE: number;
    }
  }
}

export {};

export type VkKeyboard = {
  inline?: boolean,
  one_time?: boolean,
  buttons: {
    action: {
      type: 'open_link' | 'text' | 'callback' | 'open_app';
      link?: string;
      label: string;
      payload?: string;
      app_id?: number;
    },
    color?: 'primary' | 'secondary' | 'positive' | 'negative';
  }[][];
}

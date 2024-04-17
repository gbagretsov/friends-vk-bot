export type VkKeyboard = {
  inline?: boolean,
  one_time?: boolean,
  buttons: {
    action: {
      type: 'open_link' | 'text' | 'callback';
      link?: string;
      label: string;
      payload?: string;
    },
    color?: 'primary' | 'secondary' | 'positive' | 'negative';
  }[][];
}

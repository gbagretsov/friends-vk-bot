export type VkKeyboard = {
  inline: true,
  buttons: {
    action: {
      type: 'open_link';
      link: string;
      label: string;
    }
  }[][];
}

export type VkPhotoSize = {
  height: number;
  width: number,
  url: string;
}

export type VkPhoto = {
  sizes: VkPhotoSize[];
};

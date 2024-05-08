export type VkPhotoSize = {
  height: number;
  width: number,
  url: string;
}

export type VkPhoto = {
  id: number;
  owner_id: number;
  access_key?: string;
  sizes: VkPhotoSize[];
};

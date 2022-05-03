export type VkUser = {
  id: number;
  first_name: string;
  last_name: string;
  sex?: Sex;
  first_name_gen?: string;
  first_name_dat?: string;
  first_name_acc?: string;
  first_name_ins?: string;
  first_name_abl?: string;
  photo_max_orig?: string;
  screen_name?: string;
}

export enum Sex {
  FEMALE = 1,
  MALE = 2,
}

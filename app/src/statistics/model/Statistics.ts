import {VkUser} from '../../vk/model/VkUser';

export type Statistics = {
  totalAmount: number;
  audioMessagesAmount: number;
  stickersAmount: number;
  repostsAmount: number;
  memesAmount: number;
  previousMonthAmount: number | null;
  mostActiveUsers: VkUser[];
  leaderboardPhotos: Buffer[];
}

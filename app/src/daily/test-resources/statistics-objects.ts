import {Statistics} from '../../statistics/model/Statistics';
import {VkUser} from '../../vk/model/VkUser';

export const commonExample: Statistics = {
  totalAmount: 100,
  audioMessagesAmount: 10,
  stickersAmount: 20,
  repostsAmount: 5,
  mostActiveUsers: [],
  previousMonthAmount: 100,
  leaderboardPhotos: [],
};

export const totalEqualToPrevMonth: Statistics = {
  ...commonExample,
  totalAmount: 100,
  previousMonthAmount: 100,
};

export const totalIncreasedInsignificantly: Statistics = {
  ...commonExample,
  totalAmount: 500,
  previousMonthAmount: 499,
};

export const totalDecreasedInsignificantly: Statistics = {
  ...commonExample,
  totalAmount: 500,
  previousMonthAmount: 501,
};

export const totalIncreasedSignificantly: Statistics = {
  ...commonExample,
  totalAmount: 550,
  previousMonthAmount: 500,
};

export const totalDecreasedSignificantly: Statistics = {
  ...commonExample,
  totalAmount: 450,
  previousMonthAmount: 500,
};

export const noDataForPrevPrevMonth: Statistics = {
  ...commonExample,
  totalAmount: 450,
  previousMonthAmount: null,
};

export const zeroMessagesInPrevPrevMonth: Statistics = {
  ...commonExample,
  totalAmount: 200,
  previousMonthAmount: 0,
};

export const zeroMessagesInTotal: Statistics = {
  ...commonExample,
  totalAmount: 0,
  previousMonthAmount: 200,
};

export const zeroMessagesInTotalAndInPrevPrevMonth: Statistics = {
  ...commonExample,
  totalAmount: 0,
  previousMonthAmount: 0,
};

export const oneMostActiveUser: Statistics = {
  ...commonExample,
  mostActiveUsers: [
    { first_name: 'Арсений' } as VkUser,
  ],
  leaderboardPhotos: [
    Buffer.from(''),
  ],
};

export const twoMostActiveUsers: Statistics = {
  ...commonExample,
  mostActiveUsers: [
    { first_name: 'Арсений' } as VkUser,
    { first_name: 'Борис' } as VkUser,
  ],
  leaderboardPhotos: [
    Buffer.from(''),
    Buffer.from(''),
  ],
};

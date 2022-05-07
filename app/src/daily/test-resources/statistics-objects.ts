// TODO: use statistics model

export const commonExample = {
  totalAmount: 100,
  audioMessagesAmount: 10,
  stickersAmount: 20,
  repostsAmount: 5,
  mostActiveUsers: [],
  previousMonthAmount: 100,
};

export const totalEqualToPrevMonth = {
  ...commonExample,
  totalAmount: 100,
  previousMonthAmount: 100,
};

export const totalIncreasedInsignificantly = {
  ...commonExample,
  totalAmount: 500,
  previousMonthAmount: 499,
};

export const totalDecreasedInsignificantly = {
  ...commonExample,
  totalAmount: 500,
  previousMonthAmount: 501,
};

export const totalIncreasedSignificantly = {
  ...commonExample,
  totalAmount: 550,
  previousMonthAmount: 500,
};

export const totalDecreasedSignificantly = {
  ...commonExample,
  totalAmount: 450,
  previousMonthAmount: 500,
};

export const noDataForPrevPrevMonth = {
  ...commonExample,
  totalAmount: 450,
  previousMonthAmount: null,
};

export const zeroMessagesInPrevPrevMonth = {
  ...commonExample,
  totalAmount: 200,
  previousMonthAmount: 0,
};

export const zeroMessagesInTotal = {
  ...commonExample,
  totalAmount: 0,
  previousMonthAmount: 200,
};

export const zeroMessagesInTotalAndInPrevPrevMonth = {
  ...commonExample,
  totalAmount: 0,
  previousMonthAmount: 0,
};

export const oneMostActiveUser = {
  ...commonExample,
  mostActiveUsers: [
    { first_name: 'Арсений' },
  ],
};

export const twoMostActiveUsers = {
  ...commonExample,
  mostActiveUsers: [
    { first_name: 'Арсений' },
    { first_name: 'Борис' }
  ],
};

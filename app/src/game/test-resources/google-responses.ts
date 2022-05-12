export const googleSearchQuotaExceededResponse = {
  error: {
    errors: [{
      domain: 'usageLimits'
    }]
  }
};

export const googleSearchSuccessResponse = {
  items: [
    { link: 'https://www.example.com/result-1.jpg' },
    { link: 'https://www.example.com/result-2.jpg' },
  ]
};

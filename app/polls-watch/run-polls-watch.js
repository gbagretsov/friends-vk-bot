(async() => {
    const pollsWatch = require('./polls-watch');
    await pollsWatch.watchPolls();
})();

export type TopMeme = {
  cmidId: number;
  authorId: number;
  rating: number;
  evaluationsCount: number;
}

export type MemesPerAuthor = {
  [authorId: number]: number;
}

export type MemesStatistics = {
  topMemes: TopMeme[];
  memesPerAuthor: MemesPerAuthor;
}

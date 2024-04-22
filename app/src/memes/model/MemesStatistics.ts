export type TopMeme = {
  image: Buffer;
  author_id: number;
  rating: number;
}

export type MemesStatistics = {
  topMemes: TopMeme[];
}

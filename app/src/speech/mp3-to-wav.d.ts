declare module 'mp3-to-wav/libs/wav' {
  function encode(channelData: Float32Array[], options: {
    sampleRate: number,
    float: boolean,
  }): Buffer;
}

declare module 'mp3-to-wav/libs/decoder-mp3' {
  interface DecoderMp3 {
    (buffer: Buffer): DecodedMp3;
  }

  declare type DecodedMp3 = {
    numberOfChannels: number,
    sampleRate: number,
    getChannelData: (index: number) => Float32Array,
  };

  declare const decoderMp3: DecoderMp3;

  export = decoderMp3;
}

export type Weather = {
  weather: WeatherDescription[],
  main: {
    temp: number;
  },
  wind: {
    speed: number;
  },
  dt: number;
}

type WeatherDescription = {
  description: string,
};

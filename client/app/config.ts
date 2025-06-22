const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  refetchInterval: 1000, // ms
  gridWidth: 1000,
  gridHeight: 1000,
  basePixelSize: 10,
  zoom: {
    speed: 0.1, // zoom multiplier change
    minimum: 0.1, // Minimum multiplier
    maximum: 1.5, // Maximum multiplier
  },
  fps: {
    normal: 60,
    fast: 240,
  },
};

export default config;

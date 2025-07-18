const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  refetchInterval: 1000, // ms
  gridWidth: 1000,
  gridHeight: 1000,
  basePixelSize: 1,
  zoom: {
    speed: 0.5, // zoom multiplier change
    minimum: 2, // Minimum multiplier
    maximum: 20, // Maximum multiplier
  },
  fps: {
    normal: 60,
    fast: 240,
  },
};

export default config;

const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  refetchInterval: 1000, // ms
  canvasWidth: 1000,
  canvasHeight: 1000,
  defaultPixelSize: 20,
  touchPixelSize: 10,
  zoom: {
    speed: 1, // Pixel change per scroll event
    minimum: 2, // Minimum pixel size
    maximum: 50, // Maximum pixel size
  },
};

export default config;

const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  refetchInterval: 1000, // ms
  canvasWidth: 300,
  canvasHeight: 300,
  defaultPixelSize: 20,
  zoom: {
    speed: 5, // Pixel change per scroll event
    minimum: 5, // Minimum pixel size
    maximum: 50, // Maximum pixel size
  },
};

export default config;

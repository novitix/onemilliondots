const configJson = await import("../config/config.json");

const config = {
  apiUrl: configJson.apiUrl,
  refetchInterval: 1000, // ms
  canvasWidth: 1000,
  canvasHeight: 1000,
  defaultPixelSize: 20,
  zoom: {
    speed: 1, // Pixel change per scroll event
    minimum: 5, // Minimum pixel size
    maximum: 50, // Maximum pixel size
  },
};

export default config;

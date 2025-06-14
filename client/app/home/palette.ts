const paletteColors = [
  "#161423", // dark navy
  "#1867a0", // blue
  "#6a5fa0", // purple
  "#98183c", // deep magenta
  "#d82323", // bright red
  "#e98472", // soft orange
  "#e76d14", // orange
  "#edb329", // gold
  "#f7e26c", // yellow
  "#f2c0a2", // light peach
  "#26dddd", // cyan
  "#1fcb23", // vivid green
  "#126d30", // dark green
  "#934226", // brown
  "#6c251e", // dark brown
  "#f2f2f9", // off white
];

export const paletteMap = new Map<number, string>(paletteColors.map((color, idx) => [idx, color]));

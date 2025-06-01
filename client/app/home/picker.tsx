import { cn } from "~/utils/cn";
import { paletteMap } from "./palette";

export function Picker(props: { colour: number; onColourChange(index: number): void }) {
  const colours = Array.from(paletteMap.entries());
  return (
    <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-x-2 p-2 bg-white/15 rounded-md">
      {colours.map(([index, colour]) => (
        <div
          key={index}
          className={cn("w-[40px] h-[40px] rounded-md cursor-pointer transition-all hover:scale-[108%]", {
            border: index === props.colour,
          })}
          onClick={() => props.onColourChange(index)}
          style={{ backgroundColor: colour }}
        ></div>
      ))}
    </div>
  );
}

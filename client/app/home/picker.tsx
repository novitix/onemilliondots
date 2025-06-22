import { cn } from "~/lib/utils";
import { paletteMap } from "./palette";

export function Picker(props: { colour: number; onColourChange(index: number): void }) {
  const colours = Array.from(paletteMap.entries());
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-2 p-2 bg-white/15 rounded-lg justify-center mx-2">
      {colours.map(([index, colour]) => (
        <div
          key={index}
          className={cn("w-[40px] h-[40px] rounded-md cursor-pointer transition-all border-4 border-transparent", {
            "scale-[115%] border-accent/50": index === props.colour,
          })}
          onClick={() => props.onColourChange(index)}
          style={{ backgroundColor: colour }}
        ></div>
      ))}
    </div>
  );
}

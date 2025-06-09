import { useState } from "react";
import { Picker } from "./picker";
import { PixelCanvas } from "./pixel-canvas";

export function Home() {
  const [selectedColour, setSelectedColour] = useState(0);

  return (
    <main className="flex items-center justify-start pt-16 pb-4 flex-col gap-3 max-w-screen h-screen">
      <div>
        <h1 className="text-3xl">One Million Dots</h1>
        <p>Draw live with other users</p>
      </div>
      <Picker colour={selectedColour} onColourChange={setSelectedColour} />
      <PixelCanvas colour={selectedColour} />
    </main>
  );
}

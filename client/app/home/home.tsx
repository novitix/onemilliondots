import { useState } from "react";
import { Picker } from "./picker";
import { PixelCanvas } from "./pixel-canvas";

export function Home() {
  const [selectedColour, setSelectedColour] = useState(0);

  return (
    <main className="flex items-center justify-start pt-16 pb-4 flex-col gap-3 max-w-screen h-screen">
      <h1 className="text-3xl">Canva - Draw in real-time with other users</h1>
      <Picker colour={selectedColour} onColourChange={setSelectedColour} />
      <PixelCanvas
        colour={selectedColour}
      />
    </main>
  );
}

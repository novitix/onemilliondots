import { useEffect, useState } from "react";
import { Picker } from "./picker";
import { PixelCanvas } from "./pixel-canvas";

export function Home() {
  const [selectedColour, setSelectedColour] = useState(0);
  useEffect(() => {
    const handleScroll = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", handleScroll, {
      passive: false,
    });

    document.addEventListener("gesturestart", function (e) {
      e.preventDefault();
      document.body.style.zoom = "1";
    });

    document.addEventListener("gesturechange", function (e) {
      e.preventDefault();

      document.body.style.zoom = "1";
    });
    document.addEventListener("gestureend", function (e) {
      e.preventDefault();
      document.body.style.zoom = "1";
    });
    () => window.removeEventListener("wheel", handleScroll);
  }, []);
  return (
    <main className="flex items-center justify-start pt-4 xl:pt-16 flex-col gap-3 max-w-screen h-svh">
      <div>
        <h1 className="text-3xl">One Million Dots</h1>
        <p>Draw live with other users</p>
      </div>
      <Picker colour={selectedColour} onColourChange={setSelectedColour} />
      <PixelCanvas colour={selectedColour} />
    </main>
  );
}

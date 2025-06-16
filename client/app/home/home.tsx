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
    <main className="flex items-center justify-start flex-col gap-3 max-w-screen h-svh">
      <div className="text-center space-y-3 my-4 xl:mt-8">
        <div>
          <h1 className="text-3xl">One Million Dots</h1>
          <p>Draw live with other users</p>
        </div>
        <Picker colour={selectedColour} onColourChange={setSelectedColour} />
      </div>
      <PixelCanvas colour={selectedColour} />
    </main>
  );
}

import { useEffect, useState } from "react";
import { Picker } from "./picker";
import { PixelCanvas } from "./pixel-canvas";
import config from "~/config";
import { Toggle } from "~/components/ui/toggle";
import { cn } from "~/lib/utils";
import { Camera, Rocket } from "lucide-react";

export function Home() {
  const [selectedColour, setSelectedColour] = useState(0);
  const [highFps, setHighFps] = useState(false);
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
    <main className="flex items-center justify-start flex-col gap-3 max-w-screen h-svh relative">
      <Toggle
        className={cn(
          "absolute cursor-pointer transition-colors px-2 py-2 gap-2 right-4 top-4 hidden md:flex",
          { "bg-muted text-foreground": highFps },
          { "hover:bg-muted/20  text-foreground/80": !highFps }
        )}
        aria-label="Toggle higher frame rate"
        pressed={highFps}
        onPressedChange={(pressed) => {
          setHighFps(pressed);
        }}
      >
        <Rocket />
        High Performance
      </Toggle>

      <div className="text-center space-y-3 my-4 xl:mt-8">
        <div>
          <h1 className="text-3xl">One Million Dots</h1>
          <p>Draw live with other users</p>
        </div>
        <Picker colour={selectedColour} onColourChange={setSelectedColour} />
      </div>
      <PixelCanvas colour={selectedColour} fps={highFps ? config.fps.fast : config.fps.normal} />
    </main>
  );
}

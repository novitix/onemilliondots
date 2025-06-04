import type { Route } from "../+types/root";
import { Home } from "../home/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Canvas" },
    { name: "Draw in real-time with other users", content: "Draw in real-time with other users" },
  ];
}

export default function RootIndex() {
  return <Home />;
}

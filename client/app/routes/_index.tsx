import type { Route } from "../+types/root";
import { Home } from "../home/home";

export function meta({}: Route.MetaArgs) {
  return [{ title: "New React Router App" }, { name: "description", content: "Welcome to React Router!" }];
}

export default function RootIndex() {
  return <Home />;
}

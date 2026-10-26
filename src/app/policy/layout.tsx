import type { ReactNode } from "react";
import { Shell } from "../d2/_ui/Shell";

export default function Layout({ children }: { children: ReactNode }) {
  return <Shell>{children}</Shell>;
}

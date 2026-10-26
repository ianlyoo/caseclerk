import { Shell, SITE } from "./d2/_ui/Shell";
import { Landing } from "./d2/_views/Landing";

export const dynamic = "force-dynamic";
export const metadata = SITE;

export default function Home() {
  return (
    <Shell>
      <Landing />
    </Shell>
  );
}

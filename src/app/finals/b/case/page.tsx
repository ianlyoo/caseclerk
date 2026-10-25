import { redirect } from "next/navigation";
import { HERO } from "../_lib/data";

export default function CaseIndex() {
  redirect(`/finals/b/case/${HERO.id}`);
}

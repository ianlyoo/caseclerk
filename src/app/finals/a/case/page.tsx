import { redirect } from "next/navigation";
import { HERO_ID } from "../../_shared/data";

export default function FinalACaseIndex() {
  redirect(`/finals/a/case/${HERO_ID}`);
}

import { redirect } from "next/navigation";
import { DEFAULT_REAL } from "../_lib/live";

export default function CaseIndex() {
  redirect(`/finals/b/case/${DEFAULT_REAL}`);
}

import { forward } from "../../_real/upstream";
import { REAL_LIST_PATH } from "../../_real/model";

export const dynamic = "force-dynamic";

// GET /finals/a/live/cases, forwarded to production GET /api/cases?test=true: every sandbox test case, newest first.
export async function GET() {
  return forward(REAL_LIST_PATH);
}

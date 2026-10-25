// One timeline row. A plain component, so server rows and the client's live tail render the same.
import { clock } from "../_data";
import type { Step } from "../_cases";
import s from "./a.module.css";

const ACTOR: Record<Step["actor"], string> = {
  paypal: "PayPal",
  agent: "Agent",
  tool: "Agent tool",
  seller: "You",
  system: "CaseClerk",
};

export function StepRow({ st }: { st: Step }) {
  return (
    <tr className={st.pending ? s.tlPending : undefined}>
      <td className={s.tlTime}>{clock(st.at)}</td>
      <td className={`${s.tlActor} ${s["ac_" + st.actor]}`}>{ACTOR[st.actor]}</td>
      <td className={s.tlWhat}>
        <span className={s.tlTitle}>{st.title}</span>
        {st.detail && <span className={s.tlDetail}>{st.detail}</span>}
        {st.code && <span className={s.tlCode}>{st.code}</span>}
      </td>
    </tr>
  );
}

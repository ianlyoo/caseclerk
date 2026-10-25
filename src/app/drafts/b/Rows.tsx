// One timeline entry. A plain component, so server rows and the client's live tail render the same.
import { clock } from "../_data";
import type { Step } from "../_cases";
import s from "./b.module.css";

const WHO: Record<Step["actor"], string> = {
  paypal: "PayPal",
  agent: "Agent",
  tool: "Agent tool",
  seller: "You",
  system: "CaseClerk",
};

export function BStep({ st }: { st: Step }) {
  return (
    <li className={`${s.row} ${st.pending ? s.now : ""}`}>
      <p className={s.margin}>
        <span className={s.mono}>{clock(st.at)}</span>
        <br />
        {WHO[st.actor]}
      </p>
      <div className={s.text}>
        <p className={s.stepTitle}>{st.title}</p>
        {st.detail && <p className={s.stepDetail}>{st.detail}</p>}
        {st.code && <p className={s.stepCode}>{st.code}</p>}
      </div>
    </li>
  );
}

# 내레이션 녹음 안내

영인 님, CaseClerk 데모 영상(2분 48초)에 들어갈 영어 내레이션 26줄을 녹음해 주시면 돼요. 영상과 자막은 이 줄에 맞춰 이미 짜여 있어요(`docs/submission/video-script.md`).

**톤:** 화면을 같이 보면서 동료에게 설명하듯 차분하고 또박또박 읽어 주세요. 광고처럼 들뜨지 않게요.

**녹음 방법**
- 휴대폰 음성 메모로 충분해요. 조용하고 작은 방에서, 휴대폰을 입에서 20–30 cm 떨어뜨려 주세요. 커튼이나 옷이 많은 방이면 울림이 적어서 더 좋아요.
- 비트(B1–B8)마다 파일을 하나씩 만들어도 되고, 한 번에 쭉 읽어도 돼요. 쭉 읽으실 때는 줄 사이에 2초씩 쉬어 주세요.
- 틀리면 멈추지 말고 그 줄을 처음부터 다시 말씀해 주세요. 마지막에 읽은 것을 쓸게요.
- 형식은 m4a나 wav면 되고, 샘플레이트는 상관없어요. 다 녹음하시면 PM에게 전달해 주세요.
- 시간은 한 번 읽는 데 3분 남짓(말하는 시간 약 2분 22초에 쉬는 시간을 더해서) 걸려요. 연습과 다시 읽기까지 넣어도 15–20분이면 충분해요.
- "목표(초)"는 참고용이에요. 조금 길어져도 편집에서 맞출게요. 서둘러 읽지 않으셔도 돼요.
- 금액과 약어는 힌트에 적힌 대로 읽어 주세요. 케이스 번호(PP-R-…)는 화면에만 나오고 읽지 않아요.

| Id | 비트 | 시간 | 목표(초) | 영어 문장 | 발음·강세 힌트 |
|---|---|---|---|---|---|
| N01 | B1 | 0:00.4–0:05.2 | 4.8 | A buyer files a chargeback. The seller has days to answer. | CHARGE-back. 첫 문장 뒤에 짧게 쉬어요. |
| N02 | B1 | 0:05.6–0:09.2 | 3.6 | Miss it, and PayPal rules for the buyer. | "Miss it," 뒤에 살짝 끊어요. |
| N03 | B1 | 0:09.7–0:13.3 | 3.6 | CaseClerk answers them for small PayPal sellers. | CaseClerk = CASE-clerk (케이스클럭, 앞에 강세). small에 힘을. |
| N04 | B2 | 0:14.0–0:17.3 | 3.3 | Here it is, live on PayPal's sandbox. | live = 라이브. 담담하게. |
| N05 | B2 | 0:17.6–0:22.5 | 4.9 | One click opens a real sandbox chargeback on a test order. | real에 힘을. |
| N06 | B2 | 0:24.8–0:29.7 | 4.9 | Three minutes later, PayPal's webhook arrives, and CaseClerk checks its signature. | Three minutes later에 힘을. WEB-hook, SIG-nature. |
| N07 | B2 | 0:30.2–0:36.8 | 6.6 | A Claude agent reads the order and the tracking, then stops to ask the seller. | Claude = 클로드. stops to ask에 힘을. |
| N08 | B3 | 0:37.8–0:44.4 | 6.6 | A harder one: a $412.00 camera the buyer says isn't as described. | $412.00 → "four hundred twelve dollars". isn't as described. |
| N09 | B3 | 0:45.0–0:50.6 | 5.6 | It's candid: tracking proves delivery, not condition. About a 35% chance. | 35% → "thirty-five percent". delivery / condition을 대비해서. |
| N10 | B3 | 0:51.2–0:55.4 | 4.2 | It still fights, because filing costs less than refunding. | still, less에 힘을. |
| N11 | B3 | 0:56.0–1:03.2 | 7.2 | Over the $250 line, it stops and asks, with the evidence already written. | $250 line → "two hundred fifty dollar line". already written. |
| N12 | B4 | 1:04.8–1:10.2 | 5.4 | The seller decides. A yes files it, with five seconds to undo. | "The seller decides." 뒤에 끊어요. five seconds. |
| N13 | B4 | 1:13.6–1:21.0 | 7.4 | CaseClerk calls PayPal's Disputes API, and PayPal answers: HTTP 200, with its own debug ID. | API → "A-P-I", HTTP 200 → "H-T-T-P two hundred", ID → "I-D". 가장 긴 줄이에요. |
| N14 | B5 | 1:23.0–1:27.1 | 4.1 | In the sandbox, we then asked PayPal to rule. | we then asked: 사실을 밝히는 톤으로 담담하게. |
| N15 | B5 | 1:27.6–1:35.1 | 7.5 | It ruled for the seller and released the hold: $388.18 kept. | $388.18 → "three hundred eighty-eight dollars and eighteen cents". kept로 끝내요. |
| N16 | B5 | 1:35.6–1:41.1 | 5.5 | CaseClerk shows money only when PayPal's own records state it. | only when에 힘을. |
| N17 | B5J | 1:42.8–1:48.6 | 5.8 | You can ask the sandbox to rule on your own test case, too. | your own에 힘을. (판정 요청 기능이 나올 때만 써요. 일단 녹음해 주세요.) |
| N18 | B6 | 1:49.1–1:53.6 | 4.5 | The seller's lines are code, not hints in a prompt. | code와 hints를 대비해서. |
| N19 | B6 | 1:54.4–2:02.0 | 7.6 | Evidence under $250 and refunds up to $15 go out on their own. | $250 → "two hundred fifty dollars", $15 → "fifteen dollars". |
| N20 | B6 | 2:02.6–2:05.6 | 3.0 | Anything bigger waits for a yes. | bigger, yes에 힘을. 짧게. |
| N21 | B7 | 2:07.5–2:11.9 | 4.4 | Under the hood, every PayPal webhook is verified first. | verified first에 힘을. |
| N22 | B7 | 2:12.4–2:19.4 | 7.0 | Claude Haiku sorts the case. Claude Opus works it with tools, and writes the evidence. | Haiku = HAI-koo (하이쿠), Opus = OH-pus (오퍼스). |
| N23 | B7 | 2:19.9–2:26.7 | 6.8 | Every action passes the seller's lines before it reaches PayPal, under hard spend caps. | hard spend caps를 또박또박. |
| N24 | B7 | 2:27.3–2:32.2 | 4.9 | Eleven sandbox chargebacks have run this loop end to end. | Eleven에 힘을. end to end. |
| N25 | B8 | 2:33.3–2:40.7 | 7.4 | For a one-person shop, that's an answer on every dispute, instead of a loss by default. | one-person shop. every와 loss by default를 대비해서. |
| N26 | B8 | 2:41.2–2:46.8 | 5.6 | CaseClerk. It answers your PayPal disputes, and asks before it moves money. | 마지막 줄이에요. CaseClerk 뒤에 한 박자 쉬고, 천천히. |

import BoardClient from "./BoardClient";

export const metadata = { title: "CaseClerk · Deadline board" };

export default function BoardPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <h1 style={{ margin: "12px 16px", fontSize: 20 }}>Dispute deadline board</h1>
      <div style={{ flex: 1, minHeight: 0 }}>
        <BoardClient />
      </div>
    </div>
  );
}

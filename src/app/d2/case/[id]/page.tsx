import { redirect } from "next/navigation";

export default async function D2Case({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/case/${encodeURIComponent(id)}`);
}

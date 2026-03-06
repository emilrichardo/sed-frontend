import { redirect } from "next/navigation";
import { getBulletins } from "@/lib/api";

export default async function BoletinHoyPage() {
  const result = await getBulletins({ limit: 1 });
  const latest = result.docs[0];
  if (latest) {
    redirect(`/boletines/${latest.slug}`);
  }
  redirect("/boletines");
}

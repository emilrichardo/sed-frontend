import { Isotipo } from "@/components/brand/Isotipo";

export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <Isotipo size={64} animated />
    </div>
  );
}

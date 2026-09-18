import { BoltMark } from "@/components/ui/logo";

export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <BoltMark className="bolt-pulse h-8 w-auto text-volt-500" />
    </div>
  );
}

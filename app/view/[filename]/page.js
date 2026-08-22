"use client";

import { useRouter } from "next/navigation";

export default function InterceptedViewTest({
  params,
}: {
  params: {
    filename: string;
  };
}) {
  const router =
    useRouter();

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
      onClick={() =>
        router.back()
      }
    >
      <div
        className="max-w-[90vw] bg-white px-8 py-6 text-center text-black"
        onClick={
          event =>
            event.stopPropagation()
        }
      >
        <div className="text-lg font-medium">
          INTERCEPTED /VIEW/ ROUTE
        </div>

        <div className="mt-2 break-all text-sm opacity-70">
          {params.filename}
        </div>

        <button
          type="button"
          className="mt-5 cursor-pointer underline"
          onClick={() =>
            router.back()
          }
        >
          CLOSE TEST
        </button>
      </div>
    </div>
  );
}

'use client'

import MasonaryGrid from "@/components/MasonaryGrid ";
import NavigationBar from "@/components/navigationBar ";

export default function Page() {
  return (
    <div className="px-4 lg:px-16 space-y-10 pb-10">
      <NavigationBar />

      <MasonaryGrid />
    </div>
  );
}

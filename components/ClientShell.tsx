'use client';

import DynamicTitle from "./DynamicTitle";
import { ToastContainer } from "react-toastify";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DynamicTitle />
      <main>
        {children}
        <ToastContainer />
      </main>
    </>
  );
}

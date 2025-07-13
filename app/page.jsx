"use client"

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import MasonaryGrid from "../components/MasonaryGrid";
import RootLayout from "./layout";

import { IoMdList } from "react-icons/io";
import { RxCaretSort } from "react-icons/rx";
import { IoMdShuffle } from "react-icons/io";

export default function Page() {
  const [autosMode, setAutosMode] = useState(false);
  const [hideCursor, setHideCursor] = useState(false);
  const scrollRef = useRef(null);
  const cursorTimerRef = useRef(null);

  useEffect(() => {
    if (autosMode) {
      document.body.classList.add("autosmode");

      let scrollSpeed = 0.5;
      const scrollStep = () => {
        window.scrollBy(0, scrollSpeed);
        if (window.scrollY + window.innerHeight >= document.body.scrollHeight) {
          window.scrollTo(0, 0);
        }
        scrollRef.current = requestAnimationFrame(scrollStep);
      };
      scrollRef.current = requestAnimationFrame(scrollStep);

      const handleMouseMove = () => {
        clearTimeout(cursorTimerRef.current);
        setHideCursor(false);
        cursorTimerRef.current = setTimeout(() => {
          setHideCursor(true);
        }, 3000);
      };

      window.addEventListener("mousemove", handleMouseMove);

      const exitBtn = document.createElement("button");
      exitBtn.style.position = "fixed";
      exitBtn.style.top = "10px";
      exitBtn.style.right = "10px";
      exitBtn.style.width = "30px";
      exitBtn.style.height = "30px";
      exitBtn.style.opacity = "0";
      exitBtn.style.cursor = "pointer";
      exitBtn.style.zIndex = "9999";
      exitBtn.onclick = () => setAutosMode(false);
      document.body.appendChild(exitBtn);

      return () => {
        document.body.classList.remove("autosmode");
        cancelAnimationFrame(scrollRef.current);
        clearTimeout(cursorTimerRef.current);
        window.removeEventListener("mousemove", handleMouseMove);
        document.body.classList.remove("blackmode-hide-cursor");
        exitBtn.remove();
      };
    }
  }, [autosMode]);

  useEffect(() => {
    if (hideCursor && autosMode) {
      document.body.classList.add("blackmode-hide-cursor");
    } else {
      document.body.classList.remove("blackmode-hide-cursor");
    }
  }, [hideCursor, autosMode]);

  return (
    <RootLayout>
      {/* Invisible dev button */}
      <button
        onClick={() => setAutosMode(true)}
        style={{
          position: "fixed",
          top: "10px",
          right: "10px",
          width: "30px",
          height: "30px",
          opacity: 0,
          cursor: "pointer",
          zIndex: 9999
        }}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Header/Nav only if NOT autosMode */}
      {!autosMode && (
        <div className="w-full flex justify-center items-center py-9">
          <div className="w-full grid place-items-center space-y-6">
            <Link href={"/"}>
              <img
                src="/assets/logo.svg"
                className="object-contain w-40"
                alt=""
              />
            </Link>

            <div className="flex gap-8 items-center">
              <Link href={"/indx"}>
                <IoMdList className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl" />
              </Link>

              <Link href={"/ordr"}>
                <RxCaretSort className="cursor-pointer transition-all duration-200 hover:scale-105 text-3xl" />
              </Link>

              <Link href={"/rndm"}>
                <IoMdShuffle className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MasonaryGrid wrapper */}
      <div className={autosMode ? "w-full fixed inset-0 z-50" : "px-4 lg:px-16 pb-10"}>
        <MasonaryGrid />
      </div>

      {/* Bottom logo + Footer only in normal mode */}
      {!autosMode && (
        <>
          <div className="flex justify-center items-center mt-10">
            <img src="/assets/logo.svg" className="w-24 opacity-50" alt="" />
          </div>
          {/* Footer rendered here instead of MasonaryGrid */}
          <MasonaryGrid.Footer />
        </>
      )}
    </RootLayout>
  );
}

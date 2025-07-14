"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Lightbox, { defaultRenderSlide } from "yet-another-react-lightbox";
import InfiniteScroll from "react-infinite-scroll-component";
import Loader from "../components/loader/loader";
import MoreImageLoader from "../components/MoreImageLoader/index";
import Footer from "../components/Footer";
import RootLayout from "./layout";

import { IoMdList } from "react-icons/io";
import { RxCaretSort } from "react-icons/rx";
import { IoMdShuffle } from "react-icons/io";

export default function Page() {
  const [autosMode, setAutosMode] = useState(false);
  const [hideCursor, setHideCursor] = useState(false);
  const scrollRef = useRef(null);
  const cursorTimerRef = useRef(null);

  const [images, setImages] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loader, __loader] = useState(true);

  const [index, setIndex] = useState(-1);
  const [slides, setSlides] = useState([]);

  const wasCalled = useRef(false);

  const fetchImages = async (token) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-images`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lastVisibleDocId: token }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const newImages = data.images;

        if (newImages.length === 0) {
          setHasMore(false);
          return;
        }

        if (!data.nextPageToken) {
          setHasMore(false);
          setNextPageToken(null);
        } else {
          setImages((prevImages) => {
            const existingNames = new Set(prevImages.map((img) => img.name));
            const uniqueImages = newImages.filter(
              (img) => !existingNames.has(img.name)
            );
            return [...prevImages, ...uniqueImages];
          });
          setNextPageToken(data.nextPageToken);
        }

        const newSlides = newImages.map((photo) => ({
          src: photo.src,
          width: 1080 * 4,
          height: 1620 * 4,
          title: photo.caption,
          description: photo.dimensions,
          director: photo.director || null,
          year: photo.year,
        }));

        setSlides((prevSlides) => [...prevSlides, ...newSlides]);
      }
    } catch (err) {
      console.error("Failed to fetch images:", err);
      setHasMore(false);
    }
    __loader(false);
  };

  useEffect(() => {
    if (wasCalled.current) return;
    wasCalled.current = true;

    __loader(true);
    fetchImages(nextPageToken);
  }, []);

  // AUTOSMODE: handle scrolling, fullscreen, and cursor hide
  useEffect(() => {
    if (autosMode) {
      document.body.classList.add("autosmode");

      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn("Fullscreen request failed:", err);
        });
      }

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

        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch((err) => {
            console.warn("Exiting fullscreen failed:", err);
          });
        }

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
          zIndex: 9999,
        }}
        aria-hidden="true"
        tabIndex={-1}
      />

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

      {loader ? (
        <Loader />
      ) : (
        <div className={`${autosMode ? "w-full z-50" : "px-4 lg:px-16 pb-10"}`}>
          <InfiniteScroll
            dataLength={images.length}
            next={() => fetchImages(nextPageToken)}
            hasMore={hasMore}
            loader={<MoreImageLoader />}
          >
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px] place-items-center">
              {images.map((photo, i) => (
                <div key={i}>
                  <img
                    alt={photo.name}
                    src={photo.src}
                    onClick={() => setIndex(i)}
                    className="aspect-[16/9] object-cover cursor-zoom-in"
                  />
                </div>
              ))}
            </div>
          </InfiniteScroll>
        </div>
      )}

      {!loader && !autosMode && <Footer />}

{slides && (
  <Lightbox
    index={index}
    slides={slides}
    open={index >= 0}
    close={() => setIndex(-1)}
    render={{
      slide: (props) =>
        props.slide.src.endsWith(".webm")
          ? defaultRenderSlide({
              ...props,
              renderMedia: ({ slide }) => (
                <video
                  src={slide.src}
                  className="w-full h-auto max-h-[90vh] object-contain"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls={false}
                />
              ),
            })
          : defaultRenderSlide(props),
      slideFooter: ({ slide }) => (
        <div className="lg:!w-[96%] text-left text-sm space-y-1 lg:pt-[.5rem] lg:mb-[.75rem] pb-[1rem] text-white px-0 pt-0 lg:pl-0 lg:ml-[-35px] lg:pr-[3rem] yarl-slide-content">
          {slide.title && (
            <div className="yarl__slide_title">{slide.title}</div>
          )}
          <div className={slide.director && "!mb-5"}>
            {slide.director && (
              <div className="yarl__slide_description !text-[#99AABB]">
                <span className="font-medium">{slide.director}</span>
              </div>
            )}
            {slide.description && (
              <div className="yarl__slide_description">
                {slide.description}
              </div>
            )}
          </div>
        </div>
      ),
    }}
  />
)}

    </RootLayout>
  );
}

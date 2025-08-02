"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Lightbox from "yet-another-react-lightbox";
import Video from 'yet-another-react-lightbox/plugins/video'
import InfiniteScroll from "react-infinite-scroll-component";
import Loader from "../components/loader/loader";
import MoreImageLoader from "../components/MoreImageLoader/index";
import Footer from "../components/Footer";
import RootLayout from "./layout";
import AnimatedLogo from "../components/AnimatedLogo";

import { IoMdList } from "react-icons/io";
import { RxCaretSort } from "react-icons/rx";
import { IoMdShuffle } from "react-icons/io";

export default function Page() {
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

const newSlides = newImages.map((photo) => {
  if (photo.src.toLowerCase().includes('.webm')) {
    return {
      type: 'video',
      width: 1080 * 4,
      height: 1620 * 4,
      title: photo.caption,
      description: photo.dimensions,
      director: photo.director || null,
      year: photo.year,
      sources: [{
        src: photo.src,
        type: 'video/webm'
      }],
      poster: '/assets/transparent.png',
      autoPlay: true,
      muted: true,
      loop: true,
      controls: false
    }
  } else {
    return {
      type: 'image',
      src: photo.src,
      width: 1080 * 4,
      height: 1620 * 4,
      title: photo.caption,
      description: photo.dimensions,
      director: photo.director || null,
      year: photo.year
    }
  }
});


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

  // 🩹 MutationObserver to remove title="Close"
  useEffect(() => {
    if (!slides.length) return;
    const observer = new MutationObserver(() => {
      document.querySelectorAll('.yarl__button[title="Close"]').forEach(btn => {
        btn.removeAttribute('title');
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [slides]);

  return (
    <RootLayout>
      <div className="w-full flex justify-center items-center py-9">
        <div className="w-full grid place-items-center space-y-6">
<Link href="/" className="block w-40">
  <AnimatedLogo />
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

      {loader ? (
        <Loader />
      ) : (
        <div className="px-4 lg:px-16 pb-10">
          <InfiniteScroll
            dataLength={images.length}
            next={() => fetchImages(nextPageToken)}
            hasMore={hasMore}
            loader={<MoreImageLoader />}
          >
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px] place-items-center">
             {images.map((photo, i) => (
  <div key={i} className="w-full aspect-[16/9] relative overflow-hidden cursor-zoom-in">
    {photo.src.toLowerCase().includes('.webm') ? (
      <video
        src={photo.src}
        onClick={() => setIndex(i)}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      />
    ) : (
      <img
        alt={photo.name}
        src={photo.src}
        onClick={() => setIndex(i)}
        className="absolute inset-0 w-full h-full object-cover"
      />
    )}
  </div>
))}

            </div>
          </InfiniteScroll>
        </div>
      )}

      {!loader && <Footer />}

      {slides && (
<Lightbox
  index={index}
  slides={slides}
  open={index >= 0}
  close={() => setIndex(-1)}
  plugins={[Video]}
  render={{
    slideFooter: ({ slide }) => (
<div className={`lg:!w-[96%] text-left text-sm space-y-1 lg:pt-[.5rem] lg:mb-[.75rem] pb-[1rem] text-white px-0 pt-0 lg:pl-0 lg:ml-[-35px] lg:pr-[3rem] yarl-slide-content ${slide.type === 'video' ? 'relative top-auto bottom-unset' : ''}`}>
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

"use client";

import React, { useRef, useEffect } from "react";
import LightGallery from "lightgallery/react";
import "lightgallery/css/lightgallery.css";
import "lightgallery/css/lg-zoom.css";
import "lightgallery/css/lg-video.css";

import lgZoom from "lightgallery/plugins/zoom";
import lgVideo from "lightgallery/plugins/video";
import InfiniteScroll from "react-infinite-scroll-component";
import MoreImageLoader from "./MoreImageLoader";

export default function TNDRLightbox({ images, fetchImages, hasMore, nextPageToken, autosMode }) {
  const lgRef = useRef(null);

  // Prepare slides for LightGallery dynamic mode
  const slides = images.map((photo) => ({
    src: photo.src,
    thumb: photo.src,
    poster: photo.poster || photo.src,
    subHtml: `
      <div class="yarl__slide_title">${photo.caption || ""}</div>
      <div class="yarl__slide_description">
        ${photo.director ? `<span class="font-medium">${photo.director}</span><br/>` : ""}
        ${photo.dimensions || ""}
      </div>
    `,
    ...(photo.src.toLowerCase().endsWith(".webm") && {
      video: {
        source: [
          {
            src: photo.src,
            type: "video/webm",
          },
        ],
        attributes: {
          preload: false,
          controls: true,
          autoplay: true,
          muted: true,
          playsinline: true,
          loop: true,
        },
      },
    }),
  }));

  // Refresh LightGallery instance when images update
  useEffect(() => {
    if (lgRef.current?.instance) {
      lgRef.current.instance.refresh();
    }
  }, [images]);

  // Handle grid click to open Lightbox
  const handleClick = (index) => {
    if (lgRef.current?.instance) {
      setTimeout(() => {
        lgRef.current.instance.openGallery(index);
      }, 0);
    } else {
      console.warn("LightGallery instance not ready yet");
    }
  };

  return (
    <div className={autosMode ? "w-full z-50" : "px-4 lg:px-16 pb-10"}>
      <InfiniteScroll
        dataLength={images.length}
        next={() => fetchImages(nextPageToken)}
        hasMore={hasMore}
        loader={<MoreImageLoader />}
      >
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px] place-items-center">
          {images.map((photo, i) => (
            <div
              key={i}
              onClick={() => handleClick(i)}
              className="cursor-zoom-in"
            >
              {photo.src.toLowerCase().endsWith(".webm") ? (
                <video
                  src={photo.src}
                  muted
                  loop
                  autoPlay
                  playsInline
                  className="aspect-[16/9] object-cover"
                />
              ) : (
                <img
                  src={photo.src}
                  alt={photo.name}
                  className="aspect-[16/9] object-cover"
                />
              )}
            </div>
          ))}
        </div>
      </InfiniteScroll>

      <LightGallery
        dynamic
        dynamicEl={slides}
        plugins={[lgZoom, lgVideo]}
        closable
        preload={2}
        download={false}
        zoom={true}
        autoplayVideoOnSlide
        speed={500}
        mode="lg-fade"
        ref={lgRef}
      />
    </div>
  );
}

"use client";

import React from "react";
import LightGallery from "lightgallery/react";
import "lightgallery/css/lightgallery.css";
import "lightgallery/css/lg-zoom.css";
import "lightgallery/css/lg-video.css";

import lgZoom from "lightgallery/plugins/zoom";
import lgVideo from "lightgallery/plugins/video";
import InfiniteScroll from "react-infinite-scroll-component";
import MoreImageLoader from "./MoreImageLoader";

export default function TNDRLightbox({ images, fetchImages, hasMore, nextPageToken, autosMode }) {
  if (!images || images.length === 0) return null;

  return (
    <div className={autosMode ? "w-full z-50" : "px-4 lg:px-16 pb-10"}>
      <InfiniteScroll
        dataLength={images.length}
        next={() => fetchImages(nextPageToken)}
        hasMore={hasMore}
        loader={<MoreImageLoader />}
      >
        <LightGallery
          plugins={[lgZoom, lgVideo]}
          closable
          preload={2}
          download={false}
          zoom={true}
          autoplayVideoOnSlide
          speed={500}
          mode="lg-fade"
        >
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px] place-items-center">
            {images.map((photo, i) => {
              const absoluteURL = photo.src.startsWith("http")
                ? photo.src
                : `${process.env.NEXT_PUBLIC_APP_URL}${photo.src}`;

              return (
                <a
                  key={i}
                  href={absoluteURL}
                  data-sub-html={`
                    <div class="yarl__slide_title">${photo.caption || ""}</div>
                    <div class="yarl__slide_description">
                      ${photo.director ? `<span class="font-medium">${photo.director}</span><br/>` : ""}
                      ${photo.dimensions || ""}
                    </div>
                  `}
                  {...(photo.src.toLowerCase().endsWith(".webm")
                    ? { "data-poster": photo.poster || absoluteURL }
                    : {})}
                >
                  {photo.src.toLowerCase().endsWith(".webm") ? (
                    <video
                      src={absoluteURL}
                      muted
                      loop
                      autoPlay
                      playsInline
                      className="aspect-[16/9] object-cover cursor-zoom-in"
                    />
                  ) : (
                    <img
                      src={absoluteURL}
                      alt={photo.name}
                      className="aspect-[16/9] object-cover cursor-zoom-in"
                    />
                  )}
                </a>
              );
            })}
          </div>
        </LightGallery>
      </InfiniteScroll>
    </div>
  );
}

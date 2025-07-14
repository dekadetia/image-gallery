"use client";

import React from "react";
import LightGallery from "lightgallery/react";
import "lightgallery/css/lightgallery.css";
import "lightgallery/css/lg-zoom.css";
import "lightgallery/css/lg-video.css";

import lgZoom from "lightgallery/plugins/zoom";
import lgVideo from "lightgallery/plugins/video";

export default function TNDRLightbox({
  slides,
  index,
  setIndex,
}) {
  if (!slides || slides.length === 0) return null;

  const handleBeforeSlide = (event) => {
    setIndex(event.index);
  };

  return (
    <LightGallery
      dynamic
      dynamicEl={slides.map((slide) => ({
        src: slide.src,
        thumb: slide.src,
        poster: slide.src,
        subHtml: `
          <div class="yarl__slide_title">${slide.title || ""}</div>
          <div class="yarl__slide_description">
            ${slide.director ? `<span class="font-medium">${slide.director}</span><br/>` : ""}
            ${slide.description || ""}
          </div>
        `,
      }))}
      plugins={[lgZoom, lgVideo]}
      index={index}
      onBeforeSlide={handleBeforeSlide}
      onClose={() => setIndex(-1)}
      mode="lg-fade"
      closable
      preload={2}
      download={false}
      zoom={true}
      videojs={false}
      hideBarsDelay={2000}
      autoplayVideoOnSlide
    />
  );
}

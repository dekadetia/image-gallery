"use client";

import React, { useEffect, useRef } from "react";
import LightGallery from "lightgallery/react";
import "lightgallery/css/lightgallery.css";
import "lightgallery/css/lg-zoom.css";
import "lightgallery/css/lg-video.css";

import lgZoom from "lightgallery/plugins/zoom";
import lgVideo from "lightgallery/plugins/video";

export default function TNDRLightbox({ slides, index, setIndex }) {
  const lgRef = useRef(null);

  useEffect(() => {
    if (index >= 0 && lgRef.current && lgRef.current.instance) {
      lgRef.current.instance.openGallery(index);
    }
  }, [index]);

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
      onBeforeSlide={({ index }) => setIndex(index)}
      onClose={() => setIndex(-1)}
      closable
      preload={2}
      download={false}
      zoom={true}
      autoplayVideoOnSlide
      speed={500}
      mode="lg-fade"
      ref={lgRef}
    />
  );
}

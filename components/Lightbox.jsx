"use client";

import React from "react";
import LightGallery from "lightgallery/react";
import "lightgallery/css/lightgallery.css";
import "lightgallery/css/lg-zoom.css";
import "lightgallery/css/lg-video.css";

import lgZoom from "lightgallery/plugins/zoom";
import lgVideo from "lightgallery/plugins/video";

export default function TNDRLightbox({ slides }) {
  if (!slides || slides.length === 0) return null;

  return (
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
      {slides.map((slide, i) => (
        <a
          key={i}
          href={slide.src}
          data-sub-html={`
            <div class="yarl__slide_title">${slide.title || ""}</div>
            <div class="yarl__slide_description">
              ${slide.director ? `<span class="font-medium">${slide.director}</span><br/>` : ""}
              ${slide.description || ""}
            </div>
          `}
        >
          {slide.src.toLowerCase().endsWith(".webm") ? (
            <video
              src={slide.src}
              muted
              loop
              autoPlay
              playsInline
              className="aspect-[16/9] object-cover cursor-zoom-in"
            />
          ) : (
            <img
              src={slide.src}
              alt={slide.title || ""}
              className="aspect-[16/9] object-cover cursor-zoom-in"
            />
          )}
        </a>
      ))}
    </LightGallery>
  );
}

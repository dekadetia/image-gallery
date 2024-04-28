
'use client'

import { useState } from "react";
import "yet-another-react-lightbox/styles.css";
import Lightbox from "yet-another-react-lightbox";

import slides from "../components/slides";
import NavigationBar from "@/components/navigationBar ";

export default function Page() {
  const [index, setIndex] = useState(-1);
  const photos = [
    {
      image: "/assets/1.jpg",
    },
    {
      image: "/assets/2.jpg"
    },
    {
      image: "/assets/3.jpg",      
    },
    {
      image: "/assets/4.jpg",
    },
    {
      image: "/assets/5.jpg",
    },
    {
      image: "/assets/6.jpg",
    },
  ];

  return (
    <div className="px-4 lg:px-16 space-y-10 pb-10">
      <NavigationBar />

      <div className="columns-1 gap-5 sm:columns-2 sm:gap-2 md:columns-3 [&>img:not(:first-child)]:mt-2">
        {photos.map((photo, i) => (
          <img
            key={i}
            src={photo.image}
            alt={'images'}
            className="h-auto w-full cursor-zoom-in"
            onClick={() => setIndex(i)}
          />
        ))}
      </div>

      <Lightbox
        index={index}
        slides={slides}
        open={index >= 0}
        close={() => setIndex(-1)}
      />
    </div>
  );
}

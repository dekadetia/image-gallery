'use client';

import { useState } from "react";

import "yet-another-react-lightbox/styles.css";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import slides from "../components/slides";

export default function MasonaryGrid() {
    const [index, setIndex] = useState(-1);
    const [descriptionMaxLines, setDescriptionMaxLines] = useState(3);
    const [descriptionTextAlign, setDescriptionTextAlign] = useState("end");
    const [isOpen, setOpen] = useState(true)
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
        {
            image: "/assets/7.jpg",
        },
        {
            image: "/assets/8.jpg",
        },
        {
            image: "/assets/9.jpg",
        },
        {
            image: "/assets/10.jpg",
        },
        {
            image: "/assets/11.jpg",
        },
        {
            image: "/assets/12.jpg",
        },
        {
            image: "/assets/13.jpg",
        },
        {
            image: "/assets/14.jpg",
        },
        {
            image: "/assets/15.jpg",
        },
        {
            image: "/assets/16.jpg",
        },
        {
            image: "/assets/17.webp",
        },
    ];

    return (
        <>
            <div className="columns-1 gap-5 sm:columns-2 sm:gap-2 md:columns-3 [&>img:not(:first-child)]:mt-2 main-container">
                {photos.map((photo, i) => (
                    <img
                        key={i}
                        src={photo.image}
                        alt={'images'}
                        className="cursor-zoom-in"
                        onClick={() => setIndex(i)}
                    />
                ))}
            </div>

            <Lightbox
                plugins={[Captions]}
                index={index}
                slides={slides}
                open={index >= 0}
                close={() => setIndex(-1)}
                captions={{ isOpen, descriptionTextAlign, descriptionMaxLines }}
            />
        </>
    )
}

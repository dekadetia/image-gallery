'use client'

import "yet-another-react-lightbox/styles.css";
import React, { useState, useEffect } from "react";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Loader from '../components/loader/loader';

export default function MasonaryGrid() {
    const [index, setIndex] = useState(-1);
    const [descriptionMaxLines, setDescriptionMaxLines] = useState(3);
    const [descriptionTextAlign, setDescriptionTextAlign] = useState("end");
    const [isOpen, setOpen] = useState(true);
    const [fetchPhotos, setFetchedPhotos] = useState([]);
    const [slides, setSlides] = useState([]);
    const [loader, setLoader] = useState(false);
    const [skeleton, setSkeleton] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [newImages, setNewImages] = useState([]);

    const arr = Array.from({ length: 35 }, (_, index) => index + 1);

    const getImages = async () => {
        setSkeleton(true);
        try {
            const response = await fetch(`/api/firebase?page=${pageNumber}`, {
                method: "GET",
            });

            if (response.ok) {
                const data = await response.json();
                const images = data.images;
                console.log("Files fetched successfully:", images);
                setFetchedPhotos([...images]);
                if (images.length > 35) {
                    const slice = images.slice(0, 35);
                    setNewImages(slice);
                    setSlides(slice.map((photo) => {
                        const width = 1080 * 4;
                        const height = 1620 * 4;
                        return {
                            src: photo.src,
                            width,
                            height,
                            description: '',
                        };
                    }));
                } else {
                    setNewImages(images);
                    setSlides(images.map((photo) => {
                        const width = 1080 * 4;
                        const height = 1620 * 4;
                        return {
                            src: photo.src,
                            width,
                            height,
                            description: '',
                        };
                    }));
                }
                setSkeleton(false);
            } else {
                console.error("Failed to get files");
                setSkeleton(false);
            }
        } catch (error) {
            console.error("Error fetching files:", error);
            setSkeleton(false);
        }
    };

    const handleScroll = () => {
        setSkeleton(true);
        const nextImages = [...newImages, ...fetchPhotos.slice(newImages.length, newImages.length + 35)];
        setNewImages(nextImages)
        setSlides(nextImages.map((photo) => {
            const width = 1080 * 4;
            const height = 1620 * 4;
            return {
                src: photo.src,
                width,
                height,
                description: '',
            };
        }));
        setTimeout(() => {
            setSkeleton(false);
        }, 1500);

    };

    useEffect(() => {
        getImages();
    }, []);

    return (
        <>
            {/* {loader && (
                <div className="h-full flex items-center justify-center fixed w-full top-0 left-0 bg-black/50 z-10">
                    <Loader />
                </div>
            )} */}

            <div className="c-container">
                {newImages.map((photo, i) => (
                    <figure className="relative" key={i}>
                        <img
                            src={photo.src}
                            alt={'images'}
                            className="cursor-zoom-in images"
                            onClick={() => setIndex(i)}
                            loading="lazy"
                        />
                    </figure>
                ))}
            </div>

            <div className="c-container">
                {skeleton &&
                    arr.map((val, index) => {
                        const heights = ['h-40', 'h-96', 'h-48', 'h-72', 'h-60', 'h-80'];
                        const randomHeight = heights[Math.floor(Math.random() * heights.length)];
                        return <div key={index} className={`bg-gray-700 w-full mb-2 animate-pulse shadow-lg ${randomHeight}`}></div>
                    })
                }
            </div>


            <button className="bg-gray-600 h-12 font-medium text-base w-[200px] block mx-auto my-6" onClick={handleScroll}>
                Load More
            </button>


            {slides &&
                <Lightbox
                    plugins={[Captions]}
                    index={index}
                    slides={slides}
                    open={index >= 0}
                    close={() => setIndex(-1)}
                    captions={{ isOpen, descriptionTextAlign, descriptionMaxLines }}
                />
            }
            <div className="md:text-sm lg:text-2xl"></div>
        </>
    )
}

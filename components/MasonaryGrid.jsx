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
    const [newImages, setNewImages] = useState([]);

    const arr = Array.from({ length: 35 }, (_, index) => index + 1);

    const getImages = async () => {
        setSkeleton(true);
        try {
            const response = await getImagesAPI();

            if (response.ok) {
                const data = await response.json();
                const images = data.images;
                console.log("Files fetched successfully:", images);
                setFetchedPhotos([...images]);
                if (images.length > 36) {
                    const slice = images.slice(0, 36);
                    setNewImages(slice);
                    setSlides(slice.map((photo) => {
                        const width = 1080 * 4;
                        const height = 1620 * 4;
                        return {
                            src: photo.src,
                            width,
                            height,
                            description: photo.caption,
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
                            description: photo.caption,
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
        const nextImages = [...newImages, ...fetchPhotos.slice(newImages.length, newImages.length + 36)];
        setNewImages(nextImages)
        setSlides(nextImages.map((photo) => {
            const width = 1080 * 4;
            const height = 1620 * 4;
            return {
                src: photo.src,
                width,
                height,
                description: photo.caption,
            };
        }));
        setTimeout(() => {
            setSkeleton(false);
        }, 1500);
    };

    function isInViewport() {
        // Get the bounding client rectangle position in the viewport
        const element = document.getElementById("load-more-button")
        var bounding = element.getBoundingClientRect();

        // Checking part. Here the code checks if it's *fully* visible
        // Edit this part if you just want a partial visibility
        if (
            bounding.top >= 0 &&
            bounding.left >= 0 &&
            bounding.right <= (window.innerWidth || document.documentElement.clientWidth) &&
            bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight)
        ) {
            console.log('In the viewport! :)');
            return true;
        } else {
            console.log('Not in the viewport. :(');
            return false;
        }
    }

    function throttle(func, delay) {
        let lastFunc;
        let lastRan;
        return function (...args) {
            const context = this;
            if (!lastRan) {
                func.call(context, ...args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(function () {
                    if ((Date.now() - lastRan) >= delay) {
                        func.call(context, ...args);
                        lastRan = Date.now();
                    }
                }, delay - (Date.now() - lastRan));
            }
        };
    }

    useEffect(() => {
        getImages();

        const handleScrollThrottled = throttle(function (event) {
            if (isInViewport()) {
                handleScroll();
            }
        }, 200); // Throttle scroll event to fire every 200ms

        window.addEventListener('scroll', handleScrollThrottled, false);

        return () => window.removeEventListener("scroll", handleScrollThrottled);
    }, []);
    
    return (
        <>
            {/* {loader && (
                <div className="h-full flex items-center justify-center fixed w-full top-0 left-0 bg-black/50 z-10">
                    <Loader />
                </div>
            )} */}

            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px] place-items-center">
                {newImages.map((photo, i) => (
                    <figure className="relative" key={i}>
                        <Image
                            src={photo.src}
                            alt={'images'}
                            className="aspect-[16/9] object-cover cursor-zoom-in"
                            onClick={() => setIndex(i)}
                            loading="lazy"
                            style={{ width: "auto", height: "auto" }}
                        />
                    </figure>
                ))}
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px] place-items-center">
                {skeleton &&
                    arr.map((val, index) => {
                        const heights = ['h-40', 'h-96', 'h-48', 'h-72', 'h-60', 'h-80'];
                        const randomHeight = heights[Math.floor(Math.random() * heights.length)];
                        return <div
                            key={index}
                            className={`bg-gray-700 w-full mb-2 animate-pulse shadow-lg ${randomHeight}`}
                        />
                    })
                }
            </div>


            <button
                className="capitalize bg-gray-600 h-12 font-medium text-base w-[200px] block mx-auto my-6"
                id="load-more-button"
            >
                Loading more images
            </button>

            <div
                className="grid place-items-center text-4xl py-10"
                onClick={handleScroll}
            >
                <AiOutlinePlus className="cursor-pointer transition-all duration-300 hover:opacity-80 text-[#CECECF]" />
            </div>

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
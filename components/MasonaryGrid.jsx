'use client'

import { useState, useEffect, useRef } from "react";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import { AiOutlinePlus } from "react-icons/ai";
import { getImagesAPI } from "../utils/getImages";
import Loader from "./loader/loader";
import Footer from "./Footer";

export default function MasonaryGrid() {
    const descriptionTextAlign = "end";
    const descriptionMaxLines = 3;
    const [index, setIndex] = useState(-1);
    const [isOpen, setOpen] = useState(true);
    // const [fetchPhotos, setFetchedPhotos] = useState([]);
    const [slides, setSlides] = useState([]);
    // const [loader, setLoader] = useState(false);
    const [skeleton, setSkeleton] = useState(false);
    const [Images, setImages] = useState([]);
    const [nextPageToken, setNextPageToken] = useState(null);
    const wasCalled = useRef(false);


    const arr = Array.from({ length: 35 }, (_, index) => index + 1);

    const getImages = async (token) => {
        setSkeleton(true);
        try {
            const response = await getImagesAPI(token);
            if (response.ok) {
                const data = await response.json();
                const images = data.images;

                setNextPageToken(data.nextPageToken);
                setImages((prevImages) => [...prevImages, ...images]);

                const newSlides = images.map((photo) => {
                    const width = 1080 * 4;
                    const height = 1620 * 4;
                    return {
                        src: photo.src,
                        width,
                        height,
                        description: photo.caption,
                    };
                });

                setSlides((prevSlides) => [...prevSlides, ...newSlides]);
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

    const moreImagesLoadHandler = () => {
        if (nextPageToken) {
            getImages(nextPageToken);
        }
    };

    useEffect(() => {
        if (wasCalled.current) return;
        wasCalled.current = true;
        getImages(nextPageToken);
    }, []);

    return (
        <>

            {/* Images */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px] place-items-center">
                {Images.map((photo, i) => (
                    <figure className="relative" key={i}>
                        <img
                            src={photo.src}
                            alt={'images'}
                            className="aspect-[16/9] object-cover cursor-zoom-in"
                            onClick={() => setIndex(i)}
                            loading="lazy"
                        />
                    </figure>
                ))}
            </div>

            {/* Skeleton */}
            {skeleton && <Loader />}

            {/* Loading More Images Icon */}
            {
                !skeleton && <div className="grid place-items-center text-4xl py-10" onClick={moreImagesLoadHandler}>
                    <AiOutlinePlus className="cursor-pointer transition-all duration-300 hover:opacity-80 text-[#CECECF]" />
                </div>
            }

            {/* Lightbox Component */}
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

            {!skeleton && <Footer />}
        </>
    )
}
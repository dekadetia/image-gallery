'use client'

import Link from "next/link";

import { useState, useEffect } from "react";

import { RxCaretSort } from "react-icons/rx";
import { BsSortAlphaDown } from "react-icons/bs";
import { TbClockDown } from "react-icons/tb";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import { AiOutlinePlus } from "react-icons/ai";
import { getImagesAPI } from "../../utils/getImages";

export default function Index() {
    const descriptionTextAlign = "end";
    const descriptionMaxLines = 3;
    const [index, setIndex] = useState(-1);
    const [isOpen, setOpen] = useState(true);
    const [fetchPhotos, setFetchedPhotos] = useState([]);
    const [slides, setSlides] = useState([]);
    const [loader, setLoader] = useState(false);
    const [skeleton, setSkeleton] = useState(false);
    const [Images, setImages] = useState([]);

    const arr = Array.from({ length: 35 }, (_, index) => index + 1);

    const getImages = async () => {
        setSkeleton(true);
        try {
            const response = await getImagesAPI();

            if (response.ok) {
                const data = await response.json();
                console.log(data)
                const images = data.images;
                console.log("Files fetched successfully:", images);
                setFetchedPhotos([...images]);
                if (images.length > 36) {
                    const slice = images.slice(0, 36);
                    setImages(slice);
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
                    setImages(images);
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

    const moreImagesLoadHandler = () => {
        setSkeleton(true);
        const nextImages = [...Images, ...fetchPhotos.slice(Images.length, Images.length + 36)];
        setImages(nextImages)
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

    useEffect(() => {
        getImages();
    }, []);

    return (
        <>
            {/* Navigation */}
            <div className="w-full flex justify-center items-center py-9">
                <div className="w-full grid place-items-center space-y-6">

                    <Link href={"/"} >
                        <img src="/assets/logo.svg" className="object-contain w-40" alt="" />
                    </Link>

                    <div className="flex gap-8 items-center">
                        <BsSortAlphaDown className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl" />

                        <Link href={"/ordr"}>
                            <RxCaretSort className="cursor-pointer transition-all duration-200 hover:scale-105 text-3xl" />
                        </Link>

                        <TbClockDown className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl" />
                    </div>
                </div>
            </div>

            <div className="px-4 lg:px-16 pb-10">
                <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7 place-items-start">
                    {Images.map((photo, i) => {
                        const caption = photo?.caption.split('(')[0].trim();
                        const year = photo?.caption.split('(')[1].slice(0, -1);
                        return (
                            <div className="relative flex items-center gap-1 cursor-pointer" key={i}
                                onClick={() => setIndex(i)}>
                                <h2 className="transition-all duration-200 hover:text-[#def] text-[#9ab]" >
                                    {caption}
                                </h2>
                                <p className="text-[#678]">{year}</p>
                            </div>
                        )
                    })}
                </div>

                {/* Skeleton */}
                <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 place-items-center">
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

                {/* Loading More Images Icon */}
                <div className="grid place-items-center text-4xl py-10" onClick={moreImagesLoadHandler}>
                    <AiOutlinePlus className="cursor-pointer transition-all duration-300 hover:opacity-80 text-[#CECECF]" />
                </div>

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
            </div>
        </>
    );
}

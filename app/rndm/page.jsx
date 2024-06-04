'use client'

import { useState, useEffect } from "react";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import { AiOutlinePlus } from "react-icons/ai";
import { getImagesAPI } from "../../utils/getImages";
import Link from "next/link";
import { IoMdList, IoMdShuffle } from "react-icons/io";
import { RxCaretSort } from "react-icons/rx";

export default function Random() {
    const descriptionTextAlign = "end";
    const descriptionMaxLines = 3;
    const [randomizeOrder, setRandomizeOrder] = useState(false)
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
                const images = data.images;
                shuffleArray(images)
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

    function shuffleArraysInSync(array1, array2) {
        if (array1.length !== array2.length) {
            throw new Error("Arrays must have the same length.");
        }

        let currentIndex = array1.length;

        while (currentIndex !== 0) {
            const randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            [array1[currentIndex], array1[randomIndex]] = [array1[randomIndex], array1[currentIndex]];
            [array2[currentIndex], array2[randomIndex]] = [array2[randomIndex], array2[currentIndex]];
        }
        console.log("shuffled")
        return { array1, array2 }
    }

    const randomizeSequence = () => {
        // Shuffle the arrays
        const shuffledImages = [...Images];
        const shuffledSlides = [...slides];
        shuffleArraysInSync(shuffledImages, shuffledSlides);

        // Update state with shuffled arrays
        setImages(shuffledImages);
        setSlides(shuffledSlides);
    };

    function shuffleArray(array) {
        let currentIndex = array.length;

        while (currentIndex !== 0) {
            const randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }

        return array; // Add this line to return the shuffled array
    }

    useEffect(() => {
        getImages();
    }, []);

    return (
        <>
            {/* Navigation */}
            <div className="w-full flex justify-center items-center py-9">
                <div className="w-full grid place-items-center space-y-6">

                    <Link href={"/"}>
                        <img src="/assets/logo.svg" className="object-contain w-40" alt="" />
                    </Link>

                    <div className="flex gap-8 items-center">
                        <Link href={"/indx"}>
                            <IoMdList className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl" />
                        </Link>

                        <Link href={"/ordr"}>
                            <RxCaretSort className="cursor-pointer transition-all duration-200 hover:scale-105 text-3xl" />
                        </Link>

                        <IoMdShuffle onClick={randomizeSequence} className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl" />
                    </div>
                </div>
            </div>

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

            <div
                className="grid place-items-center text-4xl py-10"
                onClick={moreImagesLoadHandler}
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
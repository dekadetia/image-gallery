'use client'

import Link from "next/link";

import { useState, useEffect } from "react";

import { RxCaretSort } from "react-icons/rx";
import { BsSortAlphaDown } from "react-icons/bs";
import { TbClockDown } from "react-icons/tb";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import { getAllImages } from "../../utils/getImages";
import Footer from '../../components/Footer'
import Loader from "../../components/loader/loader";

export default function Index() {
    const descriptionTextAlign = "end";
    const descriptionMaxLines = 3;
    const [index, setIndex] = useState(-1);
    const [isOpen, setOpen] = useState(true);
    // const [fetchPhotos, setFetchedPhotos] = useState([]);
    const [slides, setSlides] = useState([]);
    // const [loader, setLoader] = useState(false);
    const [skeleton, setSkeleton] = useState(false);
    const [Images, setImages] = useState([]);

    const arr = Array.from({ length: 35 }, (_, index) => index + 1);

    const getImages = async () => {
        setSkeleton(true);

        try {
            if(!localStorage.getItem('images_data')){
                const response = await getAllImages();
    
                if (response.ok) {
                    const data = await response.json();
                    const images = data.images;

                    localStorage.setItem("images_data", JSON.stringify(images));
    
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
            }else{
                setSkeleton(true);
                let data = localStorage.getItem('images_data');
                if(data){
                    data = JSON.parse(data);
                    setImages((prevImages) => [...data]);
                    const newSlides = data.map((photo) => {
                        const width = 1080 * 4;
                        const height = 1620 * 4;
                        return {
                            src: photo.src,
                            width,
                            height,
                            description: photo.caption,
                        };
                    });
                    setSlides((prevSlides) => [...newSlides]);
                    setSkeleton(false);
                }
            }
        } catch (error) {
            console.error("Error fetching files:", error);
            setSkeleton(false);
        }
    };

    useEffect(() => {
        // if(wasCalled.current) return;
        // wasCalled.current = true;
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
                <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 place-items-start">
                    {Images.map((photo, i) => {
                        return (
                            <div className="relative flex justify-center items-start gap-1 cursor-pointer text-sm" key={i}
                                onClick={() => setIndex(i)}>
                                <h2 className="transition-all duration-200 hover:text-[#def] text-[#9ab]" >
                                    {photo.caption}
                                </h2>
                                <p className="text-[#678]">{photo.year}</p>
                            </div>
                        )
                    })}
                </div>

                {/* Skeleton */}
                {skeleton && <Loader />}
             
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

            {!skeleton && <Footer />}
        </>
    );
}

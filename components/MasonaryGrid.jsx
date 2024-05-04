'use client';

import { useState, useEffect } from "react";

import "yet-another-react-lightbox/styles.css";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Loader from '../components/loader/loader';
import { MdDelete } from "react-icons/md";
import { AnimatePresence, inView, motion } from "framer-motion";
import Image from "next/image";

export default function MasonaryGrid() {
    const [index, setIndex] = useState(-1);
    const [descriptionMaxLines, setDescriptionMaxLines] = useState(3);
    const [descriptionTextAlign, setDescriptionTextAlign] = useState("end");
    const [isOpen, setOpen] = useState(true);
    const [fetchPhotos, setFetchedPhotos] = useState([]);
    const [slides, setSlides] = useState();
    const [loader, setLoader] = useState(false);
    const [isImagesLoaded, setImagesLoaded] = useState(false)

    const getImages = async () => {
        setLoader(true);
        try {
            const response = await fetch("/api/firebase", {
                method: "GET",
            });

            if (response.ok) {
                const data = await response.json();
                const images = data.images;
                console.log("Files fetched successfully:", images);
                setFetchedPhotos(images);
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
                setLoader(false);
            } else {
                console.error("Failed to get files");
                setLoader(false);
            }
        } catch (error) {
            console.error("Error fetching files:", error);
            setLoader(false);
        }
    };

    const deleteImage = async (name) => {
        setLoader(true);
        const form = new FormData();
        form.append('file_name', name);
        try {
            const response = await fetch("/api/firebase", {
                method: "DELETE",
                body: form,
            });
            if (response.ok) {
                console.log("Files deleted successfully");
                getImages();
                setLoader(false);
            } else {
                console.error("Failed to delete files");
                setLoader(false);
            }
        } catch (error) {
            console.error("Error deleting file:", error);
            setLoader(false);
        }
    }

    useEffect(() => {
        getImages();
    }, [])

    return (
        <>
            {
                loader && <div className="h-full flex items-center justify-center fixed w-full top-0 left-0 bg-black/50 z-10">
                    <Loader />
                </div>
            }
            
            <AnimatePresence>
                <div className="c-container">
                    {fetchPhotos && fetchPhotos.length > 0 ? fetchPhotos.map((photo, i) => (
                        <motion.div className="relative figure" key={i}
                            whileInView={{
                                top: "0",
                                opacity: "1"
                            }}
                            initial={{
                                top: "20px",
                                opacity: ".4"
                            }}
                            animate={{
                                top: "0",
                                opacity: "1"
                            }}
                        >
                            <Image
                                key={i}
                                src={photo.src}
                                alt={'images'}
                                fill
                                className="cursor-zoom-in images"
                                onClick={() => setIndex(i)}
                                onLoadingComplete={() => setImagesLoaded(true)}
                            />
                            <button onClick={() => deleteImage(photo.name)}
                                className="absolute top-5 right-5 rounded-full p-1 text-white bg-red-500 cursor-pointer">
                                <MdDelete />
                            </button>
                        </motion.div>
                    )) :
                        <div className="h-[60vh] flex items-center justify-center" />
                    }
                </div>
            </AnimatePresence>

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
            <div className="md:text-sm lg:text-2xl">

            </div>
        </>
    )
}

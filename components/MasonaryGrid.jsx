'use client';

import { useState, useEffect } from "react";

import "yet-another-react-lightbox/styles.css";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
// import slides from "../components/slides";
import Loader from '../components/loader/loader';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


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

    const [fetchPhotos, setFetchedPhotos] = useState([]);
    const [slides, setSlides] = useState()
    const [loader, setLoader] = useState(false);

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
                setFetchedPhotos(images)
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
                toast.success("Files fetched successfully!", {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                    transition: Slide,
                })
            } else {
                console.error("Failed to get files");
                toast.error("Failed to get files!", {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                    transition: Slide,
                })
                setLoader(false);
            }
        } catch (error) {
            console.error("Error fetching files:", error);
            toast.error("Failed to get files!", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
                transition: Slide,
            })
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
                toast.success("File deleted successfully!", {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                    transition: Slide,
                })
                getImages();
                setLoader(false);
            } else {
                console.error("Failed to delete files");
                setLoader(false);
                toast.error("Failed to delete file!", {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                    transition: Slide,
                })
            }
        } catch (error) {
            console.error("Error deleting file:", error);
            setLoader(false);
            toast.error("Failed to delete file!", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
                transition: Slide,
            })
        }
    }

    useEffect(() => {
        getImages()
    }, [])


    return (
        <>
            <ToastContainer />
            {
                loader &&
                <div className="h-full flex items-center justify-center fixed w-full top-0 left-0 bg-black bg-opacity-50 z-10">
                    <Loader />
                </div>
            }
            <div className="columns-1 gap-5 sm:columns-2 sm:gap-2 md:columns-3 [&>img:not(:first-child)]:mt-2 main-container">
                {/* {photos.map((photo, i) => (
                    <img
                        key={i}
                        src={photo.image}
                        alt={'images'}
                        className="cursor-zoom-in"
                        onClick={() => setIndex(i)}
                    />
                ))} */}
                {fetchPhotos && fetchPhotos.length > 0 ? fetchPhotos.map((photo, i) => (
                    <div className="relative" key={i}>
                        <img
                            key={i}
                            src={photo.src}
                            alt={'images'}
                            className="cursor-zoom-in"
                            onClick={() => setIndex(i)}
                        />
                        <button onClick={() => deleteImage(photo.name)} className="text-white bg-red-500 text-base h-10 w-full cursor-pointer absolute left-0 bottom-0">
                            Delete image
                        </button>
                    </div>
                )) :
                    <div className="h-[60vh] flex items-center justify-center">
                        No Images Found
                    </div>
                }
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
        </>
    )
}

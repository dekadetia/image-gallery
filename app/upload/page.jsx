'use client';

import React, { useState, useEffect } from 'react';
import Loader from '../../components/loader/loader';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MdDelete } from "react-icons/md";

export default function Page() {
    const [images, setImages] = useState([]);
    const [loader, setLoader] = useState(false);
    const [modal, setModal] = useState(false);
    const [delId, setdelId] = useState();

    const [fetchPhotos, setFetchedPhotos] = useState([]);

    const changeHandler = (e) => {
        const files = Array.from(e.target.files);
        setImages(files);
    };

    const checkState = async (e) => {
        setLoader(true);
        e.preventDefault();
        const formData = new FormData();

        images.forEach((image, index) => {
            formData.append(`file[${index}]`, image);
        });

        try {
            const response = await fetch("/api/firebase", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                console.log("Files uploaded successfully");
                toast.success("Files uploaded successfully!", {
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
                console.error("Failed to upload files");
                toast.error("Failed to upload files!", {
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
            console.error("Error uploading files:", error);
            toast.error("Failed to upload files!", {
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

        setLoader(false);
        setImages([])
    };

    const getImages = async () => {
        setLoader(true);
        try {
            const response = await fetch("/api/firebase", {
                method: "GET",
            });

            if (response.ok) {
                const data = await response.json();
                const images = data.images;
                setFetchedPhotos(images);
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
        setModal(false);
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

    function formatFileSize(bytes) {
        if (bytes < 1024) {
            return bytes + " B";
        } else if (bytes < 1024 * 1024) {
            return (bytes / 1024).toFixed(2) + " KB";
        } else if (bytes < 1024 * 1024 * 1024) {
            return (bytes / (1024 * 1024)).toFixed(2) + " MB";
        } else {
            return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
        }
    }

    const openModal = (name) => {
        setModal(true);
        setdelId(name);
        console.log(name, delId);
    }


    useEffect(() => {
        getImages();
    }, [])

    return (
        <>
            <ToastContainer />
            {
                loader &&
                <div className="h-full flex items-center justify-center bg-black bg-opacity-50 fixed w-full z-10">
                    <Loader />
                </div>
            }
            <div className="w-full p-6">
                <form onSubmit={checkState} className="flex flex-col space-y-6 py-5 px-4 rounded-lg w-1/3 border border-solid border-white mx-auto">
                    <h2 className="w-full text-center text-2xl font-bold">Upload Images</h2>

                    <input multiple onChange={changeHandler} className="block w-full text-sm border rounded-lg cursor-pointer text-gray-400 focus:outline-none bg-gray-700 border-gray-600 placeholder-gray-400" id="file_input" type="file" />

                    <button disabled={images.length === 0} type="submit" className="bg-white text-black transition-all duration-300 hover:opacity-90 py-2 disabled:bg-gray-200 disabled:cursor-not-allowed">
                        Upload
                    </button>
                </form>
                <h2 className="w-full text-center text-2xl font-bold mt-6 mb-4">Your Uploads</h2>
                <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {fetchPhotos && fetchPhotos.length > 0 ? fetchPhotos.map((photo, i) => (
                        <div className="relative break-all p-2 border-2 rounded-xl border-white transition-all duration-300 hover:shadow-md hover:shadow-white" key={i}>
                            <img
                                key={i}
                                src={photo.src}
                                alt={'images'}
                                className="w-full h-60 object-cover object-top rounded-xl"
                            />
                            <p className="text-white font-bold my-2 truncate">Name : <span className="font-normal">{photo.name}</span></p>
                            <p className="text-white font-bold my-2 truncate">Size : <span className="font-normal">{formatFileSize(photo.size)}</span></p>
                            <p className="text-white font-bold my-2 truncate">Created at : <span className="font-normal">{new Date(photo.created_at).toLocaleString('en-US')}</span></p>
                            <p className="text-white font-bold my-2 truncate">Updated at : <span className="font-normal">{new Date(photo.updated_at).toLocaleString('en-US')}</span></p>
                            <button onClick={() => openModal(photo.name)}
                                className="absolute top-5 right-5 rounded-full p-1 text-white bg-red-500 cursor-pointer">
                                <MdDelete />
                            </button>
                        </div>
                    )) :
                        <div className="h-[60vh] flex items-center justify-center" />
                    }
                </div>
            </div>

            {
                modal == true &&
                <div className="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full h-screen  flex bg-black bg-opacity-50">
                    <div className="relative p-4 w-full max-w-md max-h-full">
                        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
                            <button onClick={()=>setModal(false)} type="button" className="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white">
                                <svg className="w-3 h-3" ariaHidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                                </svg>
                                <span className="sr-only">Close modal</span>
                            </button>
                            <div className="p-4 md:p-5 text-center">
                                <svg className="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" ariaHidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                                <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">Are you sure you want to delete this image?</h3>
                                <button onClick={() => deleteImage(delId)} type="button" className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center">
                                    Yes, I'm sure
                                </button>
                                <button onClick={()=>setModal(false)} type="button" className="py-2.5 px-5 ms-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
                                    No, cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            } 
        </>
    )
}

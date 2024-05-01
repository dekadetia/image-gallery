'use client';

import React, { useState } from 'react';
import Loader from '../../components/loader/loader';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Page() {
    const [images, setImages] = useState([]);
    const [loader, setLoader] = useState(false);
    
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

    return (
        <>
            <ToastContainer />
            <div className="h-screen grid place-items-center">
                {
                    loader &&
                    <div className="h-full flex items-center justify-center bg-black bg-opacity-50 fixed w-full">
                        <Loader/>
                    </div>
                }
                <form onSubmit={checkState} className="flex flex-col space-y-6 py-5 px-4 rounded-lg w-1/3 border border-solid border-white">
                    <h2 className="w-full text-center text-2xl font-bold">Upload Images</h2>

                    <input multiple onChange={changeHandler} className="block w-full text-sm border rounded-lg cursor-pointer text-gray-400 focus:outline-none bg-gray-700 border-gray-600 placeholder-gray-400" id="file_input" type="file" />

                    <button disabled={images.length === 0} type="submit" className="bg-white text-black transition-all duration-300 hover:opacity-90 py-2 disabled:bg-gray-200 disabled:cursor-not-allowed">
                        Upload
                    </button>
                </form>
            </div>
        </>
    )
}

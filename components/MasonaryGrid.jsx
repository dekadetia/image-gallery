"use client";
import { IKImage } from "imagekitio-react";
import { useState, useEffect, useRef } from "react";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";

import Footer from "./Footer";
import MoreImageLoader from "../components/MoreImageLoader/index";

import InfiniteScroll from "react-infinite-scroll-component";

// import { errorToast, successToast } from "../utils/toast";

export default function MasonaryGrid() {
  const descriptionTextAlign = "start";
  const descriptionMaxLines = 3;
  const isOpen = true;

  const [index, setIndex] = useState(-1);
  const [slides, setSlides] = useState([]);
  const [Images, setImages] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const wasCalled = useRef(false);

  const getImages = async (token) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-images`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ lastVisibleDocId: token }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const images = data.images;

        if (images.length === 0) {
          setHasMore(false); // Stop fetching if no more data
          return;
        }

        if (!data.nextPageToken) {
          console.log("nul found ", data.nextPageToken);
          setHasMore(false);
          // successToast("All images have been loaded!");
          setNextPageToken(null);
          return;
        } else {
          setImages((prevImages) => {
            const existingNames = new Set(prevImages.map((img) => img.name));
            const newImages = images.filter(
              (img) => !existingNames.has(img.name)
            );
            return [...prevImages, ...newImages];
          });
          setNextPageToken(data.nextPageToken);
        }

        const newSlides = images.map((photo) => {
          const width = 1080 * 4;
          const height = 1620 * 4;
          return {
            src: photo.src,
            width,
            height,
            title: `${photo.caption}`,
            description: photo.dimensions,
          };
        });

        setSlides((prevSlides) => [...prevSlides, ...newSlides]);
        // successToast("Images fetched successfuly!");
      } else {
        // errorToast("Failed to get files");
      }
    } catch (error) {
      console.log(error);
      // errorToast("Error fetching files");
    }
  };

  useEffect(() => {
    if (wasCalled.current) return;
    wasCalled.current = true;
    getImages(nextPageToken);
  });

  /*useEffect(() => {
        // Initialize Socket.IO connection when the component mounts
        socket = io(); // Automatically connects to the server

        socket.on('connect', () => {
            console.log('Connected to the server with ID:', socket.id);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from the server');
        });

        socket.on('upload', (data) => {
            console.log("Recieved from SERVER ::", data);

            setImages((prevImages) => [data, ...prevImages]);
            setSlides((prevSlides) => [data, ...prevSlides]);
        })

        // Cleanup: Disconnect when the component is unmounted
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);*/

  return (
    <>
      <div className="px-4 lg:px-16 pb-10">
        {/* Images */}
        <InfiniteScroll
          dataLength={Images.length}
          next={() => getImages(nextPageToken)}
          hasMore={hasMore}
          loader={<MoreImageLoader />}
          endMessage={<p className="text-center py-4 font-bold">You have seen it all!</p>}
        >
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px] place-items-center">
            {Images.map((photo, i) => (
              <div key={i}>
                <img 
                  alt={photo.name}
                  src={photo.src}
                  onClick={() => setIndex(i)}
                  className="aspect-[16/9] object-cover cursor-zoom-in"
                />
              </div>
            ))}
          </div>
        </InfiniteScroll>

        {/* Lightbox Component */}
        {slides && (
          <Lightbox
            plugins={[Captions]}
            index={index}
            slides={slides}
            open={index >= 0}
            close={() => setIndex(-1)}
            captions={{ isOpen, descriptionTextAlign, descriptionMaxLines }}
          />
        )}
      </div>

      <Footer />
    </>
  );
}

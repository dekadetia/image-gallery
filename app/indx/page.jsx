"use client"; 

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

import Lightbox from "yet-another-react-lightbox";

import Footer from "../../components/Footer";
import Fuse from 'fuse.js';
import { BsSortAlphaDown } from "react-icons/bs";
import { TbClockDown, TbClockUp } from "react-icons/tb";
import { RxCross1 } from "react-icons/rx";
import { FaMagnifyingGlass } from "react-icons/fa6";
import RootLayout from "../layout";
import Loader from "../../components/loader/loader";
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export default function Index() {
  const searchInputRef = useRef(null);
  const [isSorted, setSorted] = useState(false);
  const [index, setIndex] = useState(-1);
  const [slides, setSlides] = useState([]);
  const [Images, setImages] = useState([]);
  const [loader, __loader] = useState(true);
  const wasCalled = useRef(false);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("");

  const getImages = async (token) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-sorted-images`,
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
          setHasMore(false);
          return;
        }

        setNextPageToken(data.nextPageToken);
        setImages(images);

        const newSlides = images.map((photo) => {
          const width = 1080 * 4;
          const height = 1620 * 4;
          return {
            src: photo.src,
            width,
            height,
            title: `${photo.caption}`,
            description: photo.dimensions,
            director: photo.director || null,
            year: photo.year
          };
        });

        setSlides((prevSlides) => [...prevSlides, ...newSlides]);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    }

    __loader(false);
  };

  const sortImagesByYear = async () => {
    try {
      __loader(true);
      const sortedImages = await new Promise((resolve) => {
        const sorted = [...Images].sort((a, b) => parseInt(b.year) - parseInt(a.year));
        resolve(sorted);
      });

      setSorted(true);
      setImages(sortedImages);

      setSlides(sortedImages.map((photo) => ({
        src: photo.src,
        width: 1080 * 4,
        height: 1620 * 4,
        title: photo.caption,
        description: photo.dimensions,
      })));
    } catch (error) {
      console.error("Error sorting images:", error);
    } finally {
      setTimeout(() => __loader(false), 1500);
    }
  };

  const sortImagesOldestFirst = async () => {
    try {
      __loader(true);
      const sortedImages = await new Promise((resolve) => {
        const sorted = [...Images].sort((a, b) => parseInt(a.year) - parseInt(b.year));
        resolve(sorted);
      });

      setSorted(false);
      setImages(sortedImages);

      setSlides(sortedImages.map((photo) => ({
        src: photo.src,
        width: 1080 * 4,
        height: 1620 * 4,
        title: photo.caption,
        description: photo.dimensions,
      })));
    } catch (error) {
      console.error("Error sorting images:", error);
    } finally {
      setTimeout(() => __loader(false), 1500);
    }
  };

  const sortImagesAlphabetically = async () => {
    try {
      __loader(true);
      const sortedImages = await new Promise((resolve) => {
        const sorted = [...Images].sort((a, b) =>
          a.alphaname.toLowerCase().localeCompare(b.alphaname.toLowerCase())
        );
        resolve(sorted);
      });

      setImages(sortedImages);

      setSlides(sortedImages.map((photo) => ({
        src: photo.src,
        width: 1080 * 4,
        height: 1620 * 4,
        title: photo.caption,
        description: photo.dimensions,
      })));
    } catch (error) {
      console.error("Error sorting images:", error);
    } finally {
      setTimeout(() => __loader(false), 1500);
    }
  };

  const openLightboxByImage = (photo) => {
    const matchedIndex = slides.findIndex((slide) => slide.src === photo.src);
    if (matchedIndex !== -1) {
      setIndex(matchedIndex);
    }
  };

  const rawQuery = searchQuery.trim().toLowerCase();
  const queryParts = rawQuery.split(/\s+/);

  let filteredImages;

  if (!rawQuery) {
    filteredImages = Images;
  } else if (/^\d{4}$/.test(rawQuery)) {
    filteredImages = Images.filter(img => String(img.year) === rawQuery);
  } else if (/^\d{3}$/.test(rawQuery) || /^\d{3}x$/.test(rawQuery) || /^\d{4}s$/.test(rawQuery)) {
    const decadePrefix = rawQuery.slice(0, 3);
    filteredImages = Images.filter(img =>
      String(img.year).startsWith(decadePrefix)
    );
  } else {
    const fuse = new Fuse(Images, {
      keys: [
        { name: 'caption', weight: 0.6 },
        { name: 'alphaname', weight: 0.4 }
      ],
      threshold: 0.3,
      distance: 200,
      includeScore: true
    });
    const fuseResults = fuse.search(rawQuery).map(r => r.item);

    const autocompleteResults = Images.filter(img => {
      const dir = img.director?.toLowerCase() || '';
      const dim = img.dimensions?.slice(0, 6).toLowerCase() || '';

      return queryParts.every(part =>
        dir.split(/\s+/).some(word => word.startsWith(part)) ||
        dim.startsWith(part)
      );
    });

    const seen = new Set();
    filteredImages = [...fuseResults, ...autocompleteResults].filter(img => {
      const key = img.src;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  useEffect(() => {
    if (wasCalled.current) return;
    wasCalled.current = true;

    __loader(true);
    getImages(nextPageToken);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 0);
    }
  }, [searchOpen]);

  // 🩹 Delayed MutationObserver to remove title="Close"
  useEffect(() => {
    const timeout = setTimeout(() => {
      const observer = new MutationObserver(() => {
        document.querySelectorAll('.yarl__button[title="Close"]').forEach(btn => {
          btn.removeAttribute('title');
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });

      return () => observer.disconnect();
    }, 500); // Wait 500ms for Lightbox to mount

    return () => clearTimeout(timeout);
  }, []);

  return (
    <RootLayout>
      {/* ✅ Your unchanged JSX remains here */}
    </RootLayout>
  );
}

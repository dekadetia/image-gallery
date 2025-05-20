'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { RxCross1 } from 'react-icons/rx'
import { BsSortAlphaDown } from 'react-icons/bs'
import { TbClockDown } from 'react-icons/tb'
import Lightbox from 'yet-another-react-lightbox'
import Footer from '../../components/Footer'
import MoreImageLoader from '../../components/MoreImageLoader/index'
import { TbClockUp } from 'react-icons/tb'
import RootLayout from '../layout'
import InfiniteScroll from 'react-infinite-scroll-component'
import Loader from '../../components/loader/loader'
import { FaMagnifyingGlass } from "react-icons/fa6";
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export default function Order() {
  const [isSorted, setSorted] = useState(false)
  const [index, setIndex] = useState(-1)
  const [slides, setSlides] = useState([])
  const [Images, setImages] = useState([])
  const wasCalled = useRef(false)
  const [nextPageToken, setNextPageToken] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [loader, __loader] = useState(true)
  const [sort_loader, __sort_loader] = useState(true)
  const [check, __check] = useState(false)

  const [order_key, __order_key] = useState(null)
  const [order_value, __order_value] = useState(null)
  const [order_key_2, __order_key_2] = useState(null)
  const [order_value_2, __order_value_2] = useState(null)

  // Searching
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('');
  const debounceRef = useRef(null);


  const getImages = async token => {
    __order_key(null)
    __order_value(null)
    __order_key_2(null)
    __order_value_2(null)
    __check(false)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-ordered-images`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            order_by_key: 'alphaname',
            order_by_value: 'asc',
            size_limit: 99,
            lastVisibleDocId: token
          })
        }
      )

      if (response.ok) {
        const data = await response.json()
        const images = data.images

        if (images.length === 0) {
          setHasMore(false) // Stop fetching if no more data
          return
        }

        setNextPageToken(data.nextPageToken)
        setImages(prevImages => [...prevImages, ...images])
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

        setSlides(prevSlides => [...prevSlides, ...newSlides])
      } else {
        console.error('Failed to get files')
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    }
    __loader(false)
  }

  const sortImages = async (
    order_key,
    order_value,
    order_key_2,
    order_value_2,
    size,
    token
  ) => {
    try {
      __order_key(o => order_key)
      __order_value(o => order_value)
      __order_key_2(o => order_key_2)
      __order_value_2(o => order_value_2)

      __sort_loader(true)

      setSorted(!isSorted)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-ordered-images`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            order_by_key: order_key,
            order_by_value: order_value,
            order_by_key_2: order_key_2,
            order_by_value_2: order_value_2,
            size_limit: size,
            lastVisibleDocId: token
          })
        }
      )

      if (response.ok) {
        const data = await response.json()
        const images = data.images

        if (images.length === 0) {
          setHasMore(false) // Stop fetching if no more data
          return
        }

        setNextPageToken(data.nextPageToken)
        setImages(prevImages => [...prevImages, ...images])

        const newSlides = images.map(photo => {
          const width = 1080 * 4
          const height = 1620 * 4
          return {
            src: photo.src,
            width,
            height,
            title: `${photo.caption}`,
            description: photo.dimensions
          }
        })

        setSlides(prevSlides => [...prevSlides, ...newSlides])
      } else {
        console.error('Failed to get files')
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      __sort_loader(false)
      __loader(false);
    }
  }

  const loadMoreByCondition = () => {
    if (order_key == 'alphaname' && order_value == 'asc') {
      sortImages(order_key, order_value, null, null, 99, nextPageToken)
    } else if (
      order_key == 'year' &&
      order_value == 'desc' &&
      order_key_2 == 'alphaname' &&
      order_value_2 == 'asc'
    ) {
      sortImages(
        order_key,
        order_value,
        order_key_2,
        order_value_2,
        99,
        nextPageToken
      )
    } //else if (order_key == 'year' && order_value == 'asc') {
    else if (
      order_key == 'year' &&
      order_value == 'asc' &&
      order_key_2 == 'alphaname' &&
      order_value_2 == 'asc'
    ) {
      //sortImages(order_key, order_value, null, null, 99, nextPageToken)
      sortImages(
        order_key,
        order_value,
        order_key_2,
        order_value_2,
        99,
        nextPageToken
      )
    } else {
      getImages(nextPageToken)
    }
  }

  const clearValues = () => {
    return new Promise(resolve => {
      setImages([])
      setNextPageToken(null)
      setSlides([])
      setHasMore(true)
      resolve()
    })
  }

  useEffect(() => {
    if (wasCalled.current) return
    wasCalled.current = true

    __loader(true)
    getImages(nextPageToken)

    setSorted(true)
  })

  // Searching UseEffect
  // 🔁 Debounced search on searchQuery
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const query = searchQuery.trim().toLowerCase();

      if (!query) {
        // If search is cleared, reload sorted/paginated data
        clearValues().then(() => {
          getImages(null);
        });
        return;
      }

      // Local filter first
      const local = Images.filter(img =>
        Object.values(img)
          .filter(v => typeof v === 'string' || typeof v === 'number')
          .some(v => v.toString().toLowerCase().includes(query))
      );

      if (local.length > 0) {
        setImages(local);
        const newSlides = local.map(photo => ({
          src: photo.src,
          width: 1080 * 4,
          height: 1620 * 4,
          title: photo.caption,
          description: photo.dimensions,
        }));
        setSlides(newSlides);
        return;
      }

      // If no local match, query backend
      try {
        __loader(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/firebase/search-ordered-images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ queryText: query })
        });

        if (response.ok) {
          const data = await response.json();
          setImages(data.results);

          const newSlides = data.results.map(photo => ({
            src: photo.src,
            width: 1080 * 4,
            height: 1620 * 4,
            title: photo.caption,
            description: photo.dimensions
          }));
          setSlides(newSlides);
        }
      } catch (err) {
        console.error("Remote search failed:", err);
      } finally {
        __loader(false);
      }
    }, 300);
  }, [searchQuery]);

  return (
    <RootLayout>
      {/* Navigation */}
      <div className='w-full flex justify-center items-center py-9'>
        <div className='w-full grid place-items-center space-y-6'>
          <Link href={'/'}>
            <img
              src='/assets/logo.svg'
              className='object-contain w-40'
              alt=''
            />
          </Link>
          <div className="h-12 overflow-hidden w-full grid place-items-center">
            {
              searchOpen ? (
                // Showing Search Input
                <div className="w-full lg:w-[32.25%] flex justify-center mt-2 mb-6 px-4" >
                  <div className="relative w-full">
                    <input
                      type="text"
                      placeholder=""
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-1.5 pr-10 pt-[.45rem] pb-[.5rem] border-b border-b-white focus:outline-none text-sm bg-transparent"
                    />
                    <div onClick={() => setSearchOpen(false)} className="cursor-pointer">
                      <RxCross1 className="absolute right-3 top-2.5 text-white" />
                    </div>
                  </div>
                </div>
                // Closed Search && showing navigation panel
              ) :
                <div className='flex gap-[2.225rem] items-center py-1.5'>
                  <BsSortAlphaDown
                    className='cursor-pointer transition-all duration-200 hover:scale-105 text-2xl'
                    onClick={() => {
                      const len = Images?.length
                      clearValues().then(res => {
                        __loader(true);
                        sortImages('alphaname', 'asc', null, null, len, null)
                      })
                    }}
                  />

                  <div onClick={() => setSearchOpen(true)}>
                    <FaMagnifyingGlass className="cursor-pointer transition-all duration-200 hover:scale-105 text-xl" />
                  </div>

                  {!isSorted ? (
                    <TbClockDown
                      className='cursor-pointer transition-all duration-200 hover:scale-105 text-2xl'
                      onClick={() => {
                        const len = Images?.length
                        clearValues().then(res => {
                          __loader(true);
                          sortImages('year', 'desc', 'alphaname', 'asc', len, null)
                        })
                      }}
                    />
                  ) : (
                    <TbClockUp
                      className='cursor-pointer transition-all duration-200 hover:scale-105 text-2xl'
                      onClick={() => {
                        const len = Images?.length
                        clearValues().then(res => {
                          __loader(true);
                          sortImages('year', 'asc', 'alphaname', 'asc', len, null)
                        })
                      }}
                    />
                  )}
                </div>
            }
          </div>
        </div>
      </div>

      {!loader ? (
        <div className='px-4 lg:px-16 pb-10'>
          <InfiniteScroll
            dataLength={Images.length}
            next={() => loadMoreByCondition()}
            hasMore={hasMore}
            loader={<MoreImageLoader />}
          >
            <div className='w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px] place-items-center'>
              {Images.map((photo, i) => (
                <div key={i}>
                  <img
                    alt={photo.name}
                    src={photo.src}
                    onClick={() => setIndex(i)}
                    className='aspect-[16/9] object-cover cursor-zoom-in'
                  />
                </div>
              ))}
            </div>
          </InfiniteScroll>

          {/* Lightbox Component */}
          {slides && (
            <Lightbox
              index={index}
              slides={slides}
              open={index >= 0}
              close={() => setIndex(-1)}
              render={{
                slideFooter: ({ slide }) => (
                  <div className="w-full text-left text-sm space-y-1 lg:pt-2 pb-4 text-white px-0 pt-0 lg:px-12">
                    {slide.title && (
                      <div className="yarl__slide_title">{slide.title}</div>
                    )}
                    <div className={cn("!space-y-0", slide.director && "!mb-5")}>
                      {slide.director && (
                        <div className="yarl__slide_description !text-[#99AABB]">
                          <span className="font-medium">{slide.director}</span>
                        </div>
                      )}
                      {slide.description && (
                        <div className="yarl__slide_description">{slide.description}</div>
                      )}
                    </div>
                  </div>
                )
              }}
            />
          )}
        </div>
      ) : (
        <Loader />
      )}

      {!loader && <Footer />}
    </RootLayout>
  )
}

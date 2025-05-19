'use client'

import { IKImage } from 'imagekitio-react'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { RxCaretSort, RxCross1 } from 'react-icons/rx'
import { BsSortAlphaDown } from 'react-icons/bs'
import { TbClockDown } from 'react-icons/tb'
import Lightbox from 'yet-another-react-lightbox'
import Captions from 'yet-another-react-lightbox/plugins/captions'
import Footer from '../../components/Footer'
import MoreImageLoader from '../../components/MoreImageLoader/index'
import { TbClockUp } from 'react-icons/tb'
import RootLayout from '../layout'
import InfiniteScroll from 'react-infinite-scroll-component'
import Loader from '../../components/loader/loader'
import { FaMagnifyingGlass } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";

export default function Order() {
  const descriptionTextAlign = 'end'
  const descriptionMaxLines = 3
  const isOpen = true

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

          {
            searchOpen ? (
              // Showing Search Input
              <div className="w-[80%] lg:w-1/2 flex justify-center mt-2 mb-6 px-4" >
                <div className="relative w-full max-w-md">
                  <input
                    type="text"
                    placeholder="Search by name, year, or caption..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-1.5 pr-10 py-2 border-b border-b-white focus:outline-none text-sm bg-transparent"
                  />
                  <div onClick={() => setSearchOpen(false)} className="cursor-pointer">
                    <RxCross1 className="absolute right-3 top-2.5 text-white" />
                  </div>
                </div>
              </div>
              // Closed Search && showing navigation panel
            ) :
              <div className='flex gap-8 items-center'>
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
              plugins={[Captions]}
              index={index}
              slides={slides}
              open={index >= 0}
              close={() => setIndex(-1)}
              captions={{ isOpen, descriptionTextAlign, descriptionMaxLines }}
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

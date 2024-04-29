import {
  image1,
  image2,
  image3,
  image4,
  image5,
  image6,
  image7,
  image8,
  image9,
  image10,
  image11,
  image12,
  image13,
  image14,
  image15,
  image16,
  image17,
} from "../utils/constants";

const photos = [
  {
    image: image1,
    width: 1080,
    height: 1620,
    description: "Vicko Mozara Dubravica, Croatia",
  },
  {
    image: image2,
    width: 1080,
    height: 1620,
  },
  {
    image: image3,
    width: 1080,
    height: 1620,
  },
  {
    image: image4,
    width: 1080,
    height: 1620,
  },
  {
    image: image5,
    width: 1080,
    height: 1620,
  },
  {
    image: image6,
    width: 1080,
    height: 1620,
  },
  {
    image: image7,
    width: 1080,
    height: 1620,
  },
  {
    image: image8,
    width: 1080,
    height: 1620,
  },
  {
    image: image9,
    width: 1080,
    height: 1620,
  },
  {
    image: image10,
    width: 1080,
    height: 1620,
  },
  {
    image: image11,
    width: 1080,
    height: 1620,
  },
  {
    image: image12,
    width: 1080,
    height: 1620,
  },
  {
    image: image13,
    width: 1080,
    height: 1620,
  },
  {
    image: image14,
    width: 1080,
    height: 1620,
  },
  {
    image: image15,
    width: 1080,
    height: 1620,
  },
  {
    image: image16,
    width: 1080,
    height: 1620,
  },
  {
    image: image17,
    width: 1080,
    height: 1620,
  },
];

const slides = photos.map((photo) => {
  const width = photo.width * 4;
  const height = photo.height * 4;
  return {
    src: photo.image.src,
    width,
    height,
    description:photo.description,
  };
});

export default slides;

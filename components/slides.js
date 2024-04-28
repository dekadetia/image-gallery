import { image1, image2, image3, image4, image5 } from "../utils/constants";

const photos = [
  {
    image: image1,
    width: 1080,
    height: 1620,
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
];

const slides = photos.map((photo) => {
  const width = photo.width * 4;
  const height = photo.height * 4;
  return {
    src: photo.image.src,
    width,
    height,    
  };
});

export default slides;

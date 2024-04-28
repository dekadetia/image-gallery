import { createGlobalState } from "react-hooks-global-state";
import { image1, image2, image3, image4, image5 } from "./constants";

const initialState = {
  images: [
    { id: 1, imageSrc: image1 },
    { id: 2, imageSrc: image2 },
    { id: 3, imageSrc: image3 },
    { id: 4, imageSrc: image4 },
    { id: 5, imageSrc: image5 },
  ],
};

export const { useGlobalState } = createGlobalState(initialState);

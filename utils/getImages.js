import { GET_ALL_IMAGES_A_Z, GET_RANDOM_IMAGES, GET_ALL_IMAGES } from "../app/api/firebase/fetch/route";

const getImagesAPI = async (pageToken) => {
  const response = await fetch(
    `/api/firebase/fetch${pageToken ? `?pageToken=${pageToken}` : ""}`,
    {
      method: "GET",
    }
  );
  return response;
};

const getAllImagesA_Z = async () => {
  const response = GET_ALL_IMAGES_A_Z();
  return response;
};

const getRandomImages = async () => {
  const response = GET_RANDOM_IMAGES();
  return response;
};

const getAllImages = async () => {
  const response = GET_ALL_IMAGES();
  return response;
};

export { getImagesAPI, getAllImagesA_Z, getRandomImages, getAllImages };

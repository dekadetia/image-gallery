import { GET_ALL_IMAGES } from "../app/api/firebase/route";

const getImagesAPI = async (pageToken) => {
  const response = await fetch(`/api/firebase${pageToken ? `?pageToken=${pageToken}` : ''}`, {
    method: "GET",
  });
  return response
};

const getAllImages = async () => {
  const response = GET_ALL_IMAGES();
  return response;
};

export { getImagesAPI, getAllImages };

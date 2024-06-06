const getImagesAPI = async (pageToken) => {
  const response = await fetch(`/api/firebase${pageToken ? `?pageToken=${pageToken}` : ''}`, {
    method: "GET",
  });
  return response
};

export { getImagesAPI };

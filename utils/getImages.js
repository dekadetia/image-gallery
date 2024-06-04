const getImagesAPI = async () => {
  const response = await fetch(`/api/firebase`, {
    method: "GET",
  });
  return response
};

export { getImagesAPI };

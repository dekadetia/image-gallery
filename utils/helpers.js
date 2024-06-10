
export function outsideClickHandler(event) {
  const clickedElement = event.target;
  const isClickInsideContainer = imagesContainer.contains(clickedElement);

  if (!isClickInsideContainer) {
  }
}

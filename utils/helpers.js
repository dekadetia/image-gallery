

export function outsideClickHandler(event) {
  const clickedElement = event.target;
  const isClickInsideContainer = imagesContainer.contains(clickedElement);

  if (!isClickInsideContainer) {
  }
}

// export function cn(...inputs) {
//   return twMerge(clsx(inputs));
// }

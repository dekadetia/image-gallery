import { ref, getDownloadURL, uploadBytesResumable, listAll, deleteObject, getMetadata, getStorage, list, updateMetadata } from 'firebase/storage';
import { storage } from '../../../../firebase/firebase-config';
import { NextResponse } from "next/server";

// To handle a GET request to /api/all-images
export async function GET_ALL_IMAGES_A_Z(request) {
  const listRef = ref(storage, 'images');

  try {
    const res = await listAll(listRef);

    const imagesWithData = await Promise.all(
      res.items.map(async (itemRef) => {
        const downloadURL = await getDownloadURL(itemRef);
        const metadata = await getMetadata(itemRef);
        return {
          src: downloadURL,
          name: itemRef.name,
          created_at: metadata.timeCreated,
          updated_at: metadata.updated,
          size: metadata.size,
          caption: metadata.customMetadata.caption || '',
          director: metadata.customMetadata.director || '',
          photographer: metadata.customMetadata.photographer || '',
          year: metadata.customMetadata.year || '',
          alphaname: metadata.customMetadata.alphaname || '',
          contentType: metadata.contentType,
          dimensions: metadata.customMetadata.dimensions || '',
        };
      })
    );

    imagesWithData.sort((a, b) => {
      const nameA = a.alphaname.toLowerCase(); // Convert to lowercase for case-insensitive sorting
      const nameB = b.alphaname.toLowerCase();
      return nameA.localeCompare(nameB); // Sort alphabetically (A to Z)
    });

    return NextResponse.json({ images: imagesWithData, message: 'Successfully fetched all images' }, { status: 200 });

  } catch (error) {
    console.error('Error loading all images:', error);
    return NextResponse.json({ error: 'Error fetching all images' }, { status: 400 });
  }
}

// To handle a GET request to /api/all-images
export async function GET_RANDOM_IMAGES(request) {
  const listRef = ref(storage, 'images');

  try {
    const res = await listAll(listRef);

    const imagesWithData = await Promise.all(
      res.items.map(async (itemRef) => {
        const downloadURL = await getDownloadURL(itemRef);
        const metadata = await getMetadata(itemRef);
        return {
          src: downloadURL,
          name: itemRef.name,
          created_at: metadata.timeCreated,
          updated_at: metadata.updated,
          size: metadata.size,
          caption: metadata.customMetadata.caption || '',
          director: metadata.customMetadata.director || '',
          photographer: metadata.customMetadata.photographer || '',
          year: metadata.customMetadata.year || '',
          alphaname: metadata.customMetadata.alphaname || '',
          contentType: metadata.contentType,
          dimensions: metadata.customMetadata.dimensions || '',
        };
      })
    );

    for (let currentIndex = imagesWithData.length - 1; currentIndex > 0; currentIndex--) {
      const randomIndex = Math.floor(Math.random() * (currentIndex + 1));
      [imagesWithData[currentIndex], imagesWithData[randomIndex]] = [imagesWithData[randomIndex], imagesWithData[currentIndex]];
    }

    return NextResponse.json({ images: imagesWithData, message: 'Successfully fetched all images' }, { status: 200 });

  } catch (error) {
    console.error('Error loading all images:', error);
    return NextResponse.json({ error: 'Error fetching all images' }, { status: 400 });
  }
}

// To handle a GET request to /api/all-images
export async function GET_ALL_IMAGES(request) {
  const listRef = ref(storage, 'images');

  try {
    //const res = await listAll(listRef);

    const res = await list(listRef, { maxResults: 30 });
    
    const imagesWithData = await Promise.all(
      res.items.map(async (itemRef) => {
        const downloadURL = await getDownloadURL(itemRef);
        const metadata = await getMetadata(itemRef);
        return {
          src: downloadURL,
          name: itemRef.name,
          created_at: metadata.timeCreated,
          updated_at: metadata.updated,
          size: metadata.size,
          caption: metadata.customMetadata.caption || '',
          director: metadata.customMetadata.director || '',
          photographer: metadata.customMetadata.photographer || '',
          year: metadata.customMetadata.year || '',
          alphaname: metadata.customMetadata.alphaname || '',
          contentType: metadata.contentType,
          dimensions: metadata.customMetadata.dimensions || '',
        };
      })
    );

    return NextResponse.json({ images: imagesWithData, message: 'Successfully fetched all images' }, { status: 200 });

  } catch (error) {
    console.error('Error loading all images:', error);
    return NextResponse.json({ error: 'Error fetching all images' }, { status: 400 });
  }
}

// To handle a GET request to /api
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const pageToken = searchParams.get('pageToken') || null;
  const listRef = ref(storage, 'images');

  try {
    const res = pageToken
      ? await list(listRef, { maxResults: 30, pageToken })
      : await list(listRef, { maxResults: 30 });

    const imagesWithData: any = await Promise.all(
      res.items.map(async (itemRef) => {
        const downloadURL = await getDownloadURL(itemRef);
        const metadata: any = await getMetadata(itemRef);
        return {
          src: downloadURL,
          name: itemRef.name,
          created_at: metadata.timeCreated,
          updated_at: metadata.updated,
          size: metadata.size,
          caption: metadata.customMetadata.caption ? metadata.customMetadata.caption : '',
          director: metadata.customMetadata.director ? metadata.customMetadata.director : '',
          photographer: metadata.customMetadata.photographer ? metadata.customMetadata.photographer : '',
          year: metadata.customMetadata.year ? metadata.customMetadata.year : '',
          alphaname: metadata.customMetadata.alphaname ? metadata.customMetadata.alphaname : '',
          contentType: metadata.contentType,
          dimensions: metadata.customMetadata.dimensions ? metadata.customMetadata.dimensions : '',
        };
      })
    );

    return NextResponse.json({ images: imagesWithData, nextPageToken: res.nextPageToken || null, message: 'successfully fetched' }, { status: 200 });

  } catch (error) {
    console.error('Error loading images:', error);
    return NextResponse.json({ error: 'Error fetching images' }, { status: 400 });
  }
}






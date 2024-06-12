import { ref, getDownloadURL, uploadBytesResumable, listAll, deleteObject, getMetadata, getStorage, list, updateMetadata } from 'firebase/storage';
import { storage } from '../../../firebase/firebase-config';
import { NextResponse } from "next/server";

// To handle a GET request to /api/all-images
export async function GET_ALL_IMAGES(request) {
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

    // Sort images by year in descending order
    imagesWithData.sort((a, b) => {
      const yearA = a.year ? parseInt(a.year) : 0;
      const yearB = b.year ? parseInt(b.year) : 0;
      return yearB - yearA;
    });

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
          director:  metadata.customMetadata.director ? metadata.customMetadata.director : '',
          photographer:  metadata.customMetadata.photographer ? metadata.customMetadata.photographer : '',
          year:  metadata.customMetadata.year ? metadata.customMetadata.year : '',
          alphaname :  metadata.customMetadata.alphaname ? metadata.customMetadata.alphaname : '',
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

// To handle a POST request to /api
export async function POST(request, response) {
  const formData = await request.formData();
  const caption = formData.get('caption');
  const director = formData.get('director');
  const photographer = formData.get('photographer');
  const year = formData.get('year');
  const alphaname = formData.get('alphaname');
  const dimensions = formData.get('dimensions');

  formData.forEach(async (data: any, index: any) => {
    if (index != 'caption') {
      const file = data;
      if (!file) {
        return NextResponse.json({ error: "No files received." }, { status: 400 });
      }
      const metadata = {
        customMetadata: {
          caption: caption,
          director: director,
          photographer: photographer,
          year: year,
          alphaname: alphaname,
          dimensions: dimensions,
        },
      };
      const storageRef = ref(storage, `images/${file.name}`);
      await uploadBytesResumable(storageRef, file, metadata);
    }
  });

  return NextResponse.json({ message: 'File uploaded successfully' }, { status: 200 });
}

// To handle a POST request to /api
export async function PUT(request, response) {
  const formData = await request.formData();
  const filename = formData.get('file');
  const caption = formData.get('caption');
  const director = formData.get('director');
  const photographer = formData.get('photographer');
  const year = formData.get('year');
  const alphaname = formData.get('alphaname');
  const dimensions = formData.get('dimensions');

  const metadata = {
    customMetadata: {
      caption: caption,
      director: director,
      photographer: photographer,
      year: year,
      alphaname: alphaname,
      dimensions: dimensions,
    },
  };
  const storageRef = ref(storage, `images/${filename}`);
  await updateMetadata(storageRef, metadata);

  return NextResponse.json({ message: 'File uploaded successfully' }, { status: 200 });
}

// To handle a DELETE request to /api
export async function DELETE(request) {
  const formData = await request.formData();
  const fileName = formData.get('file_name');

  const delRef = ref(storage, `images/${fileName}`);

  try {
    await deleteObject(delRef);
    return NextResponse.json({ message: 'succesfully deleted' }, { status: 200 });
  } catch {
    return NextResponse.json({ message: 'error deleting file' }, { status: 400 });
  }
}
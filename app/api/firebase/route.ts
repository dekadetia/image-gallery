import { ref, getDownloadURL, uploadBytesResumable, listAll, deleteObject, getMetadata, getStorage, list, updateMetadata } from 'firebase/storage';
import { storage } from '../../../firebase/firebase-config';
import { NextResponse } from "next/server";

// To handle a GET request to /api
export async function GET(request) {
  const listRef = ref(storage, 'images');

  try {
    const res = await list(listRef, { maxResults: 30 });
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
        };
      })
    );

    // const images: { src: string, name: string, uploadDate: string }[] = imagesWithDates.sort((a, b) => {
    //   return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
    // });

    return NextResponse.json({ images: imagesWithData, message: 'successfully fetched' }, { status: 200 });

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

  const metadata = {
    customMetadata: {
      caption: caption,
      director: director,
      photographer: photographer,
      year: year,
      alphaname: alphaname,
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
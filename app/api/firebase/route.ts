import { ref, getDownloadURL, uploadBytesResumable, listAll, deleteObject, getMetadata } from 'firebase/storage';
import { storage } from '../../../firebase/firebase-config';
import { NextResponse } from "next/server";

// To handle a GET request to /api
export async function GET(request) {
  const listRef = ref(storage, 'images');

  try {
    const res = await listAll(listRef);
    const imagesWithDates = await Promise.all(
      res.items.map(async (itemRef) => {
        const downloadURL = await getDownloadURL(itemRef);
        const metadata = await getMetadata(itemRef);
        return {
          src: downloadURL,
          name: itemRef.name,
          uploadDate: metadata.timeCreated, 
        };
      })
    );

    const images = imagesWithDates.sort((a:any, b:any) => new Date(b.uploadDate) - new Date(a.uploadDate));

    return NextResponse.json({ images: images, message: 'successfully fetched' }, { status: 200 });

  } catch (error) {
    console.error('Error loading images:', error);
    return NextResponse.json({ error: 'Error fetching images' }, { status: 400 });
  }
}

// To handle a POST request to /api
export async function POST(request, response) {
  const formData = await request.formData();

  formData.forEach(async (data: any, index: any) => {

    const file = data;
    if (!file) {
      return NextResponse.json({ error: "No files received." }, { status: 400 });
    }

    const storageRef = ref(storage, `images/${file.name}`);
    await uploadBytesResumable(storageRef, file);
  });

  return NextResponse.json({ message: 'File uploaded successfully' }, { status: 200 });
}

// To handle a DELETE request to /api
export async function DELETE(request) {
  const formData = await request.formData();
  const fileName = formData.get('file_name');

  const delRef = ref(storage, `images/${fileName}`);

  try{
    await deleteObject(delRef);
    return NextResponse.json({ message: 'succesfully deleted' }, { status: 200 });
  }catch{
    return NextResponse.json({ message: 'error deleting file' }, { status: 400 });
  }
}
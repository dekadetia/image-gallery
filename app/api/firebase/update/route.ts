import { ref, getDownloadURL, uploadBytesResumable, listAll, deleteObject, getMetadata, getStorage, list, updateMetadata } from 'firebase/storage';
import { storage } from '../../../../firebase/firebase-config';
import { NextResponse } from "next/server";
import io from 'socket.io-client';

const socket = io("http://localhost:3000");

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

    const downloadURL = await getDownloadURL(storageRef);
    const metadata_uploaded = await getMetadata(storageRef);

    const data = {
      src: downloadURL,
      name: filename,
      created_at: metadata_uploaded.timeCreated,
      updated_at: metadata_uploaded.updated,
      size: metadata_uploaded.size,
      caption: caption,
      director: director,
      photographer: photographer,
      year: year,
      alphaname: alphaname,
      contentType: metadata_uploaded.contentType,
      dimensions: dimensions,
    }
    
    socket.emit('image_updated', data);
    return NextResponse.json({ message: 'File uploaded successfully' }, { status: 200 });
  }
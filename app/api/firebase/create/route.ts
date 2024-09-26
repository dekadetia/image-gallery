import { ref, getDownloadURL, uploadBytesResumable, listAll, deleteObject, getMetadata, getStorage, list, updateMetadata } from 'firebase/storage';
import { storage } from '../../../../firebase/firebase-config';
import { NextResponse } from "next/server";
import io from 'socket.io-client';

const socket = io("http://localhost:3000");

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

            const downloadURL = await getDownloadURL(storageRef);
            const metadata_uploaded = await getMetadata(storageRef);

            const file_info = {
                src: downloadURL,
                name: file.name,
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

            socket.emit('upload', file_info);
        }
    });

    return NextResponse.json({ message: 'File uploaded successfully' }, { status: 200 });
}
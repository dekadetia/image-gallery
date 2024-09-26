import { ref, getDownloadURL, uploadBytesResumable, listAll, deleteObject, getMetadata, getStorage, list, updateMetadata } from 'firebase/storage';
import { storage } from '../../../../firebase/firebase-config';
import { NextResponse } from "next/server";
import io from 'socket.io-client';

const socket = io("http://localhost:3000");

// To handle a DELETE request to /api
export async function DELETE(request) {
    const formData = await request.formData();
    const fileName = formData.get('file_name');

    const delRef = ref(storage, `images/${fileName}`);

    try {
        await deleteObject(delRef);
        // socket.emit('image_deleted');

        return NextResponse.json({ message: 'succesfully deleted' }, { status: 200 });
    } catch {
        return NextResponse.json({ message: 'error deleting file' }, { status: 400 });
    }
}
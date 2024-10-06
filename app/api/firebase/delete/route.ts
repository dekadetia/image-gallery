import { ref, getDownloadURL, uploadBytesResumable, listAll, deleteObject, getMetadata, getStorage, list, updateMetadata } from 'firebase/storage';
import { storage } from '../../../../firebase/firebase-config';
import { NextResponse } from "next/server";

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
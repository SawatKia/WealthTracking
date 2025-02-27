import { useState } from 'react';
import axios from 'axios';
import api from "./axiosInstance";
import { Platform } from 'react-native';

interface ImageUri {
  uri: string;
  name: string;
  type: string;
}

export const useSlip = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sendSlip = async (imageUris: ImageUri[]): Promise<any> => {
    console.log('Sending slip...', imageUris);
    if (!imageUris || imageUris.length === 0) {
      console.error('No images selected.');
      setError('No images selected.');
      return;
    }

    const formData = new FormData();
    // Append each image to the FormData
    imageUris.forEach((image, i) => {
      formData.append('imageFile', {
        uri: Platform.OS === 'android' ? image.uri : image.uri.replace('file://', ''),
        name: `slip${Date.now()}.jpg`,
        type: 'image/jpeg', // it may be necessary in Android.
      }as any);
    });

    setLoading(true);
    setError(null); // Reset error state before making the API call
    console.log('Uploading images...', formData);
    try {
        const response = await api.post('slip/verify', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',  // Ensure multipart for file uploads
            },
      
      });

      // Handle success
      console.log('Upload Successful', response.data);
      return response.data;
    } catch (error: any) {
      // Handle error
      const errorMessage = error.response?.data?.message || error.message || 'Upload Failed';
      setError(errorMessage);
      console.error('Upload Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { sendSlip, loading, error };
};
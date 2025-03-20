import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

export default function ImageUploadScreen() {
  const [imageUris, setImageUris] = useState<{ uri: string; name: string; type: string }[]>([]);
  const API_URL = 'http://localhost:3000/slip/'; // Update to your backend URL
  const AUTH_TOKEN = 'your-auth-token-here'; // Replace with your actual token

  // Function to pick images
  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const imageList = result.assets.map((asset) => ({
        uri: asset.uri,
        name: `slip${Date.now()}.jpg`, // Unique name
        type: 'image/jpeg',
      }));

      setImageUris(imageList);
    }
  };

  // Function to upload images
  const uploadImages = async () => {
    if (imageUris.length === 0) {
      Alert.alert('No image selected', 'Please select an image first.');
      return;
    }
    console.log(imageUris)
    
    const formData = new FormData();
    imageUris.forEach((image, index) => {
      formData.append('imageFile', {
        uri: image.uri,
        name: image.name,
        type: image.type,
      } as any); // `as any` is required for React Native FormData
    });
    console.log(formData)

    // try {
    //   const response = await axios.post(API_URL, formData, {
    //     headers: {
    //       'Accept': 'application/json',
    //       'Authorization': `Bearer ${AUTH_TOKEN}`,
    //       'Content-Type': 'multipart/form-data',
    //     },
    //   });

    //   Alert.alert('Upload Successful', `Response: ${JSON.stringify(response.data)}`);
    // } catch (error) {
    //   Alert.alert('Upload Failed', `Error: ${error.message}`);
  // }
  };

  return (
    <View style={styles.container}>
      <View style={styles.rowTile}>
        <Ionicons name="cloud-upload-outline" style={styles.iconTitle} size={20} color="#fff" />
        <Text style={styles.title}>Select Slip</Text>
      </View>

      <View style={styles.rowInput}>
        <TouchableOpacity style={styles.uploadBox} onPress={pickImages}>
          <Ionicons name="image" style={styles.iconTitle} size={20} color="#fff" />
          <Text style={styles.browseText}>Browse</Text>
        </TouchableOpacity>
      </View>

      {/* Image Preview */}
      {imageUris.length > 0 && (
        <ScrollView style={styles.previewScroll} nestedScrollEnabled>
          <View style={styles.previewContainer}>
            {imageUris.map((img, index) => (
              <Image
                key={index}
                source={{ uri: img.uri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ))}
          </View>
        </ScrollView>
      )}

      <View style={styles.submitContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => setImageUris([])}>
          <Text>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={uploadImages}>
          <Text>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 10,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  rowTile: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconTitle: {
    backgroundColor: "#4957AA",
    padding: 8,
    borderRadius: 25,
    marginRight: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 5,
  },
  rowInput: {
    flexDirection: "row",
    alignItems: "center",
  },
  uploadBox: {
    width: 300,
    height: 200,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  browseText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: "#E2E2E2",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#9AC9F3",
    paddingHorizontal: 60,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  previewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  previewImage: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 5,
  },
  previewScroll: {
    maxHeight: 250, // ✅ Ensures scrollable area is not too large
    marginTop: 10,
  },
});


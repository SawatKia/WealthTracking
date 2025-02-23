import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
  TouchableOpacity,
  SafeAreaView,
  Pressable,
  Modal,
  FlatList,
  Alert,
  Image,
  ScrollView
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
export default function ImageUploadScreen() {
  const [imageUris, setImageUris] = useState<{ uri: string; width: number; height: number }[]>([]);


  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const imageList = result.assets.map((asset) => ({
        uri: asset.uri,
        width: 0,
        height: 0,
      }));

      // Get and set original dimensions for each image
      const updatedImages: { uri: string; width: number; height: number }[] = await Promise.all(
        imageList.map(async (img) => {
          return new Promise<{ uri: string; width: number; height: number }>((resolve) => {
            Image.getSize(
              img.uri,
              (width, height) => {
                const aspectRatio = height / width;
                resolve({ uri: img.uri, width: 200, height: 200 * aspectRatio });
              },
              () => resolve({ uri: img.uri, width: 200, height: 200 }) // fallback if size can't be determined
            );
          });
        })
      );

      setImageUris(updatedImages);
    }
  };

  const uploadImages = async () => {
  
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

      {/* Preview selected images */}
      {imageUris.length > 0 && (
        <ScrollView style={styles.previewScroll} nestedScrollEnabled>
          <View style={styles.previewContainer}>
            {imageUris.map((img, index) => (
              <Image
                key={index}
                source={{ uri: img.uri }}
                style={{
                  width: img.width,
                  height: img.height,
                  margin: 5,
                  borderRadius: 5,
                }}
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
        <TouchableOpacity style={styles.saveButton} onPress={() => {}}>
          <Text>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
    // <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    //   <Button title="Pick an image" onPress={pickImages} />

    //   <Button title="Upload Image" onPress={uploadImages} color="green" />
    // </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 10,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    elevation: 2, // Adds shadow on Android
    shadowColor: "#000", // Adds shadow on iOS
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  rowTile: {
    flexDirection: "row", // Aligns icon and title horizontally
    alignItems: "center",
    marginBottom: 8, // Spacing between rows
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
    flexDirection: "row", // Aligns blank space and inputs horizontally
    alignItems: "center",
  },

  inputsContainer: {
    flexDirection: "row", // Arrange items in a row
    flexWrap: "wrap",
    width: "90%", // Allow items to wrap to the next row
    marginLeft: 40,
  },
  inputButton: {
    flexDirection: "row",
    backgroundColor: "#4957AA40",
    borderRadius: 8,
    // padding:3,
    minHeight: 35,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",

    width: "100%",

    borderWidth: 0,
    // zIndex:100
    // zIndex: 9999,

    // textAlign:'center'
  },

  iconInput: {
    marginHorizontal: 10,
    backgroundColor: "white",
    // fontWeight:'bold
    borderRadius: 5,
    padding: 3,
  },
  dropdownContainer: {
    borderRadius: 8,
    backgroundColor: "#BEC2E0",
    borderWidth: 0,
    // marginTop:5,
    // position: "relative", // Positioning dropdown above other components
    zIndex: 1,
  },

  submitContainer: {
    flexDirection: "row",
    display: "flex",
    justifyContent: "space-around",
    marginTop: 10,
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
  previewContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  previewImage: { width: 100, height: 100, margin: 5, borderRadius: 5 },
  previewScroll: { maxHeight: 300, marginTop: 10 },
});
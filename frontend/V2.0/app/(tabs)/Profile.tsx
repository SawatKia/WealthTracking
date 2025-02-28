import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfile } from '../../services/ProfileService';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs, { Dayjs } from 'dayjs';
import { MaterialIcons } from '@expo/vector-icons';

// Type definitions - Updated to match ProfileService
interface UpdateProfileData {
  username?: string;
  email?: string;
  date_of_birth?: string;
  newPassword?: string;
  newConfirmPassword?: string; // เปลี่ยนจาก confirmNewPassword เป็น newConfirmPassword
  password?: string;
  profilePicture?: File;
}

export default function Profile() {
  const router = useRouter();
  const { profile, loading, error, getUserProfile, updateUserProfile, deleteUserAccount } = useProfile();

  // State for user data with proper typing
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<Dayjs | null>(null);
  const [profilePicture, setProfilePicture] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  // State for edit modes
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingDateOfBirth, setEditingDateOfBirth] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);

  // State for password changes
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setnewConfirmPassword] = useState('');

  // State for date picker
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  // State for delete account modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userData = await getUserProfile();
      if (userData) {
        setUsername(userData.username);
        setEmail(userData.email);

        // Convert date string to dayjs object if it exists
        if (userData.date_of_birth) {
          setDateOfBirth(dayjs(userData.date_of_birth));
        }

        // จัดการ URL รูปโปรไฟล์ที่ได้จาก API
        if (userData.profile_picture_url) {
          setProfilePictureUrl(userData.profile_picture_url);
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      Alert.alert('Error', 'Failed to load profile data');
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'You need to grant access to your photos to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      // Set local state for preview
      setProfilePicture(result.assets[0]);

      // แสดงตัวโหลดเพื่อให้ผู้ใช้ทราบว่ากำลังอัปโหลด
      Alert.alert('Uploading', 'Uploading your profile picture...');

      // Create file object for upload
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      const fileToUpload = new File([blob], 'profile-picture.jpg', { type: 'image/jpeg' });

      try {
        const updateData: UpdateProfileData = {
          password: currentPassword,
          profilePicture: fileToUpload,
        };

        const updatedProfile = await updateUserProfile(updateData);

        if (updatedProfile && updatedProfile.profile_picture_url) {
          // อัปเดต URL ของรูปภาพจาก response
          setProfilePictureUrl(updatedProfile.profile_picture_url);

          // แจ้งเตือนผู้ใช้
          Alert.alert('Success', 'Profile picture updated successfully.');

          // รีเซ็ตค่ารหัสผ่าน
          setCurrentPassword('');
        } else {
          Alert.alert('Error', 'Failed to update profile picture. Please try again.');
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
        console.error('Upload error:', err);
      }
    }
  };

  // แก้ไขฟังก์ชัน handleUpdateProfile
  const handleUpdateProfile = async (data: UpdateProfileData) => {
    if (!currentPassword && !data.profilePicture) {
      Alert.alert('Password Required', 'Please enter your current password to update your profile.');
      return;
    }

    try {
      const updateData: UpdateProfileData = {
        ...data,
        password: currentPassword,
      };

      // แก้ไขการจัดการกับวันเกิด - convert Dayjs to string if present
      if (data.date_of_birth && typeof data.date_of_birth !== 'string') {
        updateData.date_of_birth = dayjs(data.date_of_birth).format('YYYY-MM-DD');
      }

      // แก้ไขการตรวจสอบรหัสผ่านใหม่
      if (data.newPassword) {
        if (data.newPassword !== data.newConfirmPassword) { // เปลี่ยนจาก confirmNewPassword เป็น newConfirmPassword
          Alert.alert('Error', 'New passwords do not match.');
          return;
        }
      }

      console.log('Sending update data:', updateData);
      const updatedProfile = await updateUserProfile(updateData);

      if (updatedProfile) {
        Alert.alert('Success', 'Your profile has been updated successfully.');

        // Reset all edit modes and passwords
        setEditingUsername(false);
        setEditingEmail(false);
        setEditingDateOfBirth(false);
        setEditingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setnewConfirmPassword('');

        // Reload user data
        loadUserProfile();
      }
    } catch (err) {
      console.error('Update error:', err);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  // แก้ไขฟังก์ชัน onChangeDate
  const onChangeDate = (selectedDate: any) => {
    console.log('Selected date:', selectedDate); // เพิ่ม log เพื่อตรวจสอบข้อมูลที่ได้รับ

    // แก้ไขวิธีรับค่าจาก DateTimePicker
    if (selectedDate && selectedDate.date) {
      const newDate = dayjs(selectedDate.date);
      console.log('Converted to dayjs:', newDate.format('YYYY-MM-DD'));
      setDateOfBirth(newDate);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert('Password Required', 'Please enter your current password to delete your account.');
      return;
    }

    try {
      const success = await deleteUserAccount(deletePassword);

      if (success) {
        setDeleteModalVisible(false); // ปิด modal ก่อนที่จะไปหน้า Login
        Alert.alert('Account Deleted', 'Your account has been deleted successfully.');
        router.push('/Login');
      } else {
        Alert.alert('Error', 'Failed to delete account. Please check your password and try again.');
      }
    } catch (err) {
      Alert.alert('Error', 'An error occurred while deleting your account.');
    }
  };

  const handleLogout = () => {
    // Implement your logout logic here
    // For example, clear any auth tokens from storage
    // AsyncStorage.removeItem('authToken');

    router.push('/Login');
  };

  // ฟังก์ชันเพื่อกำหนดแหล่งที่มาของรูปภาพโปรไฟล์
  const getProfileImageSource = () => {
    // ลำดับความสำคัญ: 1. รูปภาพที่เพิ่งอัปโหลด, 2. URL จากเซิร์ฟเวอร์, 3. ภาพ placeholder
    if (profilePicture && profilePicture.uri) {
      return { uri: profilePicture.uri };
    } else if (profilePictureUrl) {
      return { uri: profilePictureUrl };
    } else {
      return null; // จะแสดงไอคอนแทน
    }
  };

  const profileImageSource = getProfileImageSource();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>

      {/* Profile Picture */}
      <View style={styles.pictureContainer}>
        <TouchableOpacity onPress={pickImage}>
          {profileImageSource ? (
            <Image
              source={profileImageSource}
              style={styles.profilePicture}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <MaterialIcons name="person" size={60} color="#ccc" />
            </View>
          )}
          <View style={styles.editIconContainer}>
            <MaterialIcons name="edit" size={20} color="white" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Username */}
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Username</Text>
        {editingUsername ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <View style={styles.passwordContainer}>
              <Text style={styles.passwordLabel}>Current Password:</Text>
              <TextInput
                style={styles.passwordInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="Required to update"
              />
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setEditingUsername(false);
                  setCurrentPassword('');
                  loadUserProfile(); // Reset to original value
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={() => handleUpdateProfile({ username })}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.valueContainer}>
            <Text style={styles.value}>{username}</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditingUsername(true)}
            >
              <MaterialIcons name="edit" size={20} color="#8A8A8A" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Birthday - แก้ไขส่วนนี้ */}
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Birthday</Text>
        {editingDateOfBirth ? (
          <View style={styles.editContainer}>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setDatePickerVisibility(!isDatePickerVisible)}
            >
              <Text>{dateOfBirth ? dateOfBirth.format('DD MMM YYYY') : 'Select Date'}</Text>
              <MaterialIcons name="calendar-today" size={20} color="#8A8A8A" />
            </TouchableOpacity>

            {isDatePickerVisible && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  mode="single"
                  date={dateOfBirth ? dateOfBirth.toDate() : new Date()}
                  onChange={(params) => onChangeDate(params)}
                />
              </View>
            )}

            <View style={styles.passwordContainer}>
              <Text style={styles.passwordLabel}>Current Password:</Text>
              <TextInput
                style={styles.passwordInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="Required to update"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setEditingDateOfBirth(false);
                  setDatePickerVisibility(false);
                  setCurrentPassword('');
                  loadUserProfile(); // Reset to original value
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={() => {
                  // Convert Dayjs to string before sending to API
                  const formattedDate = dateOfBirth ? dateOfBirth.format('YYYY-MM-DD') : undefined;
                  handleUpdateProfile({ date_of_birth: formattedDate });
                }}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.valueContainer}>
            <Text style={styles.value}>
              {dateOfBirth ? dateOfBirth.format('DD MMM YYYY') : ''}
            </Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditingDateOfBirth(true)}
            >
              <MaterialIcons name="edit" size={20} color="#8A8A8A" />
            </TouchableOpacity>
          </View>
        )}
      </View>
      {/* Email */}
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Email</Text>
        {editingEmail ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View style={styles.passwordContainer}>
              <Text style={styles.passwordLabel}>Current Password:</Text>
              <TextInput
                style={styles.passwordInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="Required to update"
              />
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setEditingEmail(false);
                  setCurrentPassword('');
                  loadUserProfile(); // Reset to original value
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={() => handleUpdateProfile({ email })}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.valueContainer}>
            <Text style={styles.value}>{email}</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditingEmail(true)}
            >
              <MaterialIcons name="edit" size={20} color="#8A8A8A" />
            </TouchableOpacity>
          </View>
        )}
      </View>


      {/* Password - แก้ไขส่วนนี้ */}
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Password</Text>
        {editingPassword ? (
          <View style={styles.editContainer}>
            <View style={styles.passwordContainer}>
              <Text style={styles.passwordLabel}>Current Password:</Text>
              <TextInput
                style={styles.passwordInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="Enter current password"
              />
            </View>

            <View style={styles.passwordContainer}>
              <Text style={styles.passwordLabel}>New Password:</Text>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Enter new password"
              />
            </View>

            <View style={styles.passwordContainer}>
              <Text style={styles.passwordLabel}>Confirm New Password:</Text>
              <TextInput
                style={styles.passwordInput}
                value={confirmNewPassword}
                onChangeText={setnewConfirmPassword}
                secureTextEntry
                placeholder="Confirm new password"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setEditingPassword(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setnewConfirmPassword('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={() => handleUpdateProfile({
                  newPassword: newPassword,
                  newConfirmPassword: confirmNewPassword // เปลี่ยนจาก confirmNewPassword เป็น newConfirmPassword
                })}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.valueContainer}>
            <Text style={styles.value}>••••••••</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditingPassword(true)}
            >
              <MaterialIcons name="edit" size={20} color="#8A8A8A" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Delete Account */}
      <View style={styles.dangerZone}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => setDeleteModalVisible(true)}
        >
          <MaterialIcons name="delete" size={20} color="white" />
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </View>


      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <MaterialIcons name="logout" size={20} color="white" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      {/* Delete Account Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete your account? This action cannot be undone.
            </Text>

            <Text style={styles.passwordLabel}>Enter your password to confirm:</Text>
            <TextInput
              style={styles.modalInput}
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
              placeholder="Current password"
            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setDeletePassword('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.deleteModalButton]}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.modalButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F6FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  pictureContainer: {
    alignItems: 'center',
    padding: 20,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4957AA',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  infoContainer: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  editButton: {
    padding: 5,
  },
  editContainer: {
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerContainer: {
    marginTop: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  passwordContainer: {
    marginTop: 15,
  },
  passwordLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  button: {
    borderRadius: 5,
    padding: 10,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E2E2E2',
  },
  saveButton: {
    backgroundColor: '#9AC9F3',
  },
  buttonText: {
    fontWeight: '500',
  },
  dangerZone: {
    borderRadius: 5,
    marginHorizontal: 15,
    marginVertical: 10,
  },
  deleteButton: {
    backgroundColor: '#d9534f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 10,
  },
  logoutButton: {
    backgroundColor: '#555',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 5,
    marginHorizontal: 15,
    marginVertical: 10,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#d9534f',
  },
  modalText: {
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  modalButton: {
    borderRadius: 5,
    padding: 10,
    width: '48%',
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#f0f0f0',
  },
  deleteModalButton: {
    backgroundColor: '#d9534f',
  },
  modalButtonText: {
    fontWeight: '500',
    color: '#fff',
  },
});

<<<<<<< HEAD
import React, { useState } from "react";
=======
import React, { useState, useEffect } from "react";
>>>>>>> a51f311a0b38028b391ffa03f728ea2485a74edb
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image, Modal } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import DatePicker from 'react-native-modern-datepicker';
<<<<<<< HEAD
import { useTranslation } from "react-i18next";
import { ImageSourcePropType } from 'react-native';

type Field = 'username' | 'birthday' | 'email' | 'password' | 'language';
type SetEditingFunction = React.Dispatch<React.SetStateAction<boolean>>;
type SetValueFunction = React.Dispatch<React.SetStateAction<string>>;

interface DetailItemProps {
  icon: ImageSourcePropType;
  title: string;
  value: string;
  isEditing: boolean;
  setEditing: SetEditingFunction;
  tempValue: string;
  setTempValue: SetValueFunction;
  field: Field;
}
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
  };
export default function ProfileScreen() {
  const router = useRouter();

  const [username, setUsername] = useState("Jane Cooper");
  const [birthday, setBirthday] = useState("1990-01-01");
  const [email, setEmail] = useState("jane.cooper@example.com");
  const [password, setPassword] = useState("********");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
=======
import { useUsers } from '../../services/ProfileService'; // Import the useUsers hook

export default function ProfileScreen() {
  const router = useRouter();
  const { Users, loading, error, getAllUsers, editUser } = useUsers(); // Get user data and functions

  const [username, setUsername] = useState('');
  const [birthday, setBirthday] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

>>>>>>> a51f311a0b38028b391ffa03f728ea2485a74edb
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

<<<<<<< HEAD
  const [tempUsername, setTempUsername] = useState(username);
  const [tempBirthday, setTempBirthday] = useState(birthday);
  const [tempEmail, setTempEmail] = useState(email);
  const [tempPassword, setTempPassword] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleEditPhoto = async () => {
    // ขอสิทธิ์การเข้าถึงคลังรูปภาพ
=======
  const [tempUsername, setTempUsername] = useState('');
  const [tempBirthday, setTempBirthday] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [tempConfirmPassword, setTempConfirmPassword] = useState('');

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Load user data on component mount
  useEffect(() => {
    const fetchData = async () => {
      const users = await getAllUsers();
      if (users.length > 0) {
        const user = users[0]; // Assuming you want to use the first user
        setUsername(user.username);
        setBirthday(user.date_of_birth);
        setEmail(user.email);
        setProfileImage(user.profile_picture_url);
        setTempUsername(user.username);
        setTempBirthday(user.date_of_birth);
        setTempEmail(user.email);
      }
    };

    fetchData();
  }, [getAllUsers]);

  const handleEditPhoto = async () => {
>>>>>>> a51f311a0b38028b391ffa03f728ea2485a74edb
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "You need to allow access to the media library to upload a profile picture.");
      return;
    }

<<<<<<< HEAD
    // เปิด Image Picker
=======
>>>>>>> a51f311a0b38028b391ffa03f728ea2485a74edb
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    router.push('/Login');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

<<<<<<< HEAD
  const handleSave = (field: Field) => {
    switch (field) {
      case 'username':
        setUsername(tempUsername);
        setEditingUsername(false);
        break;
      case 'birthday':
        setBirthday(tempBirthday);
        setEditingBirthday(false);
        break;
      case 'email':
        setEmail(tempEmail);
        setEditingEmail(false);
        break;
      case 'password':
        setPassword(tempPassword);
        setEditingPassword(false);
        break;
    }
=======
  const handleSave = (field: string) => {
    if (field === "password" && tempPassword !== tempConfirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    const updatedUser = {
      national_id: "sample_id", // You should get this dynamically (perhaps from the fetched user data)
      username: tempUsername,
      email: tempEmail,
      password: tempPassword,
      confirm_password: tempConfirmPassword, // Assuming it's the same as password
      date_of_birth: tempBirthday,
    };

    // Call the editUser function to update the user
    editUser(updatedUser).then((success) => {
      if (success) {
        setUsername(tempUsername);
        setBirthday(tempBirthday);
        setEmail(tempEmail);
        setEditingUsername(false);
        setEditingBirthday(false);
        setEditingEmail(false);
        setEditingPassword(false);
      } else {
        Alert.alert("Error", "Failed to update the user information.");
      }
    });
>>>>>>> a51f311a0b38028b391ffa03f728ea2485a74edb
  };

  const handleDateSelect = (selectedDate: string) => {
    setTempBirthday(selectedDate);
  };

  const handleCalendarClose = () => {
    setShowCalendar(false);
    handleSave('birthday');
  };
<<<<<<< HEAD
  const renderDetailItem = ({
    icon,
    title,
    value,
    isEditing,
    setEditing,
    tempValue,
    setTempValue,
    field
  }: 
  DetailItemProps) => {
=======

  const renderDetailItem = ({ icon, title, value, isEditing, setEditing, tempValue, setTempValue, field }: any) => {
>>>>>>> a51f311a0b38028b391ffa03f728ea2485a74edb
    return (
      <View style={styles.detailItem}>
        <View style={styles.detailLeft}>
          <Image source={icon} style={styles.itemIcon} />
          <View style={styles.detailTexts}>
            <Text style={styles.detailTitle}>{title}</Text>
            {isEditing && field !== 'birthday' ? (
              <TextInput
                style={[styles.editInput, { outline: 'none' }]}
                value={tempValue}
                onChangeText={setTempValue}
                secureTextEntry={field === 'password'}
              />
            ) : (
              <Text style={styles.detailValue}>{value}</Text>
            )}
          </View>
        </View>
        {field !== 'language' && (
          isEditing && field !== 'birthday' ? (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => handleSave(field)}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => {
              if (field === 'birthday') {
                setShowCalendar(true);
                setEditingBirthday(true);
              } else {
                setEditing(true);
              }
            }}>
              <Image
                source={require("../../assets/images/Edit-DetailProfile.png")}
                style={styles.editIconSmall}
              />
            </TouchableOpacity>
          )
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
<<<<<<< HEAD
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="fade"
      >
=======
      {/* Modal for Calendar */}
      <Modal visible={showCalendar} transparent={true} animationType="fade">
>>>>>>> a51f311a0b38028b391ffa03f728ea2485a74edb
        <View style={styles.modalOverlay}>
          <View style={styles.calendarContainer}>
            <DatePicker
              mode="calendar"
              onSelectedChange={handleDateSelect}
              selected={tempBirthday}
              style={styles.calendar}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCalendarClose}
              >
                <Text style={styles.closeButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.closeButton, styles.cancelButton]}
                onPress={() => {
                  setShowCalendar(false);
                  setEditingBirthday(false);
                  setTempBirthday(birthday);
                }}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          <Image
            source={profileImage ? { uri: profileImage } : require("../../assets/images/default-profile.png")}
            style={styles.profileImage}
          />
          <TouchableOpacity
            onPress={handleEditPhoto}
            style={styles.editIconContainer}
          >
            <Image
              source={require("../../assets/images/Edit-ImageProfile.png")}
              style={styles.editIconImage}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        {renderDetailItem({
          icon: require("../../assets/images/Edit-Username.png"),
          title: "Username",
          value: username,
          isEditing: editingUsername,
          setEditing: setEditingUsername,
          tempValue: tempUsername,
          setTempValue: setTempUsername,
          field: 'username'
        })}
        <View style={styles.separator} />

        {renderDetailItem({
          icon: require("../../assets/images/Edit-Birthday.png"),
          title: "Birthday",
          value: birthday,
          isEditing: editingBirthday,
          setEditing: setEditingBirthday,
          tempValue: tempBirthday,
          setTempValue: setTempBirthday,
          field: 'birthday'
        })}
        <View style={styles.separator} />

        {renderDetailItem({
          icon: require("../../assets/images/Change-Email.png"),
          title: "Email",
          value: email,
          isEditing: editingEmail,
          setEditing: setEditingEmail,
          tempValue: tempEmail,
          setTempValue: setTempEmail,
          field: 'email'
        })}
        <View style={styles.separator} />

<<<<<<< HEAD
        {renderDetailItem({
          icon: require("../../assets/images/Change-Password.png"),
          title: "Password",
          value: password,
=======
        {/* Password Update */}
        {renderDetailItem({
          icon: require("../../assets/images/Change-Password.png"),
          title: "Password",
          value: "********",
>>>>>>> a51f311a0b38028b391ffa03f728ea2485a74edb
          isEditing: editingPassword,
          setEditing: setEditingPassword,
          tempValue: tempPassword,
          setTempValue: setTempPassword,
          field: 'password'
        })}
        <View style={styles.separator} />

        <TouchableOpacity style={styles.detailItem}>
          <View style={styles.detailLeft}>
            <Image source={require("../../assets/images/Change-Language.png")} style={styles.itemIcon} />
            <Text style={styles.detailTitle}>Change Language</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.separator} />

        <TouchableOpacity style={styles.detailItem} onPress={handleLogout}>
          <View style={styles.detailLeft}>
            <Image source={require("../../assets/images/Logout.png")} style={styles.logoutIcon} />
            <Text style={[styles.detailTitle, styles.logoutText]}>Logout</Text>
          </View>
        </TouchableOpacity>
      </View>

<<<<<<< HEAD
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelLogout}
      >
=======
      {/* Logout Modal */}
      <Modal visible={showLogoutModal} transparent={true} animationType="fade" onRequestClose={cancelLogout}>
>>>>>>> a51f311a0b38028b391ffa03f728ea2485a74edb
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.modalMessage}>Are you sure you want to log out?</Text>
            <View style={styles.modalButtons}>
<<<<<<< HEAD
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelLogout}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmLogout}
              >
=======
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={cancelLogout}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={confirmLogout}>
>>>>>>> a51f311a0b38028b391ffa03f728ea2485a74edb
                <Text style={styles.modalButtonText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  profileSection: { alignItems: "center", marginVertical: 20, width: "100%" },
  profileImageContainer: { width: 120, height: 120, borderRadius: 60  ,position: "relative",backgroundColor: "#ffffff",
=======
  container: {
    flex: 1,
    backgroundColor: "#F0F6FF",
    padding: 16,
  },
  profileSection: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ffffff",
>>>>>>> a51f311a0b38028b391ffa03f728ea2485a74edb
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
<<<<<<< HEAD
    elevation: 8,},
  profileImage: { width: "100%", height: "100%", borderRadius: 60 ,borderWidth: 5,
    borderColor: "#ffffff", },
    editIconContainer: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: "#ffffff",
      width: 35,
      height: 35,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    editIconImage: {
      width: 25,
      height: 25,
    },
    editIconSmall: {
      width: 20,
      height: 20,
    },
  detailsContainer: { backgroundColor: "#FFFFFF",
=======
    elevation: 8,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    borderWidth: 5,
    borderColor: "#ffffff",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#ffffff",
    width: 35,
    height: 35,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  editIconImage: {
    width: 25,
    height: 25,
  },
  editIconSmall: {
    width: 20,
    height: 20,
  },
  detailsContainer: {
    backgroundColor: '#FFFFFF',
>>>>>>> a51f311a0b38028b391ffa03f728ea2485a74edb
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
<<<<<<< HEAD
  detailItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
  detailTitle: { fontSize: 16, fontWeight: "500" },
  detailValue: { fontSize: 14, color: "#666666",marginTop: 4,},
  separator: {
    height: 0.5,
    backgroundColor: "#E9E9E9",
    marginVertical: 4,
  },
  editInput: { fontSize: 14, borderBottomWidth: 1, borderBottomColor: "#4957AA" },
  logoutButton: { padding: 16, backgroundColor: "red", marginTop: 20, alignItems: "center" },
  logoutText: { color: "#BB271A", },
  logoutIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
},
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
=======
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  logoutIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    marginTop: 3,
  },
  detailTexts: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  detailValue: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  separator: {
    height: 0.5,
    backgroundColor: '#E9E9E9',
    marginVertical: 4,
  },
  logoutText: {
    color: '#BB271A',
  },
  editInput: {
    fontSize: 14,
    color: '#666666',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#4957AA',
    borderRadius: 0,
    padding: 4,
    paddingLeft: 0,
    marginTop: 4,
    outline: 'none',
  },
  saveButton: {
    backgroundColor: '#4957AA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
>>>>>>> a51f311a0b38028b391ffa03f728ea2485a74edb
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 8,
    width: "80%",
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: "40%",
  },
<<<<<<< HEAD
  cancelButton: {
    backgroundColor: "#666666",
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  itemIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  detailTexts: {
    fontSize: 16,
=======
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxWidth: 400,
  },
  calendar: {
    borderRadius: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  closeButton: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#4957AA',
    borderRadius: 6,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#666666',
>>>>>>> a51f311a0b38028b391ffa03f728ea2485a74edb
  },
  confirmButton: {
    backgroundColor: "#BB271A",
  },
  modalButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "bold",
  },
<<<<<<< HEAD
  closeButton: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "#4957AA",
    borderRadius: 6,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#4957AA",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  calendarContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    width: "90%",
    maxWidth: 400,
  },
  calendar: { width: 300, height: 350 },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingHorizontal: 16,
  },
  languageButton: {
    backgroundColor: "blue",
    padding: 10,
  },
  languageButtonText: {
    color: "white",
    fontSize: 16,
  },

  
});

=======
});
>>>>>>> a51f311a0b38028b391ffa03f728ea2485a74edb

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  Pressable,
} from "react-native";
import { Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Use Ionicons for the eye icon
import { Link, useRouter } from "expo-router";
import { signUp, signUpGoogle } from "../services/AuthenService";
//Use this import
//import { useTranslation } from "react-i18next";
//import '..components/i18n/i18n.ts';

export default function SignUpScreen() {
  const router = useRouter();
  //use this function
  // const { t, i18n } = useTranslation();
  // const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  // const toggleLanguage = () => {
  // const newLang = currentLanguage === 'en' ? 'th' : 'en';
  // i18n.changeLanguage(newLang);
  // setCurrentLanguage(newLang);
  // 
  // Example :  <Text style={styles.googleText}>{t('Sign in With Google')}</Text>

  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // Default is hidden
  const [isconfirmPasswordVisible, setIsconfirmPasswordVisible] =
    useState(false); // Default is hidden

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nationalId, setnationalId] = useState("");
  const [confirmPassword, setconfirmPassword] = useState("");

  const [err, setErr] = useState({
    email: "",
    username: "",
    nationalId: "",
    password: "",
    confirmPassword: "",
  }); //(nationalId, username, email, password, confirmPassword)

  const validateInput = (): boolean => {
    let isValid = true;
    const newError = {
      email: "",
      username: "",
      nationalId: "",
      password: "",
      confirmPassword: "",
    };

    if (!email.trim()) {
      newError.email = "Email is required";
      isValid = false;
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      newError.email = "Invalid email format";
      isValid = false;
    }

    if (!username.trim()) {
      newError.username = "username Id is required";
      isValid = false;
    }

    if (!nationalId.trim()) {
      newError.nationalId = "National Id is required";
      isValid = false;
    } else if (!/^\d{13}$/.test(nationalId)) {
      newError.nationalId = "National ID contain exactly 13 digits";
      isValid = false;
    }

    if (!password.trim()) {
      newError.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      newError.password = "Password must be at least 6 characters";
      isValid = false;
    }

    if (!confirmPassword.trim()) {
      newError.confirmPassword = "Confirm Password is required";
      isValid = false;
    } else if (confirmPassword !== password) {
      newError.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErr(newError);
    return isValid;
  };

  const handleSignUp = async () => {
    if (!validateInput()) return;
    try {
      const response = await signUp(
        nationalId,
        username,
        email,
        password,
        confirmPassword
      );
      console.log("Sign Up Success", "You can now log in", response);
      
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignUpGoogle = async () => {

    try{
      const response = await signUpGoogle()
      console.log("Sign Up Google Success", "You can now log in", response.data);
      router.push(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.background}>
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.container}>
        {/* Title aligned to the left */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Create Account</Text>
        </View>

        {/* Username Input */}
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#f5f5f5"
          onChangeText={(text) => {
            setUsername(text);
            setErr((prev) => ({ ...prev, username: "" })); // Clear err on input change
          }}
        />

        <TextInput
          style={styles.input}
          placeholder="National ID"
          placeholderTextColor="#f5f5f5"
          onChangeText={(text) => {
            setnationalId(text);
            setErr((prev) => ({ ...prev, nationalId: "" })); // Clear err on input change
          }}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#f5f5f5"
          onChangeText={(text) => {
            setEmail(text);
            setErr((prev) => ({ ...prev, email: "" })); // Clear err on input change
          }}
        />

        {/* Password Input */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.inputField}
            value={password}
            placeholder="Password"
            placeholderTextColor="#f5f5f5"
            secureTextEntry={!isPasswordVisible} // Toggle visibility
            onChangeText={(text) => {
              setPassword(text);
              setErr((prev) => ({ ...prev, password: "" })); // Clear err on input change
            }}
          />
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-off" : "eye"}
              size={24}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.inputField}
            value={confirmPassword}
            placeholder="Comfirm Password"
            placeholderTextColor="#f5f5f5"
            secureTextEntry={!isconfirmPasswordVisible} // Toggle visibility
            onChangeText={(text) => {
              setconfirmPassword(text);
              setErr((prev) => ({ ...prev, confirmPassword: "" })); // Clear err on input change
            }}
          />
          <TouchableOpacity
            onPress={() =>
              setIsconfirmPasswordVisible(!isconfirmPasswordVisible)
            }
            style={styles.eyeIcon}
          >
            <Ionicons
              name={isconfirmPasswordVisible ? "eye-off" : "eye"}
              size={24}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>

        {err.username ||
        err.nationalId ||
        err.email ||
        err.password ||
        err.confirmPassword ? (
          <View style={styles.errorInput}>
            <Ionicons name="alert-circle" size={24} color="red" />
            <View style={styles.errorTextContainer}>
              <Text style={styles.errorText}>{err.username}</Text>
              <Text style={styles.errorText}>{err.nationalId}</Text>
              <Text style={styles.errorText}>{err.email}</Text>
              <Text style={styles.errorText}>{err.password}</Text>
              <Text style={styles.errorText}>{err.confirmPassword}</Text>
            </View>
          </View>
        ) : null}

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleSignUp}>
          <Text style={styles.loginText}>Sign Up</Text>
        </TouchableOpacity>

        {/* Divider */}
        <Text style={styles.orText}>or</Text>

        {/* Google Login */}
        <TouchableOpacity style={styles.googleButton} onPress={handleSignUpGoogle}>
          <Ionicons name="logo-google" size={24} color="#4a4a8e" />
          <Text style={styles.googleText}>Sign in With Google</Text>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <Text style={styles.signupText}>
          Already have an account?
          <Link href="/Login" asChild>
            <Pressable>
              <Text style={styles.signupLink}>Login</Text>
            </Pressable>
          </Link>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get("window");
const circleSize = Math.min(width, height);
const styles = StyleSheet.create({
  background: {
    backgroundColor: "#9AC9F3",
    width: "100%",
    height: "100%",
    flex: 1,
  },
  circle1: {
    position: "absolute",
    top: -circleSize * 0.4,
    left: -circleSize * 0.2,
    width: circleSize,
    height: circleSize,
    borderRadius: circleSize / 2,
    backgroundColor: "#4a4a8e",
    opacity: 0.6,
  },
  circle2: {
    position: "absolute",
    top: circleSize * 0.5,
    left: circleSize * 0.5,
    width: circleSize * 0.5,
    height: circleSize * 0.5,
    borderRadius: (circleSize * 0.5) / 2,
    backgroundColor: "#fff",
    opacity: 0.5,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    width: "100%",
    maxWidth: width < 414 ? 400 : width < 1280 ? 500 : 600,
    alignSelf: "center",
  },
  titleContainer: {
    alignSelf: "flex-start",
    marginBottom: 20,
    marginLeft: 20,
    top: -30,
  },
  title: {
    fontSize: 50,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  input: {
    width: "90%",
    color: "#FFFFFF",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
  },
  inputField: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
  },
  eyeIcon: {
    paddingLeft: 10,
  },
  options: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#4a4a8e",
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: "#fff", // Default color
    justifyContent: "center",
    alignItems: "center",
  },
  checked: {
    backgroundColor: "#4a4a8e", // Color when checked
  },
  rememberMe: {
    color: "#4a4a8e",
    fontSize: 14,
  },
  forgotPassword: {
    color: "#4a4a8e",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  loginButton: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 40,
    width: "90%",
    alignItems: "center",
    marginBottom: 10,
  },
  loginText: {
    color: "#4957AA",
    fontSize: 20,
    fontWeight: "bold",
  },
  orText: {
    color: "#4a4a8e",
    marginVertical: 10,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 40,
    width: "90%",
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleText: {
    color: "#4a4a8e",
    fontSize: 16,
  },
  signupText: {
    color: "#4a4a8e",
    fontSize: 14,
  },
  signupLink: {
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  errorInput: {
    width: "90%",
    backgroundColor: "rgb(253, 212, 212)",
    borderColor: "red",
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,

    flexDirection: "row",
    alignItems: "center",
  },
  errorTextContainer: {
    justifyContent: "center",
  },
  errorText: { color: "red", marginLeft: 14 },
});

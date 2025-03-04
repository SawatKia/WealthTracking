import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  Pressable,
  Alert,
} from "react-native";
import { Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Link, router, useRouter } from "expo-router";

import { useAuth } from "@/context/AuthContext";
import {
  saveCredentials,
  getCredentials,
  clearCredentials,
} from "@/services/AuthenService";

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // Default is hidden
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isChecked, setIsChecked] = useState(false); // State for the checkbox

  const [rememberMe, setRememberMe] = useState(false);
  const [err, setErr] = useState({
    email: "",
    password: "",
    checkLogin: "",
  }); //(nationalId, username, email, password, confirmPassword)

  // const [error, setError] = useState({ email: '', password: '' });

  // const validateInput = (): boolean => {
  //   let isValid = true;
  //   const newError = { email: '', password: '' };

  //   if (!email.trim()) {
  //     newError.email = 'Email is required';
  //     isValid = false;
  //   } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
  //     newError.email = 'Invalid email format';
  //     isValid = false;
  //   }

  //   if (!password.trim()) {
  //     newError.password = 'Password is required';
  //     isValid = false;
  //   } else if (password.length < 6) {
  //     newError.password = 'Password must be at least 6 characters';
  //     isValid = false;
  //   }

  //   setError(newError);
  //   return isValid;
  // };
  useEffect(() => {
    // Retrieve saved credentials when the screen loads
    const loadSavedCredentials = async () => {
      const { email, password } = await getCredentials();
      if (email && password) {
        setEmail(email);
        setPassword(password);
        setRememberMe(true);
      }
    };
    loadSavedCredentials();
  }, []);

  const handleLogin = async () => {
    if (!validateInput()) return; // Ensure input validation passes before proceeding
  
    try {
      // Reset previous errors
      setErr({ email: "", password: "", checkLogin: "" });
  
      // Call the login function and handle response
      const response = await login(email, password);
  
      if (response === true) {
        console.log('Login Success', `Welcome, ${email}`);
  
        // Handle "Remember Me" functionality
        if (rememberMe) {
          await saveCredentials(email, password); // Save credentials if "Remember Me" is checked
        } else {
          await clearCredentials(); // Clear credentials if "Remember Me" is not selected
        }
  
        // Navigate to the next screen after login success (uncomment when using a router)
        // router.push('/(tabs)');
  
      } else {
        // Handle failure response (display error message)
        setErr({
          email: "",
          password: "",
          checkLogin: `Login Failed: ${response}`, // Using template literal here
        });
      }
  
    } catch (error) {
      console.error('Error during login:', error);
      setErr({
        email: "",
        password: "",
        checkLogin: `Error during login: ${error}`, // Using template literal and checking error message
      });
    }
  };
  
  
   const validateInput = (): boolean => {
     let isValid = true;
     const newError = {
       email: "",
       password: "",
       checkLogin: "",
     };
 
     if (!email.trim()) {
       newError.email = "Email is required";
       isValid = false;
     } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
       newError.email = "Invalid email format";
       isValid = false;
     }
 
 
     if (!password.trim()) {
       newError.password = "Password is required";
       isValid = false;
     }
 
 
     setErr(newError);
     return isValid;
   };
 
  

  const handleGoogleLogin = async () => {
    await loginWithGoogle();
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const toggleCheckbox = () => {
    setIsChecked(!isChecked); // Toggle the checkbox state
    setRememberMe(!rememberMe);
  };

  return (
    <SafeAreaView style={styles.background}>
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.container}>
        {/* Title aligned to the left */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Welcome Back</Text>
        </View>

        {/* Username Input */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#f5f5f5"
          onChangeText={setEmail}
        />

        {/* Password Input */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.inputField}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#f5f5f5"
            secureTextEntry={!isPasswordVisible} // Toggle visibility
          />
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-off" : "eye"}
              size={24}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>

        {/* Options Row */}
        <View style={styles.options}>
          {/* Checkbox with Remember me */}
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              onPress={toggleCheckbox}
              style={[styles.checkbox, isChecked && styles.checked]}
            >
              {isChecked && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </TouchableOpacity>
            <Text style={styles.rememberMe}>Remember me</Text>
          </View>

          {/* Forgot password */}
          {/* <TouchableOpacity>
            <Text style={styles.forgotPassword}>Forgot password?</Text>
          </TouchableOpacity> */}
        </View>
          {
                  err.email ||
                  err.password ||
                  err.checkLogin  ? (
                    <View style={styles.errorInput}>
                      <Ionicons name="alert-circle" size={24} color="red" />
                      <View style={styles.errorTextContainer}>
                        <Text style={styles.errorText}>{err.email}</Text>
                        <Text style={styles.errorText}>{err.password}</Text>
                        <Text style={styles.errorText}>{err.checkLogin}</Text>
                      </View>
                    </View>
                  ) : null}
        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginText}>Log In</Text>
        </TouchableOpacity>

        {/* Divider */}
        <Text style={styles.orText}>or</Text>

        {/* Google Login */}
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleLogin}
        >
          <Ionicons name="logo-google" size={24} color="#4a4a8e" />
          <Text style={styles.googleText}>Sign in With Google</Text>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <Text style={styles.signupText}>
          Don’t have an account?
          <Link href="/SignUp" asChild>
            <Pressable>
              <Text style={styles.signupLink}>Sign Up</Text>
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
    backgroundColor: "#7F8CD9",
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
    top: circleSize * 0.5 * 0.1,
    left: circleSize * 0.5,
    width: circleSize * 0.5,
    height: circleSize * 0.5,
    borderRadius: (circleSize * 0.5) / 2,
    backgroundColor: "#99bbff",
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

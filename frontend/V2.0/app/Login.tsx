import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, SafeAreaView, Pressable, Alert } from "react-native";
import { Dimensions } from "react-native";
import { Ionicons} from "@expo/vector-icons"; 

import { Link } from 'expo-router';

import { login } from '../services/api';

export default function LoginScreen() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // Default is hidden
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isChecked, setIsChecked] = useState(false); // State for the checkbox

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


  const handleLogin = async () => {
    try {
      const response = await login(username, password);
      console.log('Login Success', `Welcome, ${response}`)
      
    } catch (error) {
      console.error(error);
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const toggleCheckbox = () => {
    setIsChecked(!isChecked); // Toggle the checkbox state
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
          placeholder="Username" 
          placeholderTextColor="#f5f5f5"
          onChangeText={setUsername}
          
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
          <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
            <Ionicons name={isPasswordVisible ? "eye-off" : "eye"} size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
        

        {/* Options Row */}
        <View style={styles.options}>
          {/* Checkbox with Remember me */}
          <View style={styles.checkboxContainer}>
            <TouchableOpacity onPress={toggleCheckbox} style={[styles.checkbox, isChecked && styles.checked]}>
              {isChecked && <Ionicons name="checkmark" size={16} color="#fff" />}
            </TouchableOpacity>
            <Text style={styles.rememberMe}>Remember me</Text>
          </View>


          {/* Forgot password */}
          <TouchableOpacity>
            <Text style={styles.forgotPassword}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={() => console.log(username,password)}>
          <Text style={styles.loginText}>Log In</Text>
        </TouchableOpacity>
        
        {/* Divider */}
        <Text style={styles.orText}>or</Text>
        
        {/* Google Login */}
        <TouchableOpacity style={styles.googleButton} >
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
};

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
    top: -(circleSize) * 0.4,
    left: -(circleSize) * 0.20,
    width: circleSize,
    height: circleSize,
    borderRadius: circleSize / 2,
    backgroundColor: "#4a4a8e",
    opacity: 0.6,
  },
  circle2: {
    position: "absolute",
    top: (circleSize * 0.5) * 0.1,
    left: (circleSize * 0.5),
    width: circleSize * 0.5,
    height: circleSize * 0.5,
    borderRadius: circleSize * 0.5 / 2,
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
});

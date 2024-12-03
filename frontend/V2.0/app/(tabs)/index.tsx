import { StyleSheet,Button } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { View, Text } from '@/components/Themed';
import { Pressable } from 'react-native';
import { Link } from 'expo-router';
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Page</Text>
      {/* <Link to ="/Login">Go to Details</Link> */}
      {/* <Link href="/Login">go to login page</Link> */}

      <Link href="/Login" asChild>
      <Pressable>
        <Text style={styles.temp}>go to login page</Text>
      </Pressable>
    </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    // color: '#7fa1ff',
    fontWeight: 'bold',
  },

  temp:{
    color: '#7fa1ff',
  }
});

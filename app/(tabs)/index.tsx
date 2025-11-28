import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
      <Link
      href={"/login"}
      style={{width: 130, height: 30, borderRadius: "5px" ,backgroundColor: "green", color: "white", alignItems: "center", justifyContent: "center", display: "flex"}}
      >
        Go to login screen</Link>
    </View>
  );
}

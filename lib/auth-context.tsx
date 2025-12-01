import { createContext, useContext } from "react";
import { ID } from "react-native-appwrite";
import { account } from "./appwrite";

type authContexType = {
  // user: Models.User<Models.Preferences> | null,
  signIn: (email: string, password: string) => Promise<string | undefined>;
  signUp: (email: string, password: string) => Promise<string | undefined>;
}

const AuthContext = createContext<authContexType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const signIn = async (email: string, password: string) => {
    try {
      await account.createEmailPasswordSession({email, password})
    } catch(error) {
      if (error instanceof Error) {
        return error.message;
      }
      return "Error while signing in to account...";
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const userId = ID.unique();
      await account.create({userId, email, password});
      await signIn(email, password)
    } catch(error) {
      if (error instanceof Error) {
        return error.message;
      }
      return "Error while signing up...";
    }
  }

  return (
    <AuthContext.Provider value={{ signIn, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if(context === undefined) {
    throw new Error("useAuth must be inside of the AuthProvider");
  }

  return context;
}
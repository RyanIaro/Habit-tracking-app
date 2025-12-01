import { createContext, useContext, useEffect, useState } from "react";
import { ID, Models } from "react-native-appwrite";
import { account } from "./appwrite";

type authContextType = {
  user: Models.User<Models.Preferences> | null,
  isLoadingUser: boolean,
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<authContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);

  useEffect(() => {
    getUser();
  }, [])

  const getUser = async () => {
    try {
      const session = await account.get();
      setUser(session);      
    } catch {
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      await account.createEmailPasswordSession({email, password});
      const session = await account.get();
      setUser(session);
      return null;
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
      await signIn(email, password);
      return null;
    } catch(error) {
      if (error instanceof Error) {
        return error.message;
      }
      return "Error while signing up...";
    }
  }

  const signOut = async () => {
    try {
      await account.deleteSession({sessionId: "current"});
      setUser(null);
    } catch(error) {
      console.log(error);
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoadingUser, signIn, signUp, signOut }}>
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
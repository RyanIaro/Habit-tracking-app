import { Models } from "react-native-appwrite";

export interface Habit extends Models.DefaultRow {
  user_id: string,
  title: string,
  description: string,
  frequency: string,
  streak_count: number,
  last_completed: string,
  creation_date: string
}
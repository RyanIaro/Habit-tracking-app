import { completionsTableId, databaseId, databases, habitsTableId } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Habit, HabitCompletion } from "@/types/database.type";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Query } from "react-native-appwrite";
import { Text } from "react-native-paper";

export default function StreaksScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completed, setCompleted] = useState<HabitCompletion[]>([]);
  const { user } = useAuth();

  const fetchHabits = useCallback(async () => {
    try {
      const response = await databases.listRows({
        databaseId,
        tableId: habitsTableId,
        queries: [Query.equal("user_id", user?.$id ?? "")],
      });
      // console.log(response.rows);
      setHabits(response.rows as Habit[])
    } catch (error) {
      console.error(error);
    }
  }, [user]);

  const fetchCompletions = useCallback(async () => {
    try {
      const response = await databases.listRows({
        databaseId,
        tableId: completionsTableId,
        queries: [Query.equal("user_id", user?.$id ?? "")],
      });
      setCompleted(response.rows as HabitCompletion[]);
    } catch (error) {
      console.error(error);
    }
  }, [user]);
  
  useEffect(() => {
    if (user) {
      fetchHabits();
      fetchCompletions();
    }
  },[user, fetchHabits, fetchCompletions]);

  interface StreakData {
    streak: number;
    bestStreak: number;
    total: number;
  }

  const getStreakData = (habitId: string): StreakData => {
    const habitCompletions = completed.filter((c) => c.habit_id === habitId).sort(
      (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
    ); 
    
    if (habitCompletions.length === 0) return {streak: 0, bestStreak: 0, total: 0};

    //build streak data
    let streak = 0;
    let bestStreak = 0;
    let total = habitCompletions.length;
    
    let lastDate: Date | null = null;
    // let currentStreak = 1;
    let currentStreak = 0;

    habitCompletions?.forEach((c) => {
      const date = new Date(c.completed_at);
      if(lastDate) {
        const diff = (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        if(diff <= 1.5) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }
        // console.log(diff);
      } else {
        if (currentStreak > bestStreak) bestStreak = currentStreak;
        streak = currentStreak;
        lastDate = date;
      }
      // lastDate = date;
    });

    return {streak, bestStreak, total};
  };

  const habitStreaks = habits.map((habit) => {
    const { streak, bestStreak, total } = getStreakData(habit.$id);
    return { habit, streak, bestStreak, total };
  })
  
  const rankedHabits = habitStreaks.sort(
    (a,b) => a.bestStreak - b.bestStreak
  );
  // console.log(rankedHabits.map((h) => h.habit.title));

  return (
    <View>
      <Text>Habit streaks</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  habitTitle: {
    
  }
})
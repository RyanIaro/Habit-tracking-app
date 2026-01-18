import { client, completionsTableId, databaseId, databases, habitsTableId, RealtimeResponse } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Habit, HabitCompletion } from "@/types/database.type";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Query } from "react-native-appwrite";
import { Card, Text } from "react-native-paper";

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
      const habitsChannel = `databases.${databaseId}.collections.${habitsTableId}.documents`;
            const habitsSubscription = client.subscribe(habitsChannel, (response: RealtimeResponse) => {
              if(response.events.some((e) => e.includes(".create"))) {
                fetchHabits();
              } else if (response.events.some((e) => e.includes(".update"))) {
                fetchHabits();
              } else if (response.events.some((e) => e.includes(".delete"))) {
                fetchHabits();
              }
            });
            
            const completionsChannel = `databases.${databaseId}.collections.${completionsTableId}.documents`;
            const completionsSubscription = client.subscribe(completionsChannel, (response: RealtimeResponse) => {
              if(response.events.some((e) => e.includes(".create"))) {
                fetchCompletions();
              }
            });

      fetchHabits();
      fetchCompletions();
      
      return () => {
        habitsSubscription();
        completionsSubscription();
      };
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
    let currentStreak = 1;

    habitCompletions?.forEach((c) => {
      const date = new Date(c.completed_at);
      if(lastDate) {
        const diff = (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        if(diff <= 1.5) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      if (currentStreak > bestStreak) bestStreak = currentStreak;
      streak = currentStreak;
      lastDate = date;
    });

    return {streak, bestStreak, total};
  };

  const habitStreaks = habits.map((habit) => {
    const { streak, bestStreak, total } = getStreakData(habit.$id);
    return { habit, streak, bestStreak, total };
  })
  
  const rankedHabits = habitStreaks.filter((hs) => hs.total > 0).sort(
    (a,b) => b.bestStreak - a.bestStreak
  );

  const badgeStyles = [styles.badge1, styles.badge2, styles.badge3]

  return (
    <View style={styles.container}>
      <Text style={styles.title} variant="headlineSmall">Habit streaks</Text>

      {rankedHabits.length > 0 && (
        <View style={styles.rankingContainer}>
          <Text style={styles.rankingTitle}>🏅Top Streaks</Text>
          {rankedHabits.slice(0,3).map((item, key) => (
            <View key={key} style={styles.rankingRow}>
              <View style={[styles.rankingBadge, badgeStyles[key]]}>
                <Text style={styles.rankingBadgeText}> {key + 1} </Text>
              </View>
              <Text style={styles.rankingHabit}> {item.habit.title} </Text>
              <Text style={styles.rankingStreak}> {item.bestStreak} </Text>
            </View>
          ))}
        </View>
      )}
      {habits.length === 0 ? (
        <View>
          <Text>No habits yet. Add your first habit!</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>{
          rankedHabits.map(({habit, streak, bestStreak, total}, key) => (
            <Card key={key} style={[styles.card, key === 0 && styles.firstCard]}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.habitTitle}>{habit.title}</Text>
                <Text style={styles.habitDescription}>{habit.description}</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statBadge}>
                    <Text style={styles.statBadgeText}> 🔥 {streak}</Text>
                    <Text style={styles.statLabel}> Streak </Text>
                  </View>
                  <View style={styles.statBadgeGold}>
                    <Text style={styles.statBadgeText}> 🏆 {bestStreak}</Text>
                    <Text style={styles.statLabel}> BestStreak </Text>
                  </View>
                  <View style={styles.statBadgeGreen}>
                    <Text style={styles.statBadgeText}> ✅ {total}</Text>
                    <Text style={styles.statLabel}> Total </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))
        }</ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  card: {
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  firstCard: {
    borderWidth: 2,
    borderColor: "#7c4dff",
    shadowColor: "#3d15ee",
  },
  habitTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 2,
  },
  habitDescription: {
    color: "#6c6c80",
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 8,
  },
  statBadge: {
    backgroundColor: "#fff3e0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 60,
  },
  statBadgeGold: {
    backgroundColor: "#fffde7",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 60,
  },
  statBadgeGreen: {
    backgroundColor: "#e8f5e9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 60,
  },
  statBadgeText: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#22223b"
  },
  statLabel: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
    fontWeight: "500",
  },
  rankingContainer: {
    marginBottom: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  rankingTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 12,
    color: "#7c4bff",
    letterSpacing: 0.5,
  },
  rankingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 8
  },
  rankingBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "#e0e0e0"
  },
  badge1: {backgroundColor: "#ffd700"},
  badge2: {backgroundColor: "#c0c0c0"},
  badge3: {backgroundColor: "#cd7f32"},
  rankingBadgeText: {
    fontWeight: "bold",
    color: "#fff",
    fontSize: 15,
  },
  rankingHabit: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
  },
  rankingStreak: {
    fontSize: 14,
    color: "#7c4dff",
    fontWeight: "bold",
  },
})
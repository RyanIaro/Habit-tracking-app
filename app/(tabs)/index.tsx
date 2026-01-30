import { client, completionsTableId, databaseId, databases, habitsTableId, RealtimeResponse } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Habit, HabitCompletion } from "@/types/database.type";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ID, Query } from "react-native-appwrite";
import { Swipeable } from "react-native-gesture-handler";
import { Button, Surface, Text } from "react-native-paper";

export default function Index() {
  const { signOut, user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null}>({})

  const getDiffMs = (d1:Date, d2:Date):number => {
    return Math.abs(d2.getTime() - d1.getTime())
  }

  //get the monday of the week
  const startOfWeek = (date: Date):Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const resetMissedStreak = useCallback(async (habitList: Habit[]) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const h of habitList) {
        let lastComptetedDate = new Date(h.last_completed);
        lastComptetedDate.setHours(0, 0, 0, 0);
        let shouldReset = false;

        switch (h.frequency) {
          case "daily":
            shouldReset = getDiffMs(today, lastComptetedDate) / (1000 * 60 * 60 * 24) >= 2;
            break;
          case "weekly":
            shouldReset = getDiffMs(startOfWeek(today), startOfWeek(lastComptetedDate)) /
            (1000 * 60 * 60 * 24 *7) >= 2
            break;
          case "monthly":
            shouldReset = Math.abs(
              (today.getFullYear() - lastComptetedDate.getFullYear()) * 12 +
              (today.getMonth() - lastComptetedDate.getMonth())
            ) >= 2;
            break;
        }

        if(shouldReset) {          
          await databases.updateRow({
            databaseId,
            tableId: habitsTableId,
            rowId: h.$id,
            data: {
              streak_count: 0,
            }
          })
        }
      }
    } catch (error) {
      console.error(error);
    }
  }, [user])
  
  const fetchHabits = useCallback(async () => {
    try {
      const response = await databases.listRows({
        databaseId,
        tableId: habitsTableId,
        queries: [Query.equal("user_id", user?.$id ?? "")],
      });
      const rows = response.rows as Habit[];
      setHabits(rows);
      return rows;
    } catch (error) {
      console.error(error);
      return [] as Habit[];
    }
  }, [user]);

  const fetchTodayCompletions = useCallback(async () => {
    try {
      let today = new Date();
      today.setHours(0, 0, 0, 0);
      const response = await databases.listRows({
        databaseId,
        tableId: completionsTableId,
        queries: [
          Query.equal("user_id", user?.$id ?? ""),
          Query.greaterThanEqual("completed_at", today.toISOString())
        ],
      });
      const dailyCompleted = response.rows as HabitCompletion[];
      setCompleted((prev) => [
        ...new Set([...prev, ...dailyCompleted.map((c) => c.habit_id)])
      ]);
      
    } catch (error) {
      console.error(error);
    }
  }, [user]);

  const fetchWeekCompletions = useCallback(async (habitList: Habit[]) => {
    try {
      let thisMonday = startOfWeek(new Date());
      const weeklyHabits = habitList.filter((h) => h.frequency === "weekly");

      for (const wh of weeklyHabits) {
        const response = await databases.listRows({
          databaseId,
          tableId: completionsTableId,
          queries: [
            Query.equal("user_id", user?.$id ?? ""),
            Query.equal("habit_id", wh.$id),
            Query.greaterThanEqual("completed_at", thisMonday.toISOString())
          ],
        });
        const weeklyCompleted = response.rows as HabitCompletion[];
        setCompleted((prev) => [
          ...new Set([...prev, ...weeklyCompleted.map((c) => c.habit_id)])
        ]);
      }
    } catch (error) {
      console.error(error);
    }
  }, [user]);

  const fetchMonthCompletions = useCallback(async (habitList: Habit[]) => {
    try {
      let theFirst = new Date();
      theFirst.setDate(1);
      theFirst.setHours(0, 0, 0, 0);
      const monthlyHabits = habitList.filter((h) => h.frequency === "monthly");

      for (const mh of monthlyHabits) {
        const response = await databases.listRows({
          databaseId,
        tableId: completionsTableId,
        queries: [
          Query.equal("user_id", user?.$id ?? ""),
          Query.equal("habit_id", mh.$id),
          Query.greaterThanEqual("completed_at", theFirst.toISOString())
        ],
      });
      const monthlyCompleted = response.rows as HabitCompletion[];
      setCompleted((prev) => [
        ...new Set([...prev, ...monthlyCompleted.map((c) => c.habit_id)])
      ]);
    }
    } catch (error) {
      console.error(error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const habitsChannel = `databases.${databaseId}.collections.${habitsTableId}.documents`;
      const habitsSubscription = client.subscribe(habitsChannel, (response: RealtimeResponse) => {
        if(
          response.events.some((e) => e.includes(".create")) ||
          response.events.some((e) => e.includes(".update")) ||
          response.events.some((e) => e.includes(".delete"))
        ) {
          fetchHabits();
        }
      });
      
      const completionsChannel = `databases.${databaseId}.collections.${completionsTableId}.documents`;
      const completionsSubscription = client.subscribe(completionsChannel, async (response: RealtimeResponse) => {
        if(response.events.some((e) => e.includes(".create"))) {
          await fetchTodayCompletions();
          const latestHabits = await fetchHabits();
          await fetchWeekCompletions(latestHabits);
          await fetchMonthCompletions(latestHabits);
        }
      });

      (async () => {
        const latestHabits = await fetchHabits();
        await fetchTodayCompletions();
        await fetchWeekCompletions(latestHabits);
        await fetchMonthCompletions(latestHabits);
        await resetMissedStreak(latestHabits);
      })();

      // unsubscribe      
      return () => {
        habitsSubscription();
        completionsSubscription();
      };
    }
  },[
      user,
      fetchHabits,
      fetchTodayCompletions
    ]);

  const handleDeleteHabit = async (id: string) => {
    try {
      const habitCompletions = await databases.listRows({
        databaseId,
        tableId: completionsTableId,
        queries: [
          Query.equal("user_id", user?.$id ?? ""),
          Query.equal("habit_id", id),
        ],
      });
      for (const hc of habitCompletions.rows) {
        await databases.deleteRow({databaseId, tableId: completionsTableId, rowId: hc.$id});
      }
      await databases.deleteRow({databaseId, tableId: habitsTableId, rowId: id});
    } catch (error) {
      console.error(error);
    }
  }

  const handleCompleteHabit = async (id: string) => {
    if (!user || completed?.includes(id)) return;
    try {
      const currentDate = new Date().toISOString();

      await databases.createRow({
        databaseId,
        tableId: completionsTableId,
        rowId: ID.unique(),
        data: {
          habit_id: id,
          user_id: user.$id,
          completed_at: currentDate,
        }
      });

      const habit = habits?.find((h) => h.$id === id);
      if (!habit) return;

      await databases.updateRow({
        databaseId,
        tableId: habitsTableId,
        rowId: id,
        data: {
          streak_count: habit.streak_count+1,
          last_completed: currentDate,
        }
      })
    } catch (error) {
      console.error(error);
    }
  }

  const isHabitCompleted = (habitId: string) => completed?.includes(habitId);

  const renderLeftActions = () => (
      <View style={styles.swipeLeftAction}>
        <MaterialCommunityIcons name="trash-can-outline" size={32} color="#fff"/>
      </View>
  )
  const renderRightActions = (habitId: string) => (
      <View style={styles.swipeRightAction}>
      {isHabitCompleted(habitId) ? (
        <Text style={{color: "#fff"}}>Completed!</Text>
      ) : (
        <MaterialCommunityIcons name="check-circle-outline" size={32} color="#fff"/>
      )}
      </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text
        variant="headlineSmall"
        style={styles.title}
        >
          {"Your habits"}
        </Text>
        <Button
        mode="text"
        onPress={signOut}
        icon={"logout"}
        >
        Sign out
      </Button>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {habits?.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No habits yet. Add your first habit!</Text>
          </View>
        ) : (
          habits?.map((habit, key) => (
            <Swipeable
            ref={(ref) => {
              swipeableRefs.current[habit.$id] = ref;
            }}
            key={key}
            overshootLeft={false}
            overshootRight={false}
            renderLeftActions={renderLeftActions}
            renderRightActions={() => renderRightActions(habit.$id)}
            onSwipeableOpen={(direction) => {
              if(direction === "left") {
                handleDeleteHabit(habit.$id);
              } else if (direction === "right") {
                handleCompleteHabit(habit.$id)
              }
              swipeableRefs.current[habit.$id]?.close();
            }}
            >
              <Surface
              style={[
                styles.card,
                // isHabitCompleted(habit.$id) && styles.cardCompleted
              ]}
              elevation={0}
              >
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{habit.title}</Text>
                    <Text style={styles.cardDescription}>{habit.description}</Text>
                    <View style={styles.cardFooter}>
                      <View style={styles.streakBadge}>
                        <MaterialCommunityIcons name="fire" size={18} color={"#ff9800"}/>
                        <Text style={styles.streakText}>{habit.streak_count} day(s) streak</Text>
                      </View>
                      <View style={styles.frequencyBadge}>
                        <Text style={styles.frequencyText}>{
                          habit.frequency.charAt(0).toUpperCase() +
                          habit.frequency.slice(1)
                        }</Text>
                      </View>
                    </View>
                  {isHabitCompleted(habit.$id) && (<View style={styles.cardCompleted}/>)}
                </View>
              </Surface>
            </Swipeable>
          ))
        )}
      </ScrollView> 
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontWeight: "bold",
  },
  card: {
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: "#f7f2fa",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cardCompleted: {
    opacity: 0.6,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: "#f7f2fa",
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#22223b",
  },
  cardDescription: {
    fontSize: 15,
    marginBottom: 16,
    color: "#6c6c80",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  streakText: {
    marginLeft: 6,
    color: "#ff9800",
    fontWeight: "bold",
    fontSize: 14,
  },
  frequencyBadge: {
    backgroundColor: "#ede7f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  frequencyText: {
    color: "#7c4dff",
    fontWeight: "bold",
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateText: {
    color: "#666666",
  },
  swipeLeftAction: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    backgroundColor: "#e53935",
    borderRadius: 18,
    marginBottom: 18,
    marginTop: 2,
    paddingLeft: 16,
  },
  swipeRightAction: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-end",
    backgroundColor: "#4caf50",
    borderRadius: 18,
    marginBottom: 18,
    marginTop: 2,
    paddingRight: 16,
  },
});
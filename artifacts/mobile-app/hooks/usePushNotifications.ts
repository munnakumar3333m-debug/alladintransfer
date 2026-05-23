import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { getApiUrl } from "@workspace/api-client-react";
import AsyncStorage from "@react-native-async-storage/async-storage";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const TOKEN_REGISTERED_KEY = "push_token_registered";

export function usePushNotifications(isAuthenticated: boolean) {
  useEffect(() => {
    if (!isAuthenticated) return;
    if (Platform.OS === "web") return;

    async function register() {
      if (!Device.isDevice) return;

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") return;

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Alladin Alerts",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#10B981",
          sound: "default",
          enableVibrate: true,
        });
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "adf3bf51-f8c7-4297-81e1-ad3757a62127",
      });
      const token = tokenData.data;

      const alreadyRegistered = await AsyncStorage.getItem(TOKEN_REGISTERED_KEY);
      if (alreadyRegistered === token) return;

      const authToken = await AsyncStorage.getItem("auth_token");
      if (!authToken) return;

      const base = getApiUrl();
      await fetch(`${base}api/notifications/register-device`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          token,
          platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web",
        }),
      });

      await AsyncStorage.setItem(TOKEN_REGISTERED_KEY, token);
    }

    register();
  }, [isAuthenticated]);
}

import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAppContext } from "../context/AppContext";
import LoginScreen from "../screens/LoginScreen";
import MapScreen from "../screens/MapScreen";
import ProgressScreen from "../screens/ProgressScreen";
import { theme } from "../styles/theme";

const Tab = createBottomTabNavigator();

function BrandHeaderTitle({ subtitle }) {
  return (
    <View style={styles.headerTitleWrap}>
      <Text style={styles.headerBrand}>Exerion</Text>
      <Text style={styles.headerSubtitle}>{subtitle}</Text>
    </View>
  );
}

function LogoutButton() {
  const { logout } = useAppContext();

  return (
    <Pressable hitSlop={10} onPress={logout} style={styles.logoutButton}>
      <Text style={styles.logoutButtonText}>Sair</Text>
    </Pressable>
  );
}

function LoggedArea() {
  const { usuario } = useAppContext();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.sidebar,
            borderBottomColor: theme.colors.border,
            borderBottomWidth: 2,
          },
          headerShadowVisible: false,
          headerTintColor: theme.colors.textStrong,
          headerRight: () => <LogoutButton />,
          tabBarStyle: {
            backgroundColor: theme.colors.sidebar,
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,
            height: 72,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: theme.colors.primaryDark,
          tabBarInactiveTintColor: theme.colors.primarySoft,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "700",
          },
          sceneStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      >
        <Tab.Screen
          component={MapScreen}
          name="Mapa"
          options={{
            headerTitle: () => (
              <BrandHeaderTitle
                subtitle={
                  usuario ? `Mapa de ${usuario.nome.split(" ")[0]}` : "Mapa gamificado"
                }
              />
            ),
            tabBarLabel: "Mapa",
          }}
        />
        <Tab.Screen
          component={ProgressScreen}
          name="Progresso"
          options={{
            headerTitle: () => <BrandHeaderTitle subtitle="Seu progresso" />,
            tabBarLabel: "Progresso",
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function AppNavigator() {
  const { usuario } = useAppContext();

  if (!usuario) {
    return <LoginScreen />;
  }

  return <LoggedArea />;
}

const styles = StyleSheet.create({
  headerTitleWrap: {
    alignItems: "center",
    gap: 2,
  },
  headerBrand: {
    color: theme.colors.textStrong,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  headerSubtitle: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  logoutButton: {
    backgroundColor: "transparent",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  logoutButtonText: {
    color: theme.colors.textStrong,
    fontSize: 12,
    fontWeight: "700",
  },
});

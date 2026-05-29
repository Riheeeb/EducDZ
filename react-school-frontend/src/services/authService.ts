import api from "@/services/api";
import { clearSession } from "@/services/authStorage";

export const logoutUser = async () => {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    console.error("Logout request failed", error);
  } finally {
    clearSession();
  }
};

import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userData = await AsyncStorage.getItem("user");
        const businessData = await AsyncStorage.getItem("business");
        const roleData = await AsyncStorage.getItem("userRole");

        console.log("AuthContext - Loading from AsyncStorage:", {
          hasToken: !!token,
          userData: userData ? JSON.parse(userData) : null,
          businessData: businessData ? JSON.parse(businessData) : null,
          roleData,
        });

        if (userData) {
          const parsedUser = JSON.parse(userData);
          console.log("AuthContext - Setting user:", parsedUser);
          setUser(parsedUser);
        }

        if (businessData) {
          const parsedBusiness = JSON.parse(businessData);
          const actualBusiness = parsedBusiness.data || parsedBusiness;
          console.log("AuthContext - Setting business:", actualBusiness);
          setBusiness(actualBusiness);
        }

        if (roleData) {
          console.log("AuthContext - Setting role:", roleData);
          setUserRole(roleData);
        }

        console.log("🔍 AuthContext - Final loaded state:", {
          user: userData ? JSON.parse(userData).firstName : null,
          business: businessData
            ? JSON.parse(businessData).businessName ||
              JSON.parse(businessData).data?.businessName
            : null,
          role: roleData,
        });
      } catch (err) {
        console.error("AuthContext - Error loading user data:", err);
      } finally {
        setLoading(false);
        console.log("AuthContext - Loading complete");
      }
    };
    loadUser();
  }, []);

  const login = async (userData, token, role = null, businessData = null) => {
    try {
      console.log("AuthContext - Login called with:", {
        user: userData.firstName,
        role,
        business:
          businessData?.businessName ||
          businessData?.data?.businessName ||
          null,
      });

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      if (role) {
        await AsyncStorage.setItem("userRole", role);
        setUserRole(role);
      }

      if (businessData) {

        await AsyncStorage.setItem("business", JSON.stringify(businessData));

        const actualBusiness = businessData.data || businessData;
        setBusiness(actualBusiness);
      }

      setUser(userData);

      console.log("AuthContext - Login complete");
    } catch (err) {
      console.error("AuthContext - Error during login:", err);
    }
  };

  const selectBusiness = async (businessData) => {
    try {
      console.log(
        "AuthContext - Selecting business:",
        businessData.businessName
      );
      await AsyncStorage.setItem("business", JSON.stringify(businessData));
      setBusiness(businessData);
      console.log("AuthContext - Business selected");
    } catch (err) {
      console.error("AuthContext - Error selecting business:", err);
    }
  };

  const logout = async () => {
    try {
      console.log("AuthContext - Logout called");
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("business");
      await AsyncStorage.removeItem("userRole");
      setUser(null);
      setBusiness(null);
      setUserRole(null);
      console.log("AuthContext - Logout complete");
    } catch (err) {
      console.error("AuthContext - Error during logout:", err);
    }
  };

  const clearBusinessSelection = async () => {
    try {
      console.log("AuthContext - Clearing business selection");
      await AsyncStorage.removeItem("business");
      setBusiness(null);
      console.log("AuthContext - Business selection cleared");
    } catch (err) {
      console.error("AuthContext - Error clearing business selection:", err);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        business,
        userRole,
        setBusiness,
        login,
        logout,
        selectBusiness,
        clearBusinessSelection,
        loading,
     
        isMerchant: () => userRole === "merchant",
        isEmployee: () => userRole === "employee",
        hasSelectedBusiness: () => !!business,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

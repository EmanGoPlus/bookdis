import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const CustomerContext = createContext();

export const CustomerProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        const customerData = await AsyncStorage.getItem("customer");
        const membershipData = await AsyncStorage.getItem("memberships");
        const selectedBusinessData = await AsyncStorage.getItem("selectedBusiness");

        if (customerData) setCustomer(JSON.parse(customerData));
        if (membershipData) setMemberships(JSON.parse(membershipData));
        if (selectedBusinessData) setSelectedBusiness(JSON.parse(selectedBusinessData));
      } catch (err) {
        console.error("CustomerContext - Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadCustomerData();
  }, []);

  const login = async (customerData, membershipsData = [], selectedBusinessData = null) => {
    try {
      await AsyncStorage.setItem("customer", JSON.stringify(customerData));
      await AsyncStorage.setItem("memberships", JSON.stringify(membershipsData));

      setCustomer(customerData);
      setMemberships(membershipsData);

      if (selectedBusinessData) {
        await AsyncStorage.setItem("selectedBusiness", JSON.stringify(selectedBusinessData));
        setSelectedBusiness(selectedBusinessData);
      }
    } catch (err) {
      console.error("CustomerContext - Error during login:", err);
    }
  };


  const selectBusiness = async (business) => {
    try {
      await AsyncStorage.setItem("selectedBusiness", JSON.stringify(business));
      setSelectedBusiness(business);
    } catch (err) {
      console.error("CustomerContext - Error selecting business:", err);
    }
  };


  const logout = async () => {
    try {
      await AsyncStorage.removeItem("customer");
      await AsyncStorage.removeItem("memberships");
      await AsyncStorage.removeItem("selectedBusiness");

      setCustomer(null);
      setMemberships([]);
      setSelectedBusiness(null);
    } catch (err) {
      console.error("CustomerContext - Error during logout:", err);
    }
  };

  const clearSelectedBusiness = async () => {
    try {
      await AsyncStorage.removeItem("selectedBusiness");
      setSelectedBusiness(null);
    } catch (err) {
      console.error("CustomerContext - Error clearing selected business:", err);
    }
  };

  return (
    <CustomerContext.Provider
      value={{
        customer,
        memberships,
        selectedBusiness,
        loading,
        login,
        logout,
        selectBusiness,
        clearSelectedBusiness,
        hasMemberships: () => memberships.length > 0,
        hasSelectedBusiness: () => !!selectedBusiness,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

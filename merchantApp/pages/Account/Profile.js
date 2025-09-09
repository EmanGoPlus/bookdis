import React, { useState, useEffect } from "react";
import { 
  SafeAreaView, 
  Text, 
  StyleSheet, 
  StatusBar, 
  ScrollView, 
  View, 
  Image,
  TouchableOpacity,
  Dimensions
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import { API_BASE_URL } from "../../apiConfig";

const { width } = Dimensions.get('window');

export default function Profile({ route, navigation }) {
   const {
    businessName,
    logo,
    mainCategory,
    subCategory,
    region,
    province,
    city,
    barangay,
    postalCode,
      addressDetails,
    openTime,
    closeTime,
    verificationStatus,
  } = route.params || {};

   const [image, setImage] = useState(logo || null);
   const [fontsLoaded] = useFonts({
     "HessGothic-Bold": require("../../assets/fonts/HessGothicRoundNFW01-Bold.ttf"),
   });

   if (!fontsLoaded) return null;

   // Debug: Log the logo URL to see what's being constructed
   const logoUrl = logo ? `${API_BASE_URL}/${logo}` : null;
   console.log("🖼️ Logo URL:", logoUrl);
   console.log("🖼️ API_BASE_URL:", API_BASE_URL);
   console.log("🖼️ Logo path:", logo);

   const handleBackPress = () => {
     navigation.goBack();
   };

   const ProfileCard = ({ title, value, icon }) => (
     <View style={styles.profileCard}>
       <View style={styles.cardHeader}>
         <Text style={styles.cardIcon}>{icon}</Text>
         <Text style={styles.cardTitle}>{title}</Text>
       </View>
       <Text style={styles.cardValue}>{value}</Text>
     </View>
   );

   const ActionButton = ({ title, onPress, color = "#fff", backgroundColor = "rgba(255,255,255,0.2)" }) => (
     <TouchableOpacity 
       style={[styles.actionButton, { backgroundColor }]}
       onPress={onPress}
       activeOpacity={0.8}
     >
       <Text style={[styles.actionButtonText, { color }]}>{title}</Text>
     </TouchableOpacity>
   );

   return (
     <LinearGradient
       colors={["#ffce54", "#fda610", "#f75c3c"]}
       start={{ x: 0, y: 0 }}
       end={{ x: 0, y: 1 }}
       style={styles.background}
     >
       <StatusBar
         barStyle="light-content"
         translucent
         backgroundColor="transparent"
       />
       
       <SafeAreaView style={styles.container}>
         {/* Header */}
         <View style={styles.header}>
           <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
             <Text style={styles.backButtonText}>←</Text>
           </TouchableOpacity>
           <Text style={styles.headerTitle}>Business Profile</Text>
           <TouchableOpacity style={styles.menuButton}>
             <Text style={styles.menuButtonText}>⋮</Text>
           </TouchableOpacity>
         </View>

         <ScrollView
           contentContainerStyle={styles.scrollContent}
           showsVerticalScrollIndicator={false}
         >
           {/* Profile Section */}
           <View style={styles.profileSection}>
             <View style={styles.logoContainer}>
               <View style={styles.logoWrapper}>
                 <Image
                   source={
                     logo
                       ? { uri: logoUrl }
                       : require("../../assets/default-image.png")
                   }
                   style={styles.logoImage}
                   onError={(error) => {
                     console.log("❌ Image load error:", error.nativeEvent.error);
                   }}
                   onLoad={() => {
                     console.log("✅ Image loaded successfully");
                   }}
                 />
                 <View style={styles.logoOverlay}>
                   <Text style={styles.logoEditText}>📷</Text>
                 </View>
               </View>
             </View>
             
             <View style={styles.businessInfo}>
               <Text style={styles.businessName}>
                 {businessName || "Custom Business Name"}
               </Text>
               <Text style={styles.businessSubtitle}>
                 Not Verified
               </Text>
             </View>
           </View>

           {/* Profile Details */}
<View style={styles.detailsContainer}>
  <ProfileCard 
    title="Business Type" 
    value={`${mainCategory || ""}${subCategory ? " - " + subCategory : ""}`} 
    icon="🏪"
  />
<ProfileCard 
  title="Location" 
  value={
    `${addressDetails ? addressDetails + ", " : ""}` + 
    `${barangay ? barangay + ", " : ""}` +
    `${city ? city + ", " : ""}` +
    `${province || ""}` +
    `${region ? " (" + region + ")" : ""}` +
    `${postalCode ? " - " + postalCode : ""}`
  } 
  icon="📍"
/>

  <ProfileCard 
    title="Operating Hours" 
    value={`${openTime || ""} - ${closeTime || ""}`} 
    icon="⏰"
  />
  <ProfileCard 
    title="Verification Status" 
    value={verificationStatus ? "Verified ✅" : "Not Verified ❌"} 
    icon="✔️"
  />
</View>


           {/* Action Buttons */}
           <View style={styles.actionContainer}>
             <ActionButton 
               title="Edit Profile" 
               onPress={() => console.log("Edit pressed")}
               backgroundColor="rgba(255,255,255,0.9)"
               color="#f75c3c"
             />
           </View>

           <View style={styles.bottomPadding} />
         </ScrollView>
       </SafeAreaView>
     </LinearGradient>
   );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'HessGothic-Bold',
    fontWeight: '600',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },

  // Scroll Content
  scrollContent: {
    paddingHorizontal: 20,
  },

  // Profile Section
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoWrapper: {
    position: 'relative',
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#f75c3c',
  },
  logoEditText: {
    fontSize: 16,
  },
  businessInfo: {
    alignItems: 'center',
  },
  businessName: {
    fontSize: 28,
    color: '#fff',
    fontFamily: 'HessGothic-Bold',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  businessSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },

  // Details Container
  detailsContainer: {
    marginBottom: 30,
  },
  profileCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardValue: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },

  // Action Container
  actionContainer: {
    marginBottom: 20,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  bottomPadding: {
    height: 20,
  },
});
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Shadow } from "react-native-shadow-2";


const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 40; 
const CARD_SPACING = 0; 

// Sample member data
const SAMPLE_MEMBERS = [
  {
    id: 1,
    name: "Eman Domo",
   
  },
  {
    id: 2,
    name: "Beatrez Sipon",
    
  },
  {
    id: 3,
    name: "Bibi Domo",
    
  },
  {
    id: 4,
    name: "Jose Rizal",
   
  },
  {
    id: 5,
    name: "Go Plus",
   
  },
  {
    id: 6,
    name: "Emma Johnson",
  
  },
  {
    id: 7,
    name: "Robert Garcia",
    
  },
  {
    id: 8,
    name: "Lisa Anderson",
    
  },
  {
    id: 9,
    name: "Tom Wilson",

  }
];

const MemberCard = ({ members, index }) => {
  const getAvatarColor = (name) => {
    const colors = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16'];
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

 return (
    <Shadow
      distance={10} 
      startColor={"#3E0994AD"}
      offset={[0, 6]}
      containerViewStyle={{ borderRadius: 16 }}
      style={styles.memberCard}
    >
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={styles.cardGradient}
      >
        {members.map((member, memberIndex) => (
          <View key={member.id} style={styles.memberRow}>
            <View style={styles.avatarContainer}>
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: getAvatarColor(member.name) },
                ]}
              >
                <Text style={styles.avatarText}>{getInitials(member.name)}</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.memberName}>{member.name}</Text>
            </View>
          </View>
        ))}
      </LinearGradient>
    </Shadow>
  );
};

const InfiniteMembersSwipe = ({ members = SAMPLE_MEMBERS }) => {
  const scrollViewRef = useRef(null);
  
  const groupedMembers = [];
  for (let i = 0; i < members.length; i += 3) {
    groupedMembers.push(members.slice(i, i + 3));
  }
  
  const [currentIndex, setCurrentIndex] = useState(groupedMembers.length); // Start at first real item
  const [isScrolling, setIsScrolling] = useState(false);
  

  const extendedGroups = [
    ...groupedMembers,
    ...groupedMembers,
    ...groupedMembers,
  ];

  useEffect(() => {
    const autoScroll = setInterval(() => {
      if (!isScrolling && scrollViewRef.current) {
        const nextIndex = currentIndex + 1;
        
        scrollViewRef.current.scrollTo({
          x: nextIndex * CARD_WIDTH,
          animated: true,
        });
        
        setCurrentIndex(nextIndex);
      }
    }, 3000);

    return () => clearInterval(autoScroll);
  }, [currentIndex, isScrolling]);

  useEffect(() => {
    if (currentIndex >= groupedMembers.length * 2) {

      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: groupedMembers.length * CARD_WIDTH,
          animated: false,
        });
        setCurrentIndex(groupedMembers.length);
      }, 100);
    } else if (currentIndex < groupedMembers.length) {

      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: (groupedMembers.length * 2 - 1) * CARD_WIDTH,
          animated: false,
        });
        setCurrentIndex(groupedMembers.length * 2 - 1);
      }, 100);
    }
  }, [currentIndex, groupedMembers.length]);

  const handleScrollBeginDrag = () => {
    setIsScrolling(true);
  };

  const handleMomentumScrollEnd = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(scrollPosition / CARD_WIDTH);
    setCurrentIndex(newIndex);
    setIsScrolling(false);
  };

  const getDisplayIndex = () => {
    if (currentIndex < groupedMembers.length) {
      return currentIndex;
    } else if (currentIndex >= groupedMembers.length * 2) {
      return currentIndex - groupedMembers.length * 2;
    } else {
      return currentIndex - groupedMembers.length;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={handleScrollBeginDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContainer}
        style={styles.scrollView}
      >
        {extendedGroups.map((memberGroup, index) => (
          <View key={`group-${index}`} style={styles.cardWrapper}>
            <MemberCard 
              members={memberGroup} 
              index={index % groupedMembers.length} 
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    marginHorizontal: -20, // Offset parent padding
  },
  scrollContainer: {
    paddingHorizontal: 20,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: CARD_SPACING,
    paddingRight: 20,
    marginTop: 30,
  },
memberCard: {
  width: "100%",
  height: 140,
  borderRadius: 16,
  backgroundColor: "#fff",
},

  cardGradient: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'center',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1f2937',
    textTransform: 'uppercase',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  memberSince: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 'auto',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6366f1',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e7eb',
  },
  cardFooter: {
    height: 4,
    marginTop: 8,
  },
  footerGradient: {
    flex: 1,
    borderRadius: 2,
  },
});

export default InfiniteMembersSwipe;
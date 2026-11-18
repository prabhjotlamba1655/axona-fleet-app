import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  Truck,
  Search,
  Filter,
  Layers,
  ChevronRight,
  X,
  Navigation2,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';
import { Header } from '../components/Header';
import { VehicleCard } from '../components/VehicleCard';
import { useTelematicsStore } from '../store/telematicsStore';

interface VehicleListScreenProps {
  navigation: any;
  route?: any;
}

export const VehicleListScreen: React.FC<VehicleListScreenProps> = ({ navigation, route }) => {
  const {
    vehicles,
    livePositions,
    categories,
    fetchVehicles,
    fetchLivePositions,
    fetchCategories,
  } = useTelematicsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>(
    (route?.params?.statusFilter || 'ALL').toUpperCase()
  );
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchVehicles();
    fetchLivePositions();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (route?.params?.statusFilter) {
      setSelectedStatus(route.params.statusFilter.toUpperCase());
    }
  }, [route?.params?.statusFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchVehicles(), fetchLivePositions(), fetchCategories()]);
    setRefreshing(false);
  };

  // Status counts
  let movingCount = 0;
  let idleCount = 0;
  let stoppedCount = 0;
  let offlineCount = 0;

  vehicles.forEach((v) => {
    const loc = livePositions[v.id];
    const st = (loc?.movement_status || 'offline').toLowerCase();
    if (st === 'moving') movingCount++;
    else if (st === 'idle') idleCount++;
    else if (st === 'stopped') stoppedCount++;
    else offlineCount++;
  });

  const filteredVehicles = vehicles.filter((v) => {
    const loc = livePositions[v.id];
    const st = (loc?.movement_status || 'offline').toUpperCase();

    if (selectedStatus !== 'ALL') {
      if (selectedStatus === 'MOVING' && st !== 'MOVING') return false;
      if (selectedStatus === 'IDLE' && st !== 'IDLE') return false;
      if (selectedStatus === 'STOPPED' && st !== 'STOPPED') return false;
      if (
        (selectedStatus === 'OFFLINE' || selectedStatus === 'INACTIVE') &&
        st !== 'OFFLINE' &&
        st !== 'INACTIVE'
      ) {
        return false;
      }
    }

    if (selectedCategory !== 'ALL') {
      if (v.category_name !== selectedCategory && String(v.category_id) !== selectedCategory) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchReg = v.registration_number?.toLowerCase().includes(q);
      const matchModel = `${v.make} ${v.model}`.toLowerCase().includes(q);
      const matchOwner = v.owner_name?.toLowerCase().includes(q);
      if (!matchReg && !matchModel && !matchOwner) return false;
    }

    return true;
  });

  return (
    <View style={styles.container}>
      <Header
        navigation={navigation}
        showBack={true}
        showHome={true}
        title="FLEET ASSETS"
        subtitle="7 Vehicle Segments Supported"
      />

      <View style={styles.controlsBar}>
        <View style={styles.searchBar}>
          <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search registration, make, model..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filter Tabs (ALL, MOVING, IDLE, STOPPED, INACTIVE) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusScroll}>
          <TouchableOpacity
            style={[
              styles.statusPill,
              selectedStatus === 'ALL' && styles.statusPillActive,
            ]}
            onPress={() => setSelectedStatus('ALL')}
          >
            <Text
              style={[
                styles.statusPillText,
                selectedStatus === 'ALL' && styles.statusPillTextActive,
              ]}
            >
              All Assets ({vehicles.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusPill,
              selectedStatus === 'MOVING' && styles.statusPillMovingActive,
            ]}
            onPress={() => setSelectedStatus('MOVING')}
          >
            <View style={[styles.statusDot, { backgroundColor: colors.statusMoving }]} />
            <Text
              style={[
                styles.statusPillText,
                selectedStatus === 'MOVING' && styles.statusPillTextActive,
              ]}
            >
              Moving ({movingCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusPill,
              selectedStatus === 'IDLE' && styles.statusPillIdleActive,
            ]}
            onPress={() => setSelectedStatus('IDLE')}
          >
            <View style={[styles.statusDot, { backgroundColor: colors.statusIdle }]} />
            <Text
              style={[
                styles.statusPillText,
                selectedStatus === 'IDLE' && styles.statusPillTextActive,
              ]}
            >
              Idle ({idleCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusPill,
              selectedStatus === 'STOPPED' && styles.statusPillStoppedActive,
            ]}
            onPress={() => setSelectedStatus('STOPPED')}
          >
            <View style={[styles.statusDot, { backgroundColor: colors.statusStopped }]} />
            <Text
              style={[
                styles.statusPillText,
                selectedStatus === 'STOPPED' && styles.statusPillTextActive,
              ]}
            >
              Stopped ({stoppedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusPill,
              (selectedStatus === 'OFFLINE' || selectedStatus === 'INACTIVE') && styles.statusPillOfflineActive,
            ]}
            onPress={() => setSelectedStatus('OFFLINE')}
          >
            <View style={[styles.statusDot, { backgroundColor: colors.statusDisconnected }]} />
            <Text
              style={[
                styles.statusPillText,
                (selectedStatus === 'OFFLINE' || selectedStatus === 'INACTIVE') && styles.statusPillTextActive,
              ]}
            >
              Offline GPS ({offlineCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 7 Vehicle Categories Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          <TouchableOpacity
            style={[
              styles.catTab,
              selectedCategory === 'ALL' && styles.catTabActive,
            ]}
            onPress={() => setSelectedCategory('ALL')}
          >
            <Text
              style={[
                styles.catTabText,
                selectedCategory === 'ALL' && styles.catTabTextActive,
              ]}
            >
              All Segments ({vehicles.length})
            </Text>
          </TouchableOpacity>

          {categories.map((c) => (
            <TouchableOpacity
              key={c.code}
              style={[
                styles.catTab,
                selectedCategory === c.name && styles.catTabActive,
              ]}
              onPress={() => setSelectedCategory(c.name)}
            >
              <Text
                style={[
                  styles.catTabText,
                  selectedCategory === c.name && styles.catTabTextActive,
                ]}
              >
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primaryNavy]} />
        }
      >
        <Text style={styles.listHeading}>
          {selectedStatus === 'ALL'
            ? `ONBOARDED ASSETS (${filteredVehicles.length})`
            : `ONBOARDED ASSETS • ${selectedStatus} (${filteredVehicles.length})`}
        </Text>

        {filteredVehicles.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No vehicles found matching current filter.</Text>
          </View>
        ) : (
          filteredVehicles.map((vehicle) => {
            const loc = livePositions[vehicle.id];
            return (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                location={loc}
                onPress={() => navigation.navigate('VehicleDetails', { vehicleId: vehicle.id })}
                onTrackPress={() => navigation.navigate('LiveMap', { vehicleId: vehicle.id })}
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  controlsBar: {
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    ...shadows.subtle,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    padding: 0,
  },
  statusScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.surfaceLight,
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusPillActive: {
    backgroundColor: colors.primaryNavy,
    borderColor: colors.primaryNavy,
  },
  statusPillMovingActive: {
    backgroundColor: colors.statusMoving,
    borderColor: colors.statusMoving,
  },
  statusPillIdleActive: {
    backgroundColor: colors.statusIdle,
    borderColor: colors.statusIdle,
  },
  statusPillStoppedActive: {
    backgroundColor: colors.statusStopped,
    borderColor: colors.statusStopped,
  },
  statusPillOfflineActive: {
    backgroundColor: colors.statusDisconnected,
    borderColor: colors.statusDisconnected,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  statusPillTextActive: {
    color: '#FFFFFF',
  },
  catScroll: {
    flexDirection: 'row',
  },
  catTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceLight,
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  catTabActive: {
    backgroundColor: colors.primaryNavy,
    borderColor: colors.primaryNavy,
  },
  catTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  catTabTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 160,
  },
  listHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  emptyWrap: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

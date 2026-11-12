import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Search,
  Filter,
  Navigation2,
  Layers,
  Crosshair,
  AlertTriangle,
  RefreshCw,
  X,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';
import { Header } from '../components/Header';
import { MapView } from '../components/MapView';
import { VehicleBottomSheet } from '../components/VehicleBottomSheet';
import { useTelematicsStore } from '../store/telematicsStore';
import { LatestVehicleLocation } from '../types';

interface LiveTrackingScreenProps {
  navigation: any;
  route: any;
}

export const LiveTrackingScreen: React.FC<LiveTrackingScreenProps> = ({
  navigation,
  route,
}) => {
  const {
    livePositions,
    categories,
    selectedVehicle,
    setSelectedVehicle,
    fetchLivePositions,
    fetchCategories,
  } = useTelematicsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>(
    route?.params?.statusFilter || 'ALL'
  );
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  useEffect(() => {
    fetchLivePositions();
    fetchCategories();

    if (route?.params?.vehicleId && livePositions[route.params.vehicleId]) {
      setSelectedVehicle(livePositions[route.params.vehicleId]);
    }
  }, [route?.params]);

  const vehiclesList = Object.values(livePositions);

  // Filter logic
  const filteredVehicles = vehiclesList.filter((v) => {
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchReg = v.registration_number?.toLowerCase().includes(q);
      const matchModel = `${v.make} ${v.model}`.toLowerCase().includes(q);
      const matchDriver = v.driver_name?.toLowerCase().includes(q);
      if (!matchReg && !matchModel && !matchDriver) return false;
    }

    // Category filter
    if (selectedCategory !== 'ALL') {
      if (v.category_name !== selectedCategory && v.category_code !== selectedCategory) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'emergency' && v.panic_status !== 1) return false;
      if (statusFilter === 'moving' && (v.movement_status !== 'moving' || v.panic_status === 1)) return false;
      if (statusFilter === 'idle' && (v.movement_status !== 'idle' || v.panic_status === 1)) return false;
      if (statusFilter === 'stopped' && (v.movement_status !== 'stopped' || v.panic_status === 1)) return false;
      if (statusFilter === 'offline' && (v.movement_status !== 'offline' || v.panic_status === 1)) return false;
    }

    return true;
  });

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />

      {/* Floating Search & Filter Bar */}
      <View style={styles.topControls}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search reg, driver, model..."
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

          <TouchableOpacity
            style={[
              styles.filterBtn,
              (selectedCategory !== 'ALL' || statusFilter !== 'ALL') && styles.filterBtnActive,
            ]}
            onPress={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
          >
            <Filter size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Status Quick Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusPillsScroll}
        >
          {[
            { id: 'ALL', label: `All (${vehiclesList.length})` },
            { id: 'moving', label: 'Moving', color: colors.statusMoving },
            { id: 'idle', label: 'Idle', color: colors.statusIdle },
            { id: 'stopped', label: 'Stopped', color: colors.statusStopped },
            { id: 'emergency', label: 'SOS Alert', color: colors.statusEmergency },
            { id: 'offline', label: 'Offline', color: colors.statusDisconnected },
          ].map((pill) => (
            <TouchableOpacity
              key={pill.id}
              style={[
                styles.statusPill,
                statusFilter === pill.id && styles.statusPillActive,
              ]}
              onPress={() => setStatusFilter(pill.id)}
            >
              {pill.color && (
                <View style={[styles.pillDot, { backgroundColor: pill.color }]} />
              )}
              <Text
                style={[
                  styles.statusPillText,
                  statusFilter === pill.id && styles.statusPillTextActive,
                ]}
              >
                {pill.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Category Filter Drawer if open */}
      {isFilterPanelOpen && (
        <View style={styles.categoryPanel}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>FILTER BY VEHICLE CATEGORY</Text>
            <TouchableOpacity onPress={() => setIsFilterPanelOpen(false)}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.catBadge,
                selectedCategory === 'ALL' && styles.catBadgeActive,
              ]}
              onPress={() => setSelectedCategory('ALL')}
            >
              <Text
                style={[
                  styles.catBadgeText,
                  selectedCategory === 'ALL' && styles.catBadgeTextActive,
                ]}
              >
                All Segments
              </Text>
            </TouchableOpacity>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.code}
                style={[
                  styles.catBadge,
                  selectedCategory === c.name && styles.catBadgeActive,
                ]}
                onPress={() => setSelectedCategory(c.name)}
              >
                <Text
                  style={[
                    styles.catBadgeText,
                    selectedCategory === c.name && styles.catBadgeTextActive,
                  ]}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          vehicles={filteredVehicles}
          selectedVehicleId={selectedVehicle?.vehicle_id}
          onSelectVehicle={(v) => setSelectedVehicle(v)}
          height="100%"
        />

        {/* Floating Count Overlay */}
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>
            Showing {filteredVehicles.length} of {vehiclesList.length} Vehicles
          </Text>
        </View>

        {/* Refresh button */}
        <TouchableOpacity
          style={styles.refreshFab}
          onPress={() => fetchLivePositions()}
        >
          <RefreshCw size={18} color={colors.primaryNavy} />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet on selected vehicle */}
      {selectedVehicle && (
        <View style={styles.bottomSheetWrapper}>
          <VehicleBottomSheet
            vehicle={selectedVehicle}
            onClose={() => setSelectedVehicle(null)}
            navigation={navigation}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topControls: {
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    ...shadows.subtle,
    zIndex: 10,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    padding: 0,
  },
  filterBtn: {
    backgroundColor: colors.primaryNavy,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: colors.accentBlue,
  },
  statusPillsScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  statusPillActive: {
    backgroundColor: colors.primaryNavy,
    borderColor: colors.primaryNavy,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusPillTextActive: {
    color: '#FFFFFF',
  },
  categoryPanel: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    zIndex: 9,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  catBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.surfaceLight,
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  catBadgeActive: {
    backgroundColor: colors.secondaryNavy,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  catBadgeTextActive: {
    color: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  countBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(16, 44, 80, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    zIndex: 5,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  refreshFab: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.elevated,
    zIndex: 5,
  },
  bottomSheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
});

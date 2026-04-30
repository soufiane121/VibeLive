import React, {useMemo} from 'react';
import {CircleLayer, ShapeSource} from '@rnmapbox/maps';
import {VenueData} from '../../../features/voting/VotingApi';

interface MapHeatmapLayerProps {
  onVenuePress: (venue: VenueData) => void;
  heatmapData: any;
}

const MapHeatmapLayer: React.FC<MapHeatmapLayerProps> = ({
  onVenuePress,
  heatmapData,
}) => {

  // Build a lookup map so we can retrieve full venue objects (with nested
  // fields like address, businessHours) on press — GeoJSON properties are
  // flattened to primitives by Mapbox so we only put styling scalars there.
  const venueLookup = useMemo(() => {
    const venues: VenueData[] = heatmapData?.heatmap || [];
    const map = new Map<string, VenueData>();
    for (const v of venues) {
      map.set(String(v.id), v);
    }
    return map;
  }, [heatmapData]);

  const heatmapGeoJSON = useMemo(() => {
    const venues: VenueData[] = heatmapData?.heatmap || [];
    if (venues.length === 0) return null;

    return {
      type: 'FeatureCollection' as const,
      features: venues.map((v: VenueData) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: v.coordinates,
        },
        properties: {
          id: String(v.id),
          vibeScore: v.vibeScore,
          isBoostedValue: v.isBoosted ? 1 : 0,
          intensity: Math.min(Math.abs(v.vibeScore) / 100, 1),
        },
      })),
    };
  }, [heatmapData]);

  if (!heatmapGeoJSON) return null;

  const handlePress = (e: any) => {
    const feature = e.features?.[0];
    const venueId = feature?.properties?.id;
    if (venueId) {
      const venue = venueLookup.get(venueId);
      if (venue) {
        onVenuePress(venue);
      }
    }
  };

  return (
    <ShapeSource
      id="vibe-heatmap-source"
      shape={heatmapGeoJSON}
      onPress={handlePress}>
      {/* Outer glow — large soft ring showing area activity */}
      <CircleLayer
        id="vibe-heatmap-glow"
        style={{
          circleRadius: [
            'interpolate',
            ['linear'],
            ['abs', ['get', 'vibeScore']],
            0,
            30,
            25,
            50,
            50,
            70,
            100,
            100,
          ],
          circleColor: [
            'interpolate',
            ['linear'],
            ['get', 'vibeScore'],
            -100,
            '#8CABFF',
            -50,
            '#A0BAFF',
            -10,
            '#B8CCFF',
            0,
            '#555555',
            10,
            '#7055b9',
            50,
            '#6e51bd',
            100,
            '#6C4FBB',
          ],
          circleOpacity: [
            'interpolate',
            ['linear'],
            ['abs', ['get', 'vibeScore']],
            0,
            0.04,
            20,
            0.1,
            50,
            0.16,
            100,
            0.22,
          ],
          circleBlur: 1,
        }}
      />
      {/* Mid ring — visible colored zone */}
      <CircleLayer
        id="vibe-heatmap-mid"
        style={{
          circleRadius: [
            'interpolate',
            ['linear'],
            ['abs', ['get', 'vibeScore']],
            0,
            14,
            25,
            22,
            50,
            32,
            100,
            44,
          ],
          circleColor: [
            'interpolate',
            ['linear'],
            ['get', 'vibeScore'],
            -100,
            '#8CABFF',
            -50,
            '#9AB5FF',
            -10,
            '#AABFFF',
            0,
            '#666666',
            10,
            '#7055b9',
            50,
            '#6e51bd',
            100,
            '#6C4FBB',
          ],
          circleOpacity: [
            'interpolate',
            ['linear'],
            ['abs', ['get', 'vibeScore']],
            0,
            0.08,
            20,
            0.2,
            50,
            0.32,
            100,
            0.45,
          ],
          circleBlur: 0.5,
        }}
      />
      {/* Inner core — bright dot at venue center */}
      <CircleLayer
        id="vibe-heatmap-core"
        style={{
          circleRadius: [
            'interpolate',
            ['linear'],
            ['abs', ['get', 'vibeScore']],
            0,
            5,
            25,
            8,
            50,
            11,
            100,
            15,
          ],
          circleColor: [
            'interpolate',
            ['linear'],
            ['get', 'vibeScore'],
            -100,
            '#8CABFF',
            -40,
            '#9AB5FF',
            0,
            '#777777',
            40,
            '#7055b9',
            100,
            '#6C4FBB',
          ],
          circleOpacity: [
            'interpolate',
            ['linear'],
            ['abs', ['get', 'vibeScore']],
            0,
            0.2,
            20,
            0.5,
            50,
            0.7,
            100,
            0.9,
          ],
          circleStrokeWidth: [
            'case',
            ['==', ['get', 'isBoostedValue'], 1],
            2,
            0.5,
          ],
          circleStrokeColor: [
            'case',
            ['==', ['get', 'isBoostedValue'], 1],
            '#D4AF37',
            'rgba(255,255,255,0.3)',
          ],
        }}
      />
    </ShapeSource>
  );
};

export default MapHeatmapLayer;

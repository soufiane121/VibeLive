import React, { useEffect, useRef } from 'react';
import { useAnalytics } from '../Hooks/useAnalytics';
import SocketAnalyticsService from '../Services/SocketAnalyticsService';

interface MapAnalyticsProps {
  mapRef?: any;
  onMapReady?: () => void;
}

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface MarkerData {
  id: string;
  coordinates: [number, number];
  type: string;
  streamId?: string;
  userId?: string;
  category?: string;
  title?: string;
  isLive?: boolean;
  viewerCount?: number;
  isBoosted?: boolean;
}

export const useMapAnalytics = () => {
  const { trackEvent, trackMapInteraction } = useAnalytics({ screenName: 'Map' });
  const socketAnalytics = SocketAnalyticsService.getInstance();
  const lastMapBounds = useRef<MapBounds | null>(null);
  const mapInteractionStartTime = useRef<Date | null>(null);

  // Track map marker clicks
  const trackMarkerClick = async (markerData: MarkerData) => {
    try {
      // Track via socket for real-time analytics
      socketAnalytics.trackMapMarkerClick(markerData);

      // Track locally
      await trackMapInteraction('marker_clicked', {
        markerId: markerData.id,
        markerCoordinates: markerData.coordinates,
        markerType: markerData.type,
        streamId: markerData.streamId,
        streamerId: markerData.userId,
        streamCategory: markerData.category,
        streamTitle: markerData.title,
        isLive: markerData.isLive,
        viewerCount: markerData.viewerCount,
        isBoosted: markerData.isBoosted,
        timestamp: new Date().toISOString()
      });

      console.log('Map marker click tracked:', markerData.id);
    } catch (error) {
      console.error('Failed to track marker click:', error);
    }
  };

  // Track map movement
  const trackMapMove = async (newCenter: [number, number], bounds: MapBounds) => {
    try {
      const moveData = {
        newCenter,
        bounds,
        timestamp: new Date().toISOString()
      };

      await trackMapInteraction('map_moved', moveData);

      // Track bounds change via socket if significantly different
      if (lastMapBounds.current && isBoundsSignificantlyDifferent(lastMapBounds.current, bounds)) {
        socketAnalytics.trackMapBoundsChange(bounds);
      }

      lastMapBounds.current = bounds;
    } catch (error) {
      console.error('Failed to track map move:', error);
    }
  };

  // Track map zoom
  const trackMapZoom = async (zoomLevel: number, center: [number, number]) => {
    try {
      await trackMapInteraction('map_zoomed', {
        zoomLevel,
        center,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track map zoom:', error);
    }
  };

  // Track map interaction start (user starts touching map)
  const trackMapInteractionStart = () => {
    mapInteractionStartTime.current = new Date();
  };

  // Track map interaction end (user stops touching map)
  const trackMapInteractionEnd = async (finalCenter: [number, number]) => {
    try {
      if (mapInteractionStartTime.current) {
        const interactionDuration = Date.now() - mapInteractionStartTime.current.getTime();
        
        await trackEvent('map_interaction_completed', {
          duration: Math.floor(interactionDuration / 1000),
          finalCenter,
          timestamp: new Date().toISOString()
        });

        mapInteractionStartTime.current = null;
      }
    } catch (error) {
      console.error('Failed to track map interaction end:', error);
    }
  };

  // Track category filter application
  const trackCategoryFilter = async (category: string, coordinates: [number, number], resultsCount: number) => {
    try {
      socketAnalytics.trackCategoryFilter(category, coordinates, resultsCount);
      
      await trackEvent('category_filter_applied', {
        filterCategory: category,
        coordinates,
        resultsCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track category filter:', error);
    }
  };

  // Track search queries
  const trackSearch = async (query: string, coordinates: [number, number], resultsCount: number, filterCategory?: string) => {
    try {
      socketAnalytics.trackSearch(query, coordinates, resultsCount, filterCategory);
      
      await trackEvent('search_performed', {
        searchQuery: query,
        coordinates,
        resultsCount,
        filterCategory,
        queryLength: query?.length || 0,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track search:', error);
    }
  };

  // Track stream discovery
  const trackStreamDiscovery = async (streamData: any, discoveryMethod: string) => {
    try {
      await trackEvent('stream_discovered', {
        streamId: streamData.streamId,
        streamerId: streamData.streamerId,
        streamTitle: streamData.title,
        streamCategory: streamData.category,
        coordinates: streamData.coordinates,
        discoveryMethod, // 'map_browse', 'search', 'category_filter', 'nearby_notification'
        viewerCount: streamData.viewerCount,
        isBoosted: streamData.isBoosted,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track stream discovery:', error);
    }
  };

  // Track location permission changes
  const trackLocationPermission = async (granted: boolean, accuracy?: string) => {
    try {
      await trackEvent(granted ? 'location_permission_granted' : 'location_permission_denied', {
        accuracy,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track location permission:', error);
    }
  };

  // Track map loading performance
  const trackMapLoadTime = async (loadTime: number, tileCount?: number) => {
    try {
      await trackEvent('map_loaded', {
        loadTime,
        tileCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track map load time:', error);
    }
  };

  // Helper function to determine if bounds changed significantly
  const isBoundsSignificantlyDifferent = (oldBounds: MapBounds, newBounds: MapBounds): boolean => {
    const threshold = 0.001; // Adjust based on your needs
    
    return (
      Math.abs(oldBounds.north - newBounds.north) > threshold ||
      Math.abs(oldBounds.south - newBounds.south) > threshold ||
      Math.abs(oldBounds.east - newBounds.east) > threshold ||
      Math.abs(oldBounds.west - newBounds.west) > threshold
    );
  };

  return {
    trackMarkerClick,
    trackMapMove,
    trackMapZoom,
    trackMapInteractionStart,
    trackMapInteractionEnd,
    trackCategoryFilter,
    trackSearch,
    trackStreamDiscovery,
    trackLocationPermission,
    trackMapLoadTime
  };
};

// Higher-order component to wrap map components with analytics
export const withMapAnalytics = <P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P & MapAnalyticsProps> => {
  return (props: P & MapAnalyticsProps) => {
    const mapAnalytics = useMapAnalytics();

    useEffect(() => {
      // Track map component mount
      mapAnalytics.trackMapLoadTime(0); // Will be updated with actual load time
      
      return () => {
        // Track map component unmount
        console.log('Map analytics component unmounted');
      };
    }, []);

    return <WrappedComponent {...props} />;
  };
};

export default useMapAnalytics;

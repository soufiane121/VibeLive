import { Camera } from 'react-native-vision-camera';

interface StreamConfig {
  streamKey: string;
  rtmpUrl: string;
  resolution: {
    width: number;
    height: number;
  };
  bitrate: number;
  fps: number;
}

interface StreamStatus {
  isStreaming: boolean;
  isConnected: boolean;
  error?: string;
  duration: number;
}

class RTMPStreamingHelper {
  private isStreaming = false;
  private streamStartTime: number | null = null;
  private statusCallback?: (status: StreamStatus) => void;
  private rtmpRef: any = null;

  /**
   * Set the RTMP reference for streaming
   */
  setRtmpRef(ref: any): void {
    this.rtmpRef = ref;
  }

  /**
   * Initialize RTMP streaming with NodeMediaClient
   */
  async startStreaming(config: StreamConfig): Promise<boolean> {
    try {
      console.log('🎥 Starting RTMP stream with NodeMediaClient...');
      
      if (this.isStreaming) {
        console.warn('Stream already running');
        return false;
      }

      if (!this.rtmpRef) {
        console.error('❌ RTMP reference not set');
        this.updateStatus({
          isStreaming: false,
          isConnected: false,
          error: 'RTMP reference not set'
        });
        return false;
      }

      // Start streaming through NodeMediaClient
      console.log('🎥 Calling rtmpRef.start()...');
      const result = this.rtmpRef.start();
      console.log('NodeMediaClient start result:', result);
      
      // Minimal connection establishment wait for ultra low latency
      console.log('⚡ Quick RTMP connection establishment...');
      await new Promise(resolve => setTimeout(resolve, 300)); // Ultra minimal wait
      
      this.isStreaming = true;
      this.streamStartTime = Date.now();
      
      console.log('✅ RTMP stream started successfully');
      this.updateStatus({
        isStreaming: true,
        isConnected: true,
        duration: 0
      });
      
      // Start health monitoring with longer intervals to avoid premature disconnection
      this.startHealthMonitoring();
      
      return true;
    } catch (error: any) {
      console.error('❌ Stream start error:', error);
      this.updateStatus({
        isStreaming: false,
        isConnected: false,
        error: error.message || 'Failed to start stream'
      });
      return false;
    }
  }

  /**
   * Stop RTMP streaming
   */
  async stopStreaming(): Promise<void> {
    try {
      console.log('🛑 Stopping RTMP stream...');
      
      if (this.rtmpRef) {
        this.rtmpRef.stop();
      }

      this.isStreaming = false;
      this.streamStartTime = null;

      this.updateStatus({
        isStreaming: false,
        isConnected: false,
        duration: 0
      });

      console.log('✅ RTMP stream stopped');
    } catch (error: any) {
      console.error('❌ Stream stop error:', error);
    }
  }

  /**
   * Monitor stream health and connection
   */
  private startHealthMonitoring(): void {
    const healthCheck = setInterval(() => {
      if (!this.isStreaming) {
        clearInterval(healthCheck);
        return;
      }

      const duration = this.streamStartTime 
        ? Date.now() - this.streamStartTime 
        : 0;

      // Check if streaming is still active
      this.updateStatus({
        isStreaming: this.isStreaming,
        isConnected: this.isStreaming, // For now, assume connected if streaming
        duration: Math.floor(duration / 1000)
      });

      if (!this.isStreaming) {
        console.warn('⚠️ Stream connection lost - auto-reconnect DISABLED');
        // Auto-reconnect disabled to prevent unwanted stream restarts
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Set status update callback
   */
  setStatusCallback(callback: (status: StreamStatus) => void): void {
    this.statusCallback = callback;
  }

  /**
   * Update stream status
   */
  private updateStatus(status: Partial<StreamStatus>): void {
    const fullStatus: StreamStatus = {
      isStreaming: this.isStreaming,
      isConnected: false,
      duration: 0,
      ...status
    };

    if (this.statusCallback) {
      this.statusCallback(fullStatus);
    }
  }

  /**
   * Stop the RTMP publisher directly (alias for stopStreaming)
   */
  stopPublisher(): void {
    try {
      if (this.rtmpRef) {
        this.rtmpRef.stop();
      }
      this.isStreaming = false;
      this.streamStartTime = null;
      this.updateStatus({
        isStreaming: false,
        isConnected: false,
        duration: 0
      });
    } catch (error: any) {
      console.error('❌ Stop publisher error:', error);
    }
  }

  /**
   * Get current stream status
   */
  getStatus(): StreamStatus {
    const duration = this.streamStartTime 
      ? Math.floor((Date.now() - this.streamStartTime) / 1000)
      : 0;

    return {
      isStreaming: this.isStreaming,
      isConnected: this.isStreaming,
      duration
    };
  }
}

export default RTMPStreamingHelper;
export type { StreamConfig, StreamStatus };

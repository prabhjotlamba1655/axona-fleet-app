import { APP_CONFIG } from '../constants/config';
import { LatestVehicleLocation, PanicEvent, DriverIntelligenceEvent } from '../types';

type Listener<T> = (data: T) => void;

class TelematicsWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 15;
  private baseReconnectDelay = 1000;
  private pingInterval: any = null;
  private isExplicitlyClosed = false;

  private locationListeners: Set<Listener<LatestVehicleLocation>> = new Set();
  private batchLocationListeners: Set<Listener<LatestVehicleLocation[]>> = new Set();
  private panicListeners: Set<Listener<PanicEvent>> = new Set();
  private driverEventListeners: Set<Listener<DriverIntelligenceEvent>> = new Set();
  private connectionStatusListeners: Set<Listener<'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'>> = new Set();

  private status: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' = 'DISCONNECTED';

  connect(customWsUrl?: string) {
    this.isExplicitlyClosed = false;
    const url = customWsUrl || APP_CONFIG.DEFAULT_WS_URL;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus('CONNECTING');

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('CONNECTED');
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.handleIncomingMessage(payload);
        } catch (err) {
          // ignore malformed frame
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[Axona WS] Socket error:', err);
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.setStatus('DISCONNECTED');
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect(customWsUrl);
        }
      };
    } catch (e) {
      this.setStatus('DISCONNECTED');
      this.scheduleReconnect(customWsUrl);
    }
  }

  private setStatus(newStatus: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED') {
    this.status = newStatus;
    this.connectionStatusListeners.forEach((cb) => cb(newStatus));
  }

  getStatus() {
    return this.status;
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
      }
    }, APP_CONFIG.HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect(customWsUrl?: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[Axona WS] Max reconnect attempts reached.');
      return;
    }
    const delay = Math.min(30000, this.baseReconnectDelay * Math.pow(1.5, this.reconnectAttempts));
    this.reconnectAttempts++;
    setTimeout(() => {
      if (!this.isExplicitlyClosed) {
        this.connect(customWsUrl);
      }
    }, delay);
  }

  private handleIncomingMessage(payload: any) {
    if (!payload || !payload.type) return;

    switch (payload.type) {
      case 'TELEMATICS_UPDATE':
      case 'GPS_UPDATE':
      case 'VEHICLE_POSITION':
        if (payload.data) {
          if (Array.isArray(payload.data)) {
            this.batchLocationListeners.forEach((cb) => cb(payload.data));
          } else {
            this.locationListeners.forEach((cb) => cb(payload.data));
          }
        }
        break;

      case 'PANIC_ALERT':
      case 'EMERGENCY_SOS':
        if (payload.data) {
          this.panicListeners.forEach((cb) => cb(payload.data));
        }
        break;

      case 'DRIVER_INTELLIGENCE_EVENT':
      case 'DRIVER_EVENT':
        if (payload.data) {
          this.driverEventListeners.forEach((cb) => cb(payload.data));
        }
        break;
    }
  }

  // Subscriptions
  onLocationUpdate(listener: Listener<LatestVehicleLocation>) {
    this.locationListeners.add(listener);
    return () => this.locationListeners.delete(listener);
  }

  onBatchLocationUpdate(listener: Listener<LatestVehicleLocation[]>) {
    this.batchLocationListeners.add(listener);
    return () => this.batchLocationListeners.delete(listener);
  }

  onPanicAlert(listener: Listener<PanicEvent>) {
    this.panicListeners.add(listener);
    return () => this.panicListeners.delete(listener);
  }

  onDriverEvent(listener: Listener<DriverIntelligenceEvent>) {
    this.driverEventListeners.add(listener);
    return () => this.driverEventListeners.delete(listener);
  }

  onStatusChange(listener: Listener<'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'>) {
    this.connectionStatusListeners.add(listener);
    listener(this.status);
    return () => this.connectionStatusListeners.delete(listener);
  }

  disconnect() {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('DISCONNECTED');
  }
}

export const telematicsWS = new TelematicsWebSocketService();

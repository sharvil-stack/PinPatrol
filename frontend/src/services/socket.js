import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WS_URL = "http://localhost:8080/ws";

/**
 * Opens a STOMP-over-SockJS connection to the backend and subscribes to
 * /topic/reports, invoking onReport(report) whenever a new report is
 * broadcast by ReportController#createReport.
 *
 * Returns a cleanup function that deactivates the client.
 */
export function subscribeToReports(onReport) {
  const client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 4000,
    onConnect: () => {
      client.subscribe("/topic/reports", (message) => {
        try {
          const report = JSON.parse(message.body);
          onReport(report);
        } catch (err) {
          console.error("Failed to parse report broadcast", err);
        }
      });
    },
  });

  client.activate();

  return () => {
    client.deactivate();
  };
}
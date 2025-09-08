import { AlertTriangle, Clock, TrendingDown, MessageSquare } from "lucide-react";
import React from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface Alert {
  id: string;
  type: 'escalation' | 'timeout' | 'satisfaction' | 'error';
  title: string;
  description: string;
  conversationId: string;
  customerName: string;
  timestamp: string;
  severity: 'high' | 'medium' | 'low';
}

interface AlertsPanelProps {
  alerts: Alert[];
  onViewConversation: (conversationId: string) => void;
  onDismissAlert: (alertId: string) => void;
}

const alertIcons = {
  escalation: AlertTriangle,
  timeout: Clock,
  satisfaction: TrendingDown,
  error: MessageSquare,
};

const alertColors = {
  high: 'bg-[#ffc8c8] border-[#ba3a3a] text-[#ba3a3a]',
  medium: 'bg-[#fff4c8] border-[#ffc700] text-[#b8860b]',
  low: 'bg-[#c8ecff] border-[#006d94] text-[#006d94]',
};

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onViewConversation,
  onDismissAlert,
}) => {
  return (
    <Card className="bg-white rounded-3xl overflow-hidden border-0">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-grey-1000">Active Alerts</h3>
          <Badge className="bg-[#ffc8c8] border-[#ba3a3a] text-[#ba3a3a]">
            {alerts.length} Active
          </Badge>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-grey-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No active alerts</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const IconComponent = alertIcons[alert.type];
              return (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 bg-grey-100 rounded-lg hover:bg-grey-200 transition-colors"
                >
                  <div className={`p-2 rounded-full ${alertColors[alert.severity]}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-grey-1000 truncate">
                        {alert.title}
                      </h4>
                      <Badge className={`text-xs ${alertColors[alert.severity]}`}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-grey-600 mb-2">{alert.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-grey-500">
                        {alert.customerName} • {alert.timestamp}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => onViewConversation(alert.conversationId)}
                          className="bg-primary-1000 text-white px-2 py-1 rounded text-xs"
                        >
                          View
                        </Button>
                        <Button
                          onClick={() => onDismissAlert(alert.id)}
                          className="bg-grey-300 text-grey-1000 px-2 py-1 rounded text-xs"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
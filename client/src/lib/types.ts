export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

export interface MetricCardData {
  id: string;
  name: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  period: string;
  icon: string;
  color: string;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface TrafficSource {
  name: string;
  percentage: number;
  color: string;
}

export interface ActivityItem {
  id: number;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  color: string;
}

export interface UserTableRow {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  lastAccess: Date;
  avatar: string;
}

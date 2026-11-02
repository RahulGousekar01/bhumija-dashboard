import React from "react";
import "./AlertActivity.css";

const alerts = [
  {
    id: 1,
    type: "critical",
    title: "Permit nearing expiry",
    description: "3 permits are due to expire within 7 days.",
    time: "12 min ago",
  },

  {
    id: 2,
    type: "warning",
    title: "Tripsheet exception",
    description: "2 tripsheets require operator attention.",
    time: "28 min ago",
  },

  {
    id: 3,
    type: "warning",
    title: "Stock threshold reached",
    description: "Low balance detected at Bicholim location.",
    time: "1 hr ago",
  },

  {
    id: 4,
    type: "info",
    title: "Payment pending",
    description: "Royalty payment requires verification.",
    time: "2 hrs ago",
  },

  {
    id: 5,
    type: "critical",
    title: "Compliance review",
    description: "1 entity has an outstanding compliance action.",
    time: "3 hrs ago",
  },
];

const activities = [
  {
    id: 1,
    type: "permit",
    title: "Permit generated",
    description: "Road permit generated successfully.",
    time: "10 min ago",
  },

  {
    id: 2,
    type: "trip",
    title: "Tripsheet approved",
    description: "Tripsheet TS-10482 was approved.",
    time: "24 min ago",
  },

  {
    id: 3,
    type: "weighbridge",
    title: "Vehicle weighed",
    description: "Vehicle KA-01-AB-4821 completed weighing.",
    time: "41 min ago",
  },

  {
    id: 4,
    type: "processing",
    title: "Stock processed",
    description: "2,450 MT processed into lumps.",
    time: "1 hr ago",
  },

  {
    id: 5,
    type: "payment",
    title: "Royalty payment recorded",
    description: "Royalty payment was successfully recorded.",
    time: "2 hrs ago",
  },
];

function AlertActivity() {
  return (
    <section className="alert-activity">
      {/* =========================
          SECTION HEADER
      ========================= */}

      <div className="alert-activity-header">
        <div>
          <h2>Alerts & Activity</h2>

          <p>Important alerts and recent system activity</p>
        </div>
      </div>

      {/* =========================
          TWO PANELS
      ========================= */}

      <div className="alert-activity-grid">
        <AlertsPanel />

        <ActivityPanel />
      </div>
    </section>
  );
}

/* =========================================
   ALERTS PANEL
========================================= */

function AlertsPanel() {
  return (
    <div className="alert-panel">
      <div className="panel-header">
        <div>
          <h3>Alerts</h3>

          <span>Requires attention</span>
        </div>

        <span className="panel-count">{alerts.length}</span>
      </div>

      <div className="alert-list">
        {alerts.map((alert) => (
          <AlertItem key={alert.id} alert={alert} />
        ))}
      </div>

      <button type="button" className="panel-view-all">
        View all alerts →
      </button>
    </div>
  );
}

/* =========================================
   ALERT ITEM
========================================= */

function AlertItem({ alert }) {
  return (
    <div className="alert-item">
      <span className={`alert-indicator ${alert.type}`} />

      <div className="alert-content">
        <div className="alert-title-row">
          <strong>{alert.title}</strong>

          <span>{alert.time}</span>
        </div>

        <p>{alert.description}</p>
      </div>
    </div>
  );
}

/* =========================================
   ACTIVITY PANEL
========================================= */

function ActivityPanel() {
  return (
    <div className="activity-panel">
      <div className="panel-header">
        <div>
          <h3>Recent Activity</h3>

          <span>Latest system activity</span>
        </div>

        <span className="activity-live">LIVE</span>
      </div>

      <div className="activity-list">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>

      <button type="button" className="panel-view-all">
        View all activity →
      </button>
    </div>
  );
}

/* =========================================
   ACTIVITY ITEM
========================================= */

function ActivityItem({ activity }) {
  return (
    <div className="activity-item">
      <span className="activity-icon">{getActivityIcon(activity.type)}</span>

      <div className="activity-content">
        <div className="activity-title-row">
          <strong>{activity.title}</strong>

          <span>{activity.time}</span>
        </div>

        <p>{activity.description}</p>
      </div>
    </div>
  );
}

function getActivityIcon(type) {
  const icons = {
    permit: "▣",
    trip: "↗",
    weighbridge: "⚖",
    processing: "◈",
    payment: "₹",
  };

  return icons[type] || "•";
}

export default AlertActivity;

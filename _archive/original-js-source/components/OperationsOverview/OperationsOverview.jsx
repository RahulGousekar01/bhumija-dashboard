import React, { useState } from "react";
import DetailDrawer from "../common/DetailDrawer/DetailDrawer";
import "./OperationsOverview.css";

const operationsData = [
  {
    id: "active-permits",
    title: "Active Permits",
    count: 248,
    label: "Currently active",
    details: [
      { label: "Import", count: 72 },
      { label: "Export", count: 54 },
      { label: "Transit Permit", count: 86 },
      { label: "Sale Permit", count: 36 },
    ],
  },
  {
    id: "active-trips",
    title: "Active Trips",
    count: 96,
    label: "Currently in progress",
    details: [
      { label: "Awaiting Weighbridge", count: 18 },
      { label: "Weighing", count: 24 },
      { label: "Unloading", count: 32 },
      { label: "Other In Progress", count: 22 },
    ],
  },
  {
    id: "awaiting-action",
    title: "Awaiting Action",
    count: 31,
    label: "Requires attention",
    details: [
      { label: "Awaiting Approval", count: 8 },
      { label: "Awaiting Weighbridge", count: 12 },
      { label: "Awaiting Unloading", count: 7 },
      { label: "Other", count: 4 },
    ],
  },
  {
    id: "completed-trips",
    title: "Completed Trips",
    count: 1284,
    label: "Completed",
    details: [
      { label: "Today", count: 124 },
      { label: "Yesterday", count: 186 },
      { label: "Last 7 Days", count: 974 },
    ],
  },
  {
    id: "expiring-permits",
    title: "Expiring Permits",
    count: 18,
    label: "Requires attention",
    details: [
      { label: "Within 3 Days", count: 4 },
      { label: "Within 7 Days", count: 7 },
      { label: "Within 30 Days", count: 7 },
    ],
  },
  {
    id: "exceptions",
    title: "Exceptions / Issues",
    count: 7,
    label: "Open issues",
    details: [
      { label: "Tripsheet Exception", count: 3 },
      { label: "Weighbridge Issue", count: 2 },
      { label: "Permit Issue", count: 1 },
      { label: "Other", count: 1 },
    ],
  },
];

function OperationsOverview() {
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <section className="operations-section">
      <div className="section-header">
        <div>
          <h2>Operations Overview</h2>
          <p>Current operational status and activities</p>
        </div>
      </div>

      <div className="operations-grid">
        {operationsData.map((item) => (
          <div className="operation-card" key={item.id}>
            <div className="operation-card-content">
              <span className="operation-card-title">{item.title}</span>

              <span className="operation-card-count">
                {item.count.toLocaleString()}
              </span>

              <span className="operation-card-label">{item.label}</span>
            </div>

            <button
              className="operation-arrow"
              onClick={() => setSelectedItem(item)}
              aria-label={`View ${item.title} details`}
            >
              ↗
            </button>
          </div>
        ))}
      </div>

      {selectedItem && (
        <DetailDrawer
          open
          onClose={() => setSelectedItem(null)}
          eyebrow="Operations"
          title={selectedItem.title}
          description={selectedItem.label}
        >
          <div className="operation-modal">
            <div className="operation-modal-header">
              <div>
                <span className="modal-eyebrow">Operations</span>

                <h3>{selectedItem.title}</h3>

                <p>{selectedItem.label}</p>
              </div>

              <button
                className="operation-modal-close"
                onClick={() => setSelectedItem(null)}
              >
                ×
              </button>
            </div>

            <div className="operation-detail-list">
              {selectedItem.details.map((detail) => {
                const percentage = (detail.count / selectedItem.count) * 100;

                return (
                  <div className="operation-detail-item" key={detail.label}>
                    <div className="operation-detail-top">
                      <span>{detail.label}</span>

                      <div>
                        <strong>{detail.count.toLocaleString()}</strong>

                        <small>
                          {percentage > 100 ? "—" : `${percentage.toFixed(0)}%`}
                        </small>
                      </div>
                    </div>

                    <div className="operation-progress">
                      <div
                        className="operation-progress-fill"
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="operation-modal-footer">
              <span>Total</span>
              <strong>{selectedItem.count.toLocaleString()}</strong>
            </div>
          </div>
        </DetailDrawer>
      )}
    </section>
  );
}

export default OperationsOverview;

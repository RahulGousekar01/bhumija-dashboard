import React, { useState } from "react";
import DetailDrawer from "../common/DetailDrawer/DetailDrawer";
import "./PermitOverview.css";

const permitData = [
  {
    id: "import",
    title: "Import",
    count: 28,

    categories: [
      { label: "Dumped (Auctioned)", count: 8 },
      { label: "Outside Goa", count: 10 },
      { label: "Outside India", count: 4 },
      { label: "Royalty Paid (Dump Allotted)", count: 6 },
    ],

    purposes: [
      { label: "End Use (Consumption)", count: 20 },
      { label: "Export", count: 8 },
    ],
  },

  {
    id: "export",
    title: "Export",
    count: 18,

    categories: [
      { label: "Dump (Auctioned)", count: 4 },
      { label: "eAuction Lot", count: 3 },
      { label: "Imported (For Consumption)", count: 2 },
      { label: "Imported (For Export)", count: 3 },
      { label: "Royalty Paid", count: 4 },
      { label: "Royalty Paid (Dump Allotted)", count: 2 },
    ],

    purposes: [{ label: "Export", count: 18 }],
  },

  {
    id: "transit",
    title: "Transit Permit",
    count: 24,

    categories: [
      { label: "Dump (Auctioned)", count: 5 },
      { label: "eAuction Lot", count: 4 },
      { label: "Imported (For Consumption)", count: 3 },
      { label: "Imported (For Export)", count: 4 },
      { label: "Royalty Paid", count: 5 },
      { label: "Royalty Paid (Dump Auction)", count: 3 },
    ],

    purposes: [
      { label: "End Use (Consumption)", count: 15 },
      { label: "Movement", count: 9 },
    ],
  },

  {
    id: "sale",
    title: "Sale Permit",
    count: 16,

    categories: [
      { label: "eAuction Lot", count: 7 },
      { label: "Royalty Paid", count: 9 },
    ],

    purposes: [{ label: "Sale", count: 16 }],
  },
];

function PermitOverview() {
  const [selectedPermit, setSelectedPermit] = useState(null);

  const openDetails = (permit) => {
    setSelectedPermit(permit);
  };

  const closeDetails = () => {
    setSelectedPermit(null);
  };

  return (
    <section className="permit-section">
      <div className="section-header">
        <div>
          <h2>Permit Overview</h2>
          <p>Today's permit applications by type</p>
        </div>
      </div>

      {/* Main Permit Cards */}
      <div className="permit-grid">
        {permitData.map((permit) => (
          <div className="permit-card" key={permit.id}>
            <div className="permit-card-content">
              <span className="permit-card-title">{permit.title}</span>

              <span className="permit-card-count">{permit.count}</span>

              <span className="permit-card-label">Permits Today</span>
            </div>

            <button
              className="permit-arrow"
              onClick={() => openDetails(permit)}
              aria-label={`View ${permit.title} details`}
            >
              ↗
            </button>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedPermit && (
        <DetailDrawer
          open
          onClose={closeDetails}
          eyebrow="Permit Details"
          title={selectedPermit.title}
          description={`${selectedPermit.count} permits applied today`}
        >
          <div className="permit-modal-body">

              {/* Category Breakdown */}
              <div className="breakdown-card">
                <div className="breakdown-header">
                  <div>
                    <h4>Category Breakdown</h4>
                    <span>How today's permits are distributed by category</span>
                  </div>

                  <strong>{selectedPermit.count}</strong>
                </div>

                <div className="breakdown-list">
                  {selectedPermit.categories.map((item) => {
                    const percentage =
                      (item.count / selectedPermit.count) * 100;

                    return (
                      <div className="breakdown-item" key={item.label}>
                        <div className="breakdown-item-top">
                          <span>{item.label}</span>

                          <div>
                            <strong>{item.count}</strong>
                            <small>{percentage.toFixed(0)}%</small>
                          </div>
                        </div>

                        <div className="breakdown-progress">
                          <div
                            className="breakdown-progress-fill"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="breakdown-total">
                  <span>Total</span>
                  <strong>{selectedPermit.count}</strong>
                </div>
              </div>

              {/* Purpose Breakdown */}
              <div className="breakdown-card">
                <div className="breakdown-header">
                  <div>
                    <h4>Purpose Breakdown</h4>
                    <span>How today's permits are distributed by purpose</span>
                  </div>

                  <strong>{selectedPermit.count}</strong>
                </div>

                <div className="breakdown-list">
                  {selectedPermit.purposes.map((item) => {
                    const percentage =
                      (item.count / selectedPermit.count) * 100;

                    return (
                      <div className="breakdown-item" key={item.label}>
                        <div className="breakdown-item-top">
                          <span>{item.label}</span>

                          <div>
                            <strong>{item.count}</strong>
                            <small>{percentage.toFixed(0)}%</small>
                          </div>
                        </div>

                        <div className="breakdown-progress">
                          <div
                            className="breakdown-progress-fill"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="breakdown-total">
                  <span>Total</span>
                  <strong>{selectedPermit.count}</strong>
                </div>
              </div>
            <div className="permit-modal-footer">
              <span>
                Category and purpose are independent breakdowns of the same
                permits.
              </span>
            </div>
          </div>
        </DetailDrawer>
      )}
    </section>
  );
}

export default PermitOverview;

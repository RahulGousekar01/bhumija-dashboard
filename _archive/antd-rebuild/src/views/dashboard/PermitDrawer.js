import React, { useRef, useState } from "react";
import { Button, Descriptions, Drawer, Grid, Progress, Space, Timeline, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { downloadPermitCertificate, readTable } from "Api/DashboardApi/DashboardApi";
import { STATUS_COLORS } from "constants/DashboardConstant";
import { useRole } from "context/RoleContext";
import { formatDate, formatDateTime, formatMT } from "utils/dateUtils";
import StatusTag from "./StatusTag";

const { useBreakpoint } = Grid;

/** Saves a base64 PDF the way the portal saves server-generated certificates. */
function saveBase64Pdf(base64, filename) {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Right-side detail drawer for a permit application:
 * details, quantities, workflow history and the certificate download.
 * 60% of the screen on desktop, full width on mobile.
 */
const PermitDrawer = ({ permit: selected, onClose }) => {
  // Keep showing the last record while the drawer slides closed.
  const lastPermit = useRef(null);
  if (selected) lastPermit.current = selected;
  const permit = selected || lastPermit.current;

  const screens = useBreakpoint();
  const { isParty } = useRole();
  const [downloading, setDownloading] = useState(false);
  const isMobile = screens.md === false;

  const download = async () => {
    setDownloading(true);
    try {
      const [file] = readTable(await downloadPermitCertificate(permit.ackno));
      saveBase64Pdf(file.content, file.filename);
      message.success("Permit certificate downloaded.");
    } catch (error) {
      message.error(error.message);
    } finally {
      setDownloading(false);
    }
  };

  const approved = permit?.status === "Approved";
  const balance = approved ? permit.approvedqty - permit.dispatchedqty : 0;

  return (
    <Drawer
      className="permit-drawer"
      placement="right"
      width={isMobile ? "100%" : "60%"}
      visible={Boolean(selected)}
      onClose={onClose}
      title={
        permit && (
          <div className="drawer-title">
            <div>
              <span className="drawer-eyebrow">{permit.permittype} Permit Application</span>
              <h2>{permit.permitno || permit.ackno}</h2>
              <span className="drawer-sub">
                Ack No {permit.ackno} · Applied {formatDate(permit.appldate)}
              </span>
            </div>
            <StatusTag status={permit.status} />
          </div>
        )
      }
      footer={
        permit && (
          <div className="drawer-footer">
            <span className="drawer-footer-note">
              {approved ? "Certificate issued by DMG Goa." : "The permit certificate is available after approval."}
            </span>
            <Space>
              <Button onClick={onClose}>Close</Button>
              <Button type="primary" icon={<DownloadOutlined />} onClick={download} loading={downloading} disabled={!approved}>
                Download Permit Certificate
              </Button>
            </Space>
          </div>
        )
      }
    >
      {permit && (
        <>
          <section className="drawer-section">
            <h3>Application Details</h3>
            {/* Columns follow the drawer width, not the window: 2 on desktop, 1 on mobile. */}
            <Descriptions bordered size="small" column={isMobile ? 1 : 2}>
              <Descriptions.Item label="Ack No">{permit.ackno}</Descriptions.Item>
              <Descriptions.Item label="Permit No">{permit.permitno || "N/A"}</Descriptions.Item>
              <Descriptions.Item label="Permit Type">{permit.permittype}</Descriptions.Item>
              {!isParty && <Descriptions.Item label="Party">{permit.party}</Descriptions.Item>}
              <Descriptions.Item label="Purpose">{permit.purpose}</Descriptions.Item>
              <Descriptions.Item label="Ore Source">{permit.oresource}</Descriptions.Item>
              <Descriptions.Item label="Mineral Details">{permit.mineraldetail}</Descriptions.Item>
              <Descriptions.Item label="Grade Slab">{permit.gradeslab}</Descriptions.Item>
              <Descriptions.Item label="Location">{permit.locname}</Descriptions.Item>
              <Descriptions.Item label="Taluka">{permit.taluka}</Descriptions.Item>
              <Descriptions.Item label="District">{permit.district}</Descriptions.Item>
              <Descriptions.Item label="Application Date">{formatDate(permit.appldate)}</Descriptions.Item>
              <Descriptions.Item label="Valid Upto">{formatDate(permit.validupto)}</Descriptions.Item>
            </Descriptions>
          </section>

          <section className="drawer-section">
            <h3>Quantity</h3>
            <div className="quantity-grid">
              <div className="quantity-item">
                <span>Proposed</span>
                <strong>{formatMT(permit.propqnty)}</strong>
              </div>
              <div className="quantity-item">
                <span>Approved</span>
                <strong>{approved ? formatMT(permit.approvedqty) : "N/A"}</strong>
              </div>
              <div className="quantity-item">
                <span>Dispatched</span>
                <strong>{approved ? formatMT(permit.dispatchedqty) : "N/A"}</strong>
              </div>
              <div className="quantity-item">
                <span>Balance</span>
                <strong>{approved ? formatMT(balance) : "N/A"}</strong>
              </div>
            </div>
            {approved && (
              <div className="quantity-progress">
                <span>Dispatched against approved quantity</span>
                <Progress
                  percent={Math.round((permit.dispatchedqty / permit.approvedqty) * 100)}
                  strokeColor="#FF6B72"
                  aria-label="Dispatched against approved quantity"
                />
              </div>
            )}
          </section>

          <section className="drawer-section">
            <h3>Workflow History</h3>
            <Timeline className="workflow-timeline">
              {permit.history.map((entry, index) => (
                <Timeline.Item key={`${entry.status}-${index}`} color={STATUS_COLORS[entry.status]?.solid ?? "gray"}>
                  <div className="workflow-entry">
                    <div className="workflow-head">
                      <strong>{entry.action}</strong>
                      <StatusTag status={entry.status} />
                    </div>
                    <span className="workflow-meta">
                      {entry.by} · {formatDateTime(entry.at)}
                    </span>
                    {entry.remarks && <p className="workflow-remarks">{entry.remarks}</p>}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </section>
        </>
      )}
    </Drawer>
  );
};

export default PermitDrawer;

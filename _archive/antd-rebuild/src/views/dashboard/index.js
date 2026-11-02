import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Col, Row, Skeleton } from "antd";
import {
  dashboardPermitList,
  dashboardStockSummary,
  dashboardTripSheetSummary,
  readTable,
} from "Api/DashboardApi/DashboardApi";
import { ALL, FINANCIAL_YEARS, ROLE_LABELS, CURRENT_PARTY } from "constants/DashboardConstant";
import { useRole } from "context/RoleContext";
import { getAsOnDate } from "utils/dateUtils";
import DataAsOnBanner from "./DataAsOnBanner";
import DashboardFilters from "./DashboardFilters";
import PermitStatusCards from "./PermitStatusCards";
import { PermitsByTypeCard, StockCard, TransitCard } from "./OverviewCards";
import PermitTable from "./PermitTable";
import PermitDrawer from "./PermitDrawer";
import "./dashboard.css";

const INITIAL_FILTERS = {
  financialYear: FINANCIAL_YEARS[0],
  district: ALL,
  taluka: ALL,
  organisation: ALL,
};

const Dashboard = () => {
  const { role, isParty } = useRole();
  const asOnDate = useMemo(() => getAsOnDate(), []);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [data, setData] = useState({ permits: [], trips: null, stock: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [selected, setSelected] = useState(null);
  const tableRef = useRef(null);

  // Switching role starts from a clean scope.
  useEffect(() => {
    setFilters(INITIAL_FILTERS);
    setStatus(null);
    setSelected(null);
  }, [role]);

  // Load the overview and table for the current scope.
  useEffect(() => {
    let active = true;
    const scope = { ...filters, role };
    setLoading(true);
    setError(null);

    Promise.all([dashboardPermitList(scope), dashboardTripSheetSummary(scope), dashboardStockSummary(scope)])
      .then(([permitResponse, tripResponse, stockResponse]) => {
        if (!active) return;
        setData({
          permits: readTable(permitResponse),
          trips: readTable(tripResponse)[0],
          stock: readTable(stockResponse),
        });
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [filters, role]);

  const activeTransitPermits = data.permits.filter(
    (permit) => permit.permittype === "Transit" && permit.status === "Approved" && permit.validupto && !asOnDate.isAfter(permit.validupto, "day")
  ).length;

  const selectStatus = (next) => {
    setStatus(next);
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const firstLoad = loading && !data.trips;

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>{isParty ? `${CURRENT_PARTY} · ${ROLE_LABELS[role]}` : "All organisations · Super Admin"}</p>
        </div>
      </div>

      <DataAsOnBanner asOnDate={asOnDate} />

      <DashboardFilters
        filters={filters}
        onChange={(change) => setFilters((current) => ({ ...current, ...change }))}
        onReset={() => setFilters(INITIAL_FILTERS)}
      />

      {error && <Alert type="error" showIcon message="Could not load dashboard data" description={error} />}

      <section aria-labelledby="overview-title" className="dashboard-section">
        <h2 id="overview-title" className="section-title">
          Permit Applications <span>Financial year {filters.financialYear}, up to yesterday</span>
        </h2>
        {firstLoad ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <PermitStatusCards permits={data.permits} activeStatus={status} onSelect={selectStatus} />
        )}
      </section>

      <Row gutter={[16, 16]} className="dashboard-section">
        <Col xs={24} lg={8}>
          {firstLoad ? <Skeleton active /> : <PermitsByTypeCard permits={data.permits} />}
        </Col>
        <Col xs={24} md={12} lg={8}>
          {firstLoad ? <Skeleton active /> : <TransitCard summary={data.trips} activeTransitPermits={activeTransitPermits} />}
        </Col>
        <Col xs={24} md={12} lg={8}>
          {firstLoad ? <Skeleton active /> : <StockCard stock={data.stock} />}
        </Col>
      </Row>

      <div ref={tableRef} className="dashboard-section table-anchor">
        <PermitTable
          permits={data.permits}
          loading={loading}
          asOnDate={asOnDate}
          status={status}
          onStatusChange={setStatus}
          selectedKey={selected?.key}
          onOpen={setSelected}
        />
      </div>

      <PermitDrawer permit={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Dashboard;

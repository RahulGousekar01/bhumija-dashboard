import React from "react";

import { DashboardProvider } from "./context/DashboardContext";

import Header from "./components/Header/Header";
import Sidebar from "./components/Sidebar/Sidebar";
import Footer from "./components/Footer/Footer";

import DashboardFilters from "./components/DashboardFilters/DashboardFilters";
import StockSummary from "./components/StockSummary/StockSummary";
import OreProcessing from "./components/OreProcessing/OreProcessing";
import DumpsSummary from "./components/DumpsSummary/DumpsSummary";
import PaymentSummary from "./components/PaymentSummary/PaymentSummary";
import PermitOverview from "./components/PermitOverview/PermitOverview";
import OperationsOverview from "./components/OperationsOverview/OperationsOverview";
import MasterData from "./components/MasterData/MasterData";
import AlertActivity from "./components/AlertActivity/AlertActivity";

import "./styles.css";

function Dashboard() {
  return (
    <div className="app-shell">
      <Header />

      <div className="app-body">
        <Sidebar />

        <main className="main-content">
          <DashboardFilters />

          <StockSummary />

          <OreProcessing />

          <DumpsSummary />

          <PaymentSummary />

          <PermitOverview />

          <OperationsOverview />

          <MasterData />

          <AlertActivity />
        </main>
      </div>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <DashboardProvider>
      <Dashboard />
    </DashboardProvider>
  );
}

export default App;

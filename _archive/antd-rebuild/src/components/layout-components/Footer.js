import React from "react";
import { Layout } from "antd";

const Footer = () => (
  <Layout.Footer className="app-footer">
    <span>© {new Date().getFullYear()} Directorate of Mines &amp; Geology, Government of Goa</span>
    <span>Bhumija Mining Management Portal</span>
  </Layout.Footer>
);

export default Footer;

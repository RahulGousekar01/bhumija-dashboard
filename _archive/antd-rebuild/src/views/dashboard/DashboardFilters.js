import React from "react";
import { Button, Card, Col, Form, Row, Select } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { ALL, DISTRICTS, FINANCIAL_YEARS, ORGANISATIONS } from "constants/DashboardConstant";
import { useRole } from "context/RoleContext";

const talukasFor = (district) => (district === ALL ? Object.values(DISTRICTS).flat() : DISTRICTS[district]);

/** Scope filters for the whole dashboard (overview and table). */
const DashboardFilters = ({ filters, onChange, onReset }) => {
  const { isParty } = useRole();

  return (
    <Card className="dashboard-card filter-card" bodyStyle={{ padding: "16px 20px 4px" }}>
      <Form layout="vertical">
        <Row gutter={[16, 0]} align="bottom">
          <Col xs={24} sm={12} lg={5}>
            <Form.Item label="Financial Year">
              <Select value={filters.financialYear} onChange={(value) => onChange({ financialYear: value })}>
                {FINANCIAL_YEARS.map((year) => (
                  <Select.Option key={year} value={year}>
                    {year}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <Form.Item label="District">
              <Select value={filters.district} onChange={(value) => onChange({ district: value, taluka: ALL })}>
                <Select.Option value={ALL}>All Districts</Select.Option>
                {Object.keys(DISTRICTS).map((district) => (
                  <Select.Option key={district} value={district}>
                    {district}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <Form.Item label="Taluka">
              <Select value={filters.taluka} onChange={(value) => onChange({ taluka: value })}>
                <Select.Option value={ALL}>All Talukas</Select.Option>
                {talukasFor(filters.district).map((taluka) => (
                  <Select.Option key={taluka} value={taluka}>
                    {taluka}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          {/* A Party only ever sees its own organisation. */}
          {!isParty && (
            <Col xs={24} sm={12} lg={6}>
              <Form.Item label="Organisation">
                <Select
                  showSearch
                  value={filters.organisation}
                  onChange={(value) => onChange({ organisation: value })}
                  optionFilterProp="children"
                >
                  <Select.Option value={ALL}>All Organisations</Select.Option>
                  {ORGANISATIONS.map((organisation) => (
                    <Select.Option key={organisation} value={organisation}>
                      {organisation}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          )}
          <Col xs={24} sm={12} lg={3}>
            <Form.Item>
              <Button icon={<ReloadOutlined />} onClick={onReset} block>
                Reset
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default DashboardFilters;

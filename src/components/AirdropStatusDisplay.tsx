// @ts-nocheck

import { Card, Typography, List } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

const AIRDROP_STATUSES = {
  OPEN: "Open",
  DRAWING: "Drawing",
  CLOSED: "Closed",
};

const AirdropStatusDisplay = ({ airdropStatus }) => {
  return (
    <Card style={{ marginTop: "20px", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)" }}>
      <Title level={3} style={{ color: "#4CAF50" }}>
        Airdrop Status <CheckCircleOutlined />
      </Title>
      <Paragraph style={{ fontSize: "16px", fontWeight: "bold" }}>
        Status: <span style={{ color: airdropStatus.status === AIRDROP_STATUSES.OPEN ? "#4CAF50" : airdropStatus.status === AIRDROP_STATUSES.DRAWING ? "#FF9800" : "#FF0000" }}>{airdropStatus.status}</span>
      </Paragraph>
      <Title level={4}>Winners:</Title>
      {Object.keys(airdropStatus.winners).length === 0 ? (
        <Paragraph>No winners yet</Paragraph>
      ) : (
        <List
          bordered
          dataSource={Object.entries(airdropStatus.winners)}
          renderItem={([address, prize]) => (
            <List.Item>
              <Typography.Text strong>{address}</Typography.Text>: {prize.amount} {prize.symbol}
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

export default AirdropStatusDisplay;

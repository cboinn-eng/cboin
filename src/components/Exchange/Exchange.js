import React from 'react';
import { Card, Form, Input, Button, Select } from 'antd';
import './Exchange.css';

const { Option } = Select;

const Exchange = () => {
  return (
    <Card title="Takas" className="exchange-card">
      <Form layout="vertical">
        <Form.Item label="Miktar">
          <Input placeholder="0.00" />
        </Form.Item>
        <Form.Item label="Token Seç">
          <Select defaultValue="CBN" style={{ width: '100%' }}>
            <Option value="CBN">CBN</Option>
            <Option value="USDT">USDT</Option>
            <Option value="BTC">BTC</Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" block>
            Takas Yap
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default Exchange;

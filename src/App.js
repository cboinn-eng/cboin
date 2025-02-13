import React, { useState, useEffect } from 'react';
import { Layout, Menu } from 'antd';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import {
  LineChartOutlined,
  DashboardOutlined,
  RobotOutlined,
  AlertOutlined,
  BellOutlined,
  BookOutlined,
  GlobalOutlined,
  TwitterOutlined,
  BarChartOutlined,
  WalletOutlined
} from '@ant-design/icons';

import Dashboard from './components/Dashboard/Dashboard';
import Strategy from './components/Strategy/Strategy';
import AiAnalysis from './components/AiAnalysis/AiAnalysis';
import FearIndex from './components/FearIndex/FearIndex';
import NewsTerminal from './components/NewsTerminal/NewsTerminal';
import Alerts from './components/Alerts/Alerts';
import EconomicAlerts from './components/EconomicAlerts/EconomicAlerts';
import Portfolio from './components/Portfolio/Portfolio';
import TwitterFeed from './components/Social/TwitterFeed';
import CoinMarket from './components/CoinMarket/CoinMarket';
import Landing from './components/Auth/Landing';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import RssNews from './components/RssNews/RssNews';
import BitcoinPrediction from './components/BitcoinPrediction';

import 'antd/dist/reset.css';
import './App.css';

const { Header, Content, Footer, Sider } = Layout;

const App = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();

  // Kullanıcı kontrolü
  useEffect(() => {
    const username = localStorage.getItem('username');
    if (username) {
      setIsLoggedIn(true);
    }
  }, []);

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/">Genel Bakış</Link>,
    },
    {
      key: '/strategy',
      icon: <LineChartOutlined />,
      label: <Link to="/strategy">Grafikler</Link>,
    },
    {
      key: '/ai-analysis',
      icon: <RobotOutlined />,
      label: <Link to="/ai-analysis">AI Tahminler</Link>,
    },
    {
      key: '/fear-index',
      icon: <BarChartOutlined />,
      label: <Link to="/fear-index">Piyasa Analizi</Link>,
    },
    {
      key: '/news',
      icon: <GlobalOutlined />,
      label: <Link to="/news">Haberler</Link>,
    },
    {
      key: '/alerts',
      icon: <AlertOutlined />,
      label: <Link to="/alerts">Sinyaller</Link>,
    },
    {
      key: '/economic-alerts',
      icon: <BellOutlined />,
      label: <Link to="/economic-alerts">Ekonomik Takvim</Link>,
    },
    {
      key: '/portfolio',
      icon: <WalletOutlined />,
      label: <Link to="/portfolio">Portföy Analizi</Link>,
    },
    {
      key: '/twitter',
      icon: <TwitterOutlined />,
      label: <Link to="/twitter">Twitter Feed</Link>,
    },
    {
      key: '/market',
      icon: <LineChartOutlined />,
      label: <Link to="/market">Kripto Market</Link>,
    },
    {
      key: '/bitcoin-prediction',
      icon: <LineChartOutlined />,
      label: <Link to="/bitcoin-prediction">Bitcoin Tahmini</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {isLoggedIn ? (
        <>
          <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
            <div className="logo">
              <span className="logo-text">CryptoTrader</span>
              <span className="logo-pro">PRO</span>
            </div>
            <Menu
              theme="dark"
              defaultSelectedKeys={['/']}
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
            />
          </Sider>
          <Layout className="site-layout">
            <Header className="site-layout-background" style={{ padding: 0 }} />
            <Content style={{ margin: '0 16px' }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/strategy" element={<Strategy />} />
                <Route path="/ai-analysis" element={<AiAnalysis />} />
                <Route path="/fear-index" element={<FearIndex />} />
                <Route path="/news" element={<NewsTerminal />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/rss-news" element={<RssNews />} />
                <Route path="/economic-alerts" element={<EconomicAlerts />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/twitter" element={<TwitterFeed username="ivy_cboinn" />} />
                <Route path="/market" element={<CoinMarket />} />
                <Route path="/bitcoin-prediction" element={<BitcoinPrediction />} />
              </Routes>
            </Content>
            <Footer className="app-footer">
              <div className="footer-content">
                <div className="footer-section">
                  <div className="footer-title">CryptoTrader Pro</div>
                  <div className="footer-stats">
                    <div className="stat">
                      <span className="stat-label">API Durumu</span>
                      <span className="stat-value online">Aktif</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">İşlem Hacmi (24s)</span>
                      <span className="stat-value">$1.2M</span>
                    </div>
                  </div>
                </div>
                <div className="footer-section">
                  <div className="server-status">
                    <span className="status-label">Sunucu Durumu:</span>
                    <span className="status-value">
                      <span className="status-dot"></span>
                      Tüm Sistemler Aktif
                    </span>
                  </div>
                  <div className="footer-version">
                    v2.1.0 &copy; {new Date().getFullYear()}
                  </div>
                </div>
              </div>
            </Footer>
          </Layout>
        </>
      ) : (
        <Content>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </Content>
      )}
    </Layout>
  );
};

export default App;

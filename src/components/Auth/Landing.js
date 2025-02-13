import React from 'react';
import { Button, Typography, Space } from 'antd';
import { UserOutlined, LoginOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import './Landing.css';

const { Title, Paragraph } = Typography;

const Landing = () => {
    return (
        <div className="landing-container">
            <div className="landing-content">
                <div className="landing-header">
                    <Title level={1}>CBOIN Trading</Title>
                    <Paragraph className="landing-subtitle">
                        Kripto dünyasının geleceğine hoş geldiniz
                    </Paragraph>
                </div>

                <div className="landing-features">
                    <div className="feature-item">
                        <div className="feature-icon">📈</div>
                        <h3>Gerçek Zamanlı Veriler</h3>
                        <p>Binance API entegrasyonu ile anlık kripto fiyatları</p>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon">🤖</div>
                        <h3>AI Analizleri</h3>
                        <p>Yapay zeka destekli trading önerileri</p>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon">📊</div>
                        <h3>Portföy Takibi</h3>
                        <p>Yatırımlarınızı tek yerden yönetin</p>
                    </div>
                </div>

                <div className="landing-cta">
                    <Space size="large">
                        <Link to="/register">
                            <Button type="primary" size="large" icon={<UserOutlined />}>
                                Kayıt Ol
                            </Button>
                        </Link>
                        <Link to="/login">
                            <Button size="large" icon={<LoginOutlined />}>
                                Giriş Yap
                            </Button>
                        </Link>
                    </Space>
                </div>

                <div className="landing-stats">
                    <div className="stat-item">
                        <h4>10K+</h4>
                        <p>Aktif Kullanıcı</p>
                    </div>
                    <div className="stat-item">
                        <h4>$5M+</h4>
                        <p>İşlem Hacmi</p>
                    </div>
                    <div className="stat-item">
                        <h4>24/7</h4>
                        <p>Destek</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Landing;

import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';
import logo from '../../assets/images/logo-light.svg';

const Login = ({ setIsLoggedIn }) => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:8001/api/login', {
                username: values.username,
                password: values.password
            });
            
            if (response.data.username) {
                localStorage.setItem('username', response.data.username);
                setIsLoggedIn(true);
                message.success('Giriş başarılı!');
                navigate('/');
            }
        } catch (error) {
            const errorMsg = error.response?.data?.detail || error.message;
            message.error('Giriş başarısız: ' + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <img src={logo} alt="Logo" className="auth-logo" />
                <h2>Giriş Yap</h2>
                <Form
                    name="login"
                    onFinish={onFinish}
                    autoComplete="off"
                    layout="vertical"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Lütfen kullanıcı adınızı girin!' }]}
                    >
                        <Input 
                            prefix={<UserOutlined />} 
                            placeholder="Kullanıcı Adı"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Lütfen şifrenizi girin!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Şifre"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Giriş Yap
                        </Button>
                    </Form.Item>
                </Form>
                
                <div className="auth-links">
                    <Link to="/register">Hesabınız yok mu? Kayıt olun</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;

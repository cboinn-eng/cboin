import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';
import logo from '../../assets/images/logo-light.svg';

const Register = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        if (values.password !== values.confirmPassword) {
            message.error('Şifreler eşleşmiyor!');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('http://localhost:8001/api/register', {
                username: values.username,
                email: values.email,
                password: values.password
            });

            if (response.data.message) {
                message.success('Kayıt başarılı! Giriş yapabilirsiniz.');
                navigate('/login');
            }
        } catch (error) {
            const errorMsg = error.response?.data?.detail || error.message;
            message.error('Kayıt başarısız: ' + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <img src={logo} alt="Logo" className="auth-logo" />
                <h2>Hesap Oluştur</h2>
                <Form
                    name="register"
                    onFinish={onFinish}
                    autoComplete="off"
                    layout="vertical"
                >
                    <Form.Item
                        name="username"
                        rules={[
                            { required: true, message: 'Lütfen kullanıcı adınızı girin!' },
                            { min: 3, message: 'Kullanıcı adı en az 3 karakter olmalıdır!' }
                        ]}
                    >
                        <Input 
                            prefix={<UserOutlined />} 
                            placeholder="Kullanıcı Adı"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Lütfen email adresinizi girin!' },
                            { type: 'email', message: 'Geçerli bir email adresi girin!' }
                        ]}
                    >
                        <Input 
                            prefix={<MailOutlined />} 
                            placeholder="Email"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: 'Lütfen şifrenizi girin!' },
                            { min: 6, message: 'Şifre en az 6 karakter olmalıdır!' }
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Şifre"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        rules={[
                            { required: true, message: 'Lütfen şifrenizi tekrar girin!' },
                            { min: 6, message: 'Şifre en az 6 karakter olmalıdır!' }
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Şifreyi Tekrar Girin"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Kayıt Ol
                        </Button>
                    </Form.Item>
                </Form>
                
                <div className="auth-links">
                    <Link to="/login">Zaten hesabınız var mı? Giriş yapın</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;

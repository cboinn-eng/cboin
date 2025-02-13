import React, { useState, useEffect } from 'react';
import { Card, List, Avatar, Typography, Spin, Tag } from 'antd';
import { TwitterOutlined, RetweetOutlined, HeartOutlined, MessageOutlined } from '@ant-design/icons';
import axios from 'axios';
import './TwitterFeed.css';

const { Text, Link } = Typography;

const TwitterFeed = ({ username }) => {
    const [tweets, setTweets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:10000';

    useEffect(() => {
        fetchTweets();
        const interval = setInterval(fetchTweets, 300000); // Her 5 dakikada bir güncelle
        return () => clearInterval(interval);
    }, [username]);

    const fetchTweets = async () => {
        try {
            const response = await axios.get(`${API_URL}/social/twitter/recent-tweets/${username}`);
            setTweets(response.data.tweets);
            setLoading(false);
        } catch (err) {
            setError('Twitter gönderileri alınamadı');
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) return <Spin size="large" />;
    if (error) return <Text type="danger">{error}</Text>;

    return (
        <Card
            title={
                <div className="twitter-feed-header">
                    <TwitterOutlined style={{ color: '#1DA1F2', fontSize: '24px' }} />
                    <span style={{ marginLeft: '8px' }}>Son Twitter Gönderileri</span>
                </div>
            }
            className="twitter-feed-card"
        >
            <List
                itemLayout="vertical"
                dataSource={tweets}
                renderItem={tweet => (
                    <List.Item
                        className="tweet-item"
                        actions={[
                            <span key="retweets">
                                <RetweetOutlined /> {tweet.metrics.retweet_count}
                            </span>,
                            <span key="likes">
                                <HeartOutlined /> {tweet.metrics.like_count}
                            </span>,
                            <span key="replies">
                                <MessageOutlined /> {tweet.metrics.reply_count}
                            </span>
                        ]}
                    >
                        <List.Item.Meta
                            avatar={<Avatar icon={<TwitterOutlined />} style={{ backgroundColor: '#1DA1F2' }} />}
                            title={
                                <Link href={`https://twitter.com/user/status/${tweet.id}`} target="_blank">
                                    {formatDate(tweet.created_at)}
                                </Link>
                            }
                            description={tweet.text}
                        />
                    </List.Item>
                )}
            />
        </Card>
    );
};

export default TwitterFeed;

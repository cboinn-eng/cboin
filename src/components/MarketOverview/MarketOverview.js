import React, { useState, useEffect } from 'react';
import { CaretUpOutlined, CaretDownOutlined, SwapOutlined } from '@ant-design/icons';
import axios from '../../config/axios.config';
import { Button, Input, Select, message, Space, Divider, Card, Table } from 'antd';
import Web3 from 'web3';
import './MarketOverview.css';

const { Option } = Select;

// PancakeSwap Router v2 Contract Address
const PANCAKESWAP_ROUTER = '0x10ED43C718714eb63d5aA57B78B54704E256024E';

// BSC Token Addresses
const TOKENS = {
  BNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
  CAKE: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
  USDT: '0x55d398326f99059fF775485246999027B3197955',
  ETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8'
};

// Router ABI
const ROUTER_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
      { "internalType": "address[]", "name": "path", "type": "address[]" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "deadline", "type": "uint256" }
    ],
    "name": "swapExactTokensForTokens",
    "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
      { "internalType": "address[]", "name": "path", "type": "address[]" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "deadline", "type": "uint256" }
    ],
    "name": "swapExactBNBForTokens",
    "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }],
    "stateMutability": "payable",
    "type": "function"
  }
];

const MarketOverview = () => {
  const [activeTab, setActiveTab] = useState('crypto');
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(false);

  // First Pair State
  const [firstPairAmount, setFirstPairAmount] = useState('');
  const [firstPairFromToken, setFirstPairFromToken] = useState('BNB');
  const [firstPairToToken, setFirstPairToToken] = useState('BUSD');

  // Second Pair State
  const [secondPairAmount, setSecondPairAmount] = useState('');
  const [secondPairFromToken, setSecondPairFromToken] = useState('BUSD');
  const [secondPairToToken, setSecondPairToToken] = useState('ETH');

  const [cryptoData, setCryptoData] = useState([
    {
      name: 'Bitcoin',
      symbol: 'BTC',
      price: '$42,850.25',
      change: '+2.5%',
      volume: '$28.5B',
      marketCap: '$834.2B',
      isPositive: true
    },
    {
      name: 'Ethereum',
      symbol: 'ETH',
      price: '$2,250.80',
      change: '+3.2%',
      volume: '$15.2B',
      marketCap: '$270.8B',
      isPositive: true
    },
    {
      name: 'BNB',
      symbol: 'BNB',
      price: '$305.45',
      change: '+1.8%',
      volume: '$1.2B',
      marketCap: '$47.2B',
      isPositive: true
    },
    {
      name: 'CBN',
      symbol: 'CBN',
      price: '$0.10',
      change: '+15.5%',
      volume: '$2.5M',
      marketCap: '$15.8M',
      isPositive: true,
      highlight: true
    }
  ]);

  const tabs = [
    { key: 'spot', label: 'Spot Markets' },
    { key: 'futures', label: 'Futures' },
    { key: 'defi', label: 'DeFi' },
    { key: 'nft', label: 'NFT Markets' },
    { key: 'crypto', label: 'Crypto Markets' }
  ];

  // Initialize Web3
  const initWeb3 = async () => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (error) {
        console.error('User denied account access');
      }
    } else {
      message.error('Please install MetaMask!');
    }
  };

  // Function to handle token swapping for a single pair
  const handleSwap = async (amount, fromToken, toToken, pairNumber) => {
    if (!web3 || !account || !amount) {
      message.error('Please connect wallet and enter amount');
      return;
    }

    setLoading(true);
    try {
      const router = new web3.eth.Contract(ROUTER_ABI, PANCAKESWAP_ROUTER);
      const amountIn = web3.utils.toWei(amount, 'ether');
      const path = [TOKENS[fromToken], TOKENS[toToken]];
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

      if (fromToken === 'BNB') {
        await router.methods.swapExactBNBForTokens(
          '0', // amountOutMin
          path,
          account,
          deadline
        ).send({
          from: account,
          value: amountIn
        });
      } else {
        await router.methods.swapExactTokensForTokens(
          amountIn,
          '0', // amountOutMin
          path,
          account,
          deadline
        ).send({
          from: account
        });
      }

      message.success(`Pair ${pairNumber} swap successful!`);
    } catch (error) {
      console.error('Swap error:', error);
      message.error(`Pair ${pairNumber} swap failed. Please try again.`);
    }
    setLoading(false);
  };

  // Function to handle both swaps
  const handleDualSwap = async () => {
    await handleSwap(firstPairAmount, firstPairFromToken, firstPairToToken, 1);
    await handleSwap(secondPairAmount, secondPairFromToken, secondPairToToken, 2);
  };

  const renderSwapInterface = () => (
    <div className="dual-swap-container">
      <Card title="Dual Pair Swap" className="swap-card">
        <div className="swap-pair-container">
          <h3>First Pair</h3>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div className="token-select-group">
              <Input
                placeholder="Amount"
                value={firstPairAmount}
                onChange={(e) => setFirstPairAmount(e.target.value)}
                type="number"
                style={{ width: '60%' }}
              />
              <Select
                value={firstPairFromToken}
                onChange={setFirstPairFromToken}
                style={{ width: '40%' }}
              >
                {Object.keys(TOKENS).map(token => (
                  <Option key={token} value={token}>{token}</Option>
                ))}
              </Select>
            </div>
            <div className="token-select-group">
              <SwapOutlined className="swap-icon" />
              <Select
                value={firstPairToToken}
                onChange={setFirstPairToToken}
                style={{ width: '40%' }}
              >
                {Object.keys(TOKENS).map(token => (
                  <Option key={token} value={token}>{token}</Option>
                ))}
              </Select>
            </div>
          </Space>
        </div>

        <Divider />

        <div className="swap-pair-container">
          <h3>Second Pair</h3>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div className="token-select-group">
              <Input
                placeholder="Amount"
                value={secondPairAmount}
                onChange={(e) => setSecondPairAmount(e.target.value)}
                type="number"
                style={{ width: '60%' }}
              />
              <Select
                value={secondPairFromToken}
                onChange={setSecondPairFromToken}
                style={{ width: '40%' }}
              >
                {Object.keys(TOKENS).map(token => (
                  <Option key={token} value={token}>{token}</Option>
                ))}
              </Select>
            </div>
            <div className="token-select-group">
              <SwapOutlined className="swap-icon" />
              <Select
                value={secondPairToToken}
                onChange={setSecondPairToToken}
                style={{ width: '40%' }}
              >
                {Object.keys(TOKENS).map(token => (
                  <Option key={token} value={token}>{token}</Option>
                ))}
              </Select>
            </div>
          </Space>
        </div>

        <div className="swap-actions">
          {!account ? (
            <Button type="primary" onClick={initWeb3} loading={loading}>
              Connect Wallet
            </Button>
          ) : (
            <Button type="primary" onClick={handleDualSwap} loading={loading}>
              Swap Both Pairs
            </Button>
          )}
        </div>
      </Card>
    </div>
  );

  return (
    <div className="market-overview">
      <div className="market-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="market-content">
        {activeTab === 'crypto' && (
          <div className="crypto-markets">
            <Table
              columns={[
                {
                  title: 'Coin',
                  dataIndex: 'name',
                  key: 'name',
                  render: (name, coin) => (
                    <div className="coin-info">
                      <span className="coin-name">{name}</span>
                      <span className="coin-symbol">{coin.symbol}</span>
                    </div>
                  )
                },
                {
                  title: 'Fiyat',
                  dataIndex: 'price',
                  key: 'price'
                },
                {
                  title: '24s Değişim',
                  dataIndex: 'change',
                  key: 'change',
                  render: change => (
                    <span className={change.includes('+') ? 'positive' : 'negative'}>{change}</span>
                  )
                },
                {
                  title: 'Hacim',
                  dataIndex: 'volume',
                  key: 'volume'
                },
                {
                  title: 'Market Değeri',
                  dataIndex: 'marketCap',
                  key: 'marketCap'
                }
              ]}
              dataSource={cryptoData}
              rowClassName={(record, index) => record.highlight ? 'highlight-row' : ''}
            />
          </div>
        )}
        {activeTab !== 'crypto' && renderSwapInterface()}
      </div>
    </div>
  );
};

export default MarketOverview;
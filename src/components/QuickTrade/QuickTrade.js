import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import axios from 'axios';
import { message, Input, Select, Button, Tooltip } from 'antd';
import { SwapOutlined, SettingOutlined, InfoCircleOutlined } from '@ant-design/icons';
import './QuickTrade.css';

const { Option } = Select;

const ERC20_ABI = [
    {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    }
];

const TOKENS = {
    STABLECOINS: {
        'USDT': {
            address: '0x55d398326f99059fF775485246999027B3197955',
            symbol: 'USDT',
            name: 'Tether USD',
            decimals: 18,
            icon: '💵',
            category: 'stablecoin'
        },
        'USDC': {
            address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 18,
            icon: '💵',
            category: 'stablecoin'
        },
        'BUSD': {
            address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
            symbol: 'BUSD',
            name: 'Binance USD',
            decimals: 18,
            icon: '💵',
            category: 'stablecoin'
        },
        'DAI': {
            address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
            symbol: 'DAI',
            name: 'Dai Stablecoin',
            decimals: 18,
            icon: '💵',
            category: 'stablecoin'
        }
    },
    MAJOR_COINS: {
        'BTC': {
            address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
            symbol: 'BTC',
            name: 'Bitcoin BEP20',
            decimals: 18,
            icon: '₿',
            category: 'major'
        },
        'ETH': {
            address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
            symbol: 'ETH',
            name: 'Ethereum BEP20',
            decimals: 18,
            icon: 'Ξ',
            category: 'major'
        },
        'BNB': {
            address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
            symbol: 'BNB',
            name: 'BNB',
            decimals: 18,
            icon: '🔶',
            category: 'major'
        },
        'WBNB': {
            address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
            symbol: 'WBNB',
            name: 'Wrapped BNB',
            decimals: 18,
            icon: '🔶',
            category: 'major'
        }
    },
    DEFI_TOKENS: {
        'CAKE': {
            address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
            symbol: 'CAKE',
            name: 'PancakeSwap Token',
            decimals: 18,
            icon: '🥞',
            category: 'defi'
        },
        'XVS': {
            address: '0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63',
            symbol: 'XVS',
            name: 'Venus',
            decimals: 18,
            icon: '⭐',
            category: 'defi'
        }
    },
    PLATFORM_TOKENS: {
        'CBN': {
            address: '0x511953922c61b0c8fdA962cBE87B37d8713C8121',
            symbol: 'CBN',
            name: 'CBN Token',
            decimals: 18,
            icon: '🌟',
            category: 'platform'
        }
    }
};

const QuickTrade = () => {
    const [fromToken, setFromToken] = useState('BNB');
    const [toToken, setToToken] = useState('CBN');
    const [fromAmount, setFromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    const [slippage, setSlippage] = useState(0.5);
    const [loading, setLoading] = useState(false);
    const [priceImpact, setPriceImpact] = useState(0);
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState(null);
    const [balances, setBalances] = useState({});

    // Web3 bağlantısını başlat
    useEffect(() => {
        initializeWeb3();
    }, []);

    // Bakiyeleri güncelle
    useEffect(() => {
        if (web3 && account) {
            updateBalances();
        }
    }, [web3, account, fromToken, toToken]);

    const initializeWeb3 = async () => {
        if (window.ethereum) {
            try {
                const web3Instance = new Web3(window.ethereum);
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const accounts = await web3Instance.eth.getAccounts();
                setWeb3(web3Instance);
                setAccount(accounts[0]);
            } catch (error) {
                message.error('Cüzdan bağlantısı başarısız: ' + error.message);
            }
        } else {
            message.warning('Lütfen MetaMask yükleyin.');
        }
    };

    const updateBalances = async () => {
        if (!web3 || !account) return;
        
        try {
            const fromBalance = await getTokenBalance(fromToken);
            const toBalance = await getTokenBalance(toToken);
            
            setBalances({
                ...balances,
                [fromToken]: fromBalance,
                [toToken]: toBalance
            });
        } catch (error) {
            console.error('Bakiye güncelleme hatası:', error);
        }
    };

    const getTokenBalance = async (symbol) => {
        const token = getTokenBySymbol(symbol);
        if (!token) return '0';

        const contract = new web3.eth.Contract(ERC20_ABI, token.address);
        const balance = await contract.methods.balanceOf(account).call();
        return web3.utils.fromWei(balance);
    };

    const getTokenBySymbol = (symbol) => {
        for (const category in TOKENS) {
            if (TOKENS[category][symbol]) {
                return TOKENS[category][symbol];
            }
        }
        return null;
    };

    const handleFromAmountChange = (value) => {
        setFromAmount(value);
        // Burada fiyat hesaplaması yapılacak
        calculateToAmount(value);
    };

    const calculateToAmount = async (fromValue) => {
        // Örnek bir fiyat hesaplaması
        const price = 1.5; // Bu değer API'den alınacak
        setToAmount((parseFloat(fromValue) * price).toFixed(6));
    };

    const handleSwapTokens = () => {
        const temp = fromToken;
        setFromToken(toToken);
        setToToken(temp);
        setFromAmount('');
        setToAmount('');
    };

    const handleSwap = async () => {
        if (!web3 || !account) {
            message.warning('Lütfen önce cüzdanınızı bağlayın.');
            return;
        }

        setLoading(true);
        try {
            // Swap işlemi burada gerçekleştirilecek
            message.success('Swap işlemi başarılı!');
        } catch (error) {
            message.error('Swap işlemi başarısız: ' + error.message);
        }
        setLoading(false);
    };

    const handleTokenSelect = (symbol) => {
        setFromToken(symbol);
    };

    return (
        <div className="swap-container">
            <div className="swap-header">
                <h2>Swap</h2>
                <Tooltip title="Ayarlar">
                    <Button 
                        icon={<SettingOutlined />} 
                        type="text"
                        className="settings-button"
                    />
                </Tooltip>
            </div>

            <div className="swap-form">
                <div className="token-input-container">
                    <div className="token-input-header">
                        <span>From</span>
                        <span className="balance">
                            Bakiye: {balances[fromToken] || '0'} {fromToken}
                        </span>
                    </div>
                    <div className="token-input-content">
                        <Input
                            value={fromAmount}
                            onChange={(e) => handleFromAmountChange(e.target.value)}
                            placeholder="0.0"
                            className="amount-input"
                        />
                        <Select
                            value={fromToken}
                            onChange={setFromToken}
                            className="token-select"
                            dropdownRender={(menu) => (
                                <div className="token-select-dropdown">
                                    <div className="token-search">
                                        <Input
                                            placeholder="Token ara..."
                                            className="token-search-input"
                                        />
                                    </div>
                                    <div className="token-list">
                                        <div className="token-item" onClick={() => handleTokenSelect('USDT')}>
                                            <span className="token-icon">💵</span>
                                            <span className="token-symbol">USDT</span>
                                            <span className="token-name">Tether USD</span>
                                            <span className="token-balance">{balances.USDT || '0.00'}</span>
                                        </div>
                                        <div className="token-item" onClick={() => handleTokenSelect('USDC')}>
                                            <span className="token-icon">💵</span>
                                            <span className="token-symbol">USDC</span>
                                            <span className="token-name">USD Coin</span>
                                            <span className="token-balance">{balances.USDC || '0.00'}</span>
                                        </div>
                                        <div className="token-item" onClick={() => handleTokenSelect('BTC')}>
                                            <span className="token-icon">₿</span>
                                            <span className="token-symbol">BTC</span>
                                            <span className="token-name">Bitcoin BEP20</span>
                                            <span className="token-balance">{balances.BTC || '0.00'}</span>
                                        </div>
                                        <div className="token-item" onClick={() => handleTokenSelect('ETH')}>
                                            <span className="token-icon">Ξ</span>
                                            <span className="token-symbol">ETH</span>
                                            <span className="token-name">Ethereum BEP20</span>
                                            <span className="token-balance">{balances.ETH || '0.00'}</span>
                                        </div>
                                        <div className="token-item" onClick={() => handleTokenSelect('BNB')}>
                                            <span className="token-icon">🔶</span>
                                            <span className="token-symbol">BNB</span>
                                            <span className="token-name">BNB</span>
                                            <span className="token-balance">{balances.BNB || '0.00'}</span>
                                        </div>
                                        <div className="token-item" onClick={() => handleTokenSelect('WBNB')}>
                                            <span className="token-icon">🔶</span>
                                            <span className="token-symbol">WBNB</span>
                                            <span className="token-name">Wrapped BNB</span>
                                            <span className="token-balance">{balances.WBNB || '0.00'}</span>
                                        </div>
                                        <div className="token-item" onClick={() => handleTokenSelect('CBN')}>
                                            <span className="token-icon">🌟</span>
                                            <span className="token-symbol">CBN</span>
                                            <span className="token-name">CBN Token</span>
                                            <span className="token-balance">{balances.CBN || '0.00'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        />
                    </div>
                </div>

                <Button
                    icon={<SwapOutlined />}
                    className="swap-direction-button"
                    onClick={handleSwapTokens}
                />

                <div className="token-input-container">
                    <div className="token-input-header">
                        <span>To</span>
                        <span className="balance">
                            Bakiye: {balances[toToken] || '0'} {toToken}
                        </span>
                    </div>
                    <div className="token-input-content">
                        <Input
                            value={toAmount}
                            placeholder="0.0"
                            disabled
                            className="amount-input"
                        />
                        <Select
                            value={toToken}
                            onChange={setToToken}
                            className="token-select"
                            dropdownRender={(menu) => (
                                <div className="token-select-dropdown">
                                    <div className="token-search">
                                        <Input
                                            placeholder="Token ara..."
                                            className="token-search-input"
                                        />
                                    </div>
                                    <div className="token-list">
                                        <div className="token-item" onClick={() => handleTokenSelect('USDT')}>
                                            <span className="token-icon">💵</span>
                                            <span className="token-symbol">USDT</span>
                                            <span className="token-name">Tether USD</span>
                                            <span className="token-balance">{balances.USDT || '0.00'}</span>
                                        </div>
                                        <div className="token-item" onClick={() => handleTokenSelect('USDC')}>
                                            <span className="token-icon">💵</span>
                                            <span className="token-symbol">USDC</span>
                                            <span className="token-name">USD Coin</span>
                                            <span className="token-balance">{balances.USDC || '0.00'}</span>
                                        </div>
                                        <div className="token-item" onClick={() => handleTokenSelect('BTC')}>
                                            <span className="token-icon">₿</span>
                                            <span className="token-symbol">BTC</span>
                                            <span className="token-name">Bitcoin BEP20</span>
                                            <span className="token-balance">{balances.BTC || '0.00'}</span>
                                        </div>
                                        <div className="token-item" onClick={() => handleTokenSelect('ETH')}>
                                            <span className="token-icon">Ξ</span>
                                            <span className="token-symbol">ETH</span>
                                            <span className="token-name">Ethereum BEP20</span>
                                            <span className="token-balance">{balances.ETH || '0.00'}</span>
                                        </div>
                                        <div className="token-item" onClick={() => handleTokenSelect('BNB')}>
                                            <span className="token-icon">🔶</span>
                                            <span className="token-symbol">BNB</span>
                                            <span className="token-name">BNB</span>
                                            <span className="token-balance">{balances.BNB || '0.00'}</span>
                                        </div>
                                        <div className="token-item" onClick={() => handleTokenSelect('WBNB')}>
                                            <span className="token-icon">🔶</span>
                                            <span className="token-symbol">WBNB</span>
                                            <span className="token-name">Wrapped BNB</span>
                                            <span className="token-balance">{balances.WBNB || '0.00'}</span>
                                        </div>
                                        <div className="token-item" onClick={() => handleTokenSelect('CBN')}>
                                            <span className="token-icon">🌟</span>
                                            <span className="token-symbol">CBN</span>
                                            <span className="token-name">CBN Token</span>
                                            <span className="token-balance">{balances.CBN || '0.00'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        />
                    </div>
                </div>

                <div className="swap-info">
                    <div className="info-row">
                        <span>Slippage Tolerance</span>
                        <span>{slippage}%</span>
                    </div>
                    {priceImpact > 0 && (
                        <div className="info-row">
                            <span>Price Impact</span>
                            <span className={priceImpact > 5 ? 'high-impact' : ''}>
                                {priceImpact}%
                            </span>
                        </div>
                    )}
                </div>

                {!account ? (
                    <Button
                        type="primary"
                        onClick={initializeWeb3}
                        className="connect-wallet-button"
                        block
                    >
                        Connect Wallet
                    </Button>
                ) : (
                    <Button
                        type="primary"
                        onClick={handleSwap}
                        loading={loading}
                        disabled={!fromAmount || !toAmount}
                        className="swap-button"
                        block
                    >
                        Swap
                    </Button>
                )}
            </div>
        </div>
    );
};

export default QuickTrade;

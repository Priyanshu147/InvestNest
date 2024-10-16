import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import './Dashboard.css';
import Navbar from '../Navbar/navbar';
import Footer from '../Footer/footer';
import { AuthContext } from '../Authentication/AuthContext';

const Dashboard = () => {
    const [portfolio, setPortfolio] = useState([]);
    const [topGainers, setTopGainers] = useState([]);
    const [topLosers, setTopLosers] = useState([]);
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [companyData, setCompanyData] = useState([]);
    const [stockSymbol, setStockSymbol] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            window.location.href = '/login';
            return;
        }

        const fetchPortfolio = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:5000/user-portfolio', {
                    params: { email: user.email }
                });
                setPortfolio(response.data.portfolio);
                setTopGainers(response.data.topGainers);
                setTopLosers(response.data.topLosers);
            } catch (error) {
                console.error('Error fetching portfolio:', error.response || error);
                setError('Failed to fetch portfolio');
            } finally {
                setLoading(false);
            }
        };

        fetchPortfolio();
    }, [user]);

    useEffect(() => {
        Papa.parse('/full_company_names.csv', {
            download: true,
            header: true,
            complete: (result) => {
                const data = result.data.map(item => ({
                    symbol: item.Symbol || '',
                    name: item.CompanyName || ''
                }));
                setCompanyData(data);
            },
            error: (error) => console.error('Error parsing CSV:', error),
        });
    }, []);

    const handleInputChange = (e) => {
        const query = e.target.value;
        setSearchTerm(query);

        if (query) {
            const filteredSuggestions = companyData.filter(item => {
                const symbolMatch = item.symbol && item.symbol.toLowerCase().includes(query.toLowerCase());
                const nameMatch = item.name && item.name.toLowerCase().includes(query.toLowerCase());
                return symbolMatch || nameMatch;
            });
            setSuggestions(filteredSuggestions);
        } else {
            setSuggestions([]);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setStockSymbol(suggestion.symbol);
        setSuggestions([]);
        setSearchTerm(suggestion.symbol);
    };

    const handleAddStock = async () => {
        if (!stockSymbol) return;

        try {
            setLoading(true);
            await axios.post('http://localhost:5000/add-stock', {
                email: user.email,
                stock_symbol: stockSymbol.toUpperCase()
            });

            const portfolioResponse = await axios.get('http://localhost:5000/user-portfolio', {
                params: { email: user.email }
            });
            setPortfolio(portfolioResponse.data);
            setStockSymbol('');
        } catch (error) {
            console.error('Error adding stock:', error.response || error);
            setError('Failed to add stock');
        } finally {
            setLoading(false);
            setSearchTerm('');
        }
    };

    const handleDeleteStock = async (stockSymbol) => {
        try {
            setLoading(true);
            await axios.delete('http://localhost:5000/delete-stock', {
                data: { email: user.email, stock_symbol: stockSymbol }
            });

            const portfolioResponse = await axios.get('http://localhost:5000/user-portfolio', {
                params: { email: user.email }
            });
            setPortfolio(portfolioResponse.data);
        } catch (error) {
            console.error('Error deleting stock:', error.response || error);
            setError('Failed to delete stock');
        } finally {
            setLoading(false);
        }
    };

    const handleClick = (symbol) => {
        navigate(`/stock-info/${symbol}`);
    }

    return (
        <div>
            <Navbar />
            <div className="dashboard-container">
                <div className="dashboard-content">
                    <h2>Watchlist</h2>
                    {/* Existing Code for Search and Add Stock */}
                    <div className="add-stock-section">
                        <input
                            type="text"
                            placeholder="Search Stock "
                            value={searchTerm}
                            onChange={handleInputChange}
                        />
                        {suggestions.length > 0 && (
                            <div className="suggestions-container">
                                {suggestions.map((suggestion, index) => (
                                    <div
                                        key={index}
                                        className="suggestion-item-unique"
                                        onClick={() => handleSuggestionClick(suggestion)}
                                    >
                                        {suggestion.symbol} - {suggestion.name}
                                    </div>
                                ))}
                            </div>
                        )}
                        <button onClick={handleAddStock} disabled={loading || !stockSymbol}>
                            {loading ? 'Adding...' : 'Add Stock'}
                        </button>
                    </div>

                    
                    {loading ? (
                        <p>Loading portfolio...</p>
                    ) : (
                        <div>
                            <h3>Top 5 Gainers</h3>
                            <table className="portfolio-table">
                                <thead>
                                    <tr>
                                        <th>Stock Name</th>
                                        <th>Current Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topGainers.map((stock, index) => (
                                        <tr key={index}>
                                            <td>{stock.name}</td>
                                            <td>₹{Number(stock.currentPrice).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <h3>Top 5 Losers</h3>
                            <table className="portfolio-table">
                                <thead>
                                    <tr>
                                        <th>Stock Name</th>
                                        <th>Current Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topLosers.map((stock, index) => (
                                        <tr key={index}>
                                            <td>{stock.name}</td>
                                            <td>₹{Number(stock.currentPrice).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Existing Code for displaying user's portfolio */}
                            <h2>Your Portfolio</h2>
                            <table className="portfolio-table">
                                <thead>
                                    <tr>
                                        <th>Stock Name</th>
                                        <th>Current Price</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {portfolio.map((stock, index) => (
                                        <tr key={index}>
                                            <td>{stock.name}</td>
                                            <td>₹{Number(stock.currentPrice).toFixed(2)}</td>
                                            <td>
                                                <button
                                                    className="delete-stock-button"
                                                    onClick={() => handleDeleteStock(stock.name)}
                                                    disabled={loading}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            < Footer />
        </div>
    );
};

export default Dashboard;
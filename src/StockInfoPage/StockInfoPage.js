import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StockInfoPage.css';
import Navbar from '../Navbar/navbar';
import Footer from '../Footer/footer';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const StockInfoPage = () => {
    const { stockSymbol } = useParams();
    const [stockData, setStockData] = useState(null);
    const [error, setError] = useState(null);
    const [timePeriod, setTimePeriod] = useState('1y'); // Default time period
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const periods = ['1d', '5d', '1mo', '5mo', '1y', 'max'];

    useEffect(() => {
        const fetchStockData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`http://localhost:5000/api/stock/${stockSymbol}?period=${timePeriod}`);
                setStockData(response.data);
                if (!response.data.stock_info) {
                    setError('Stock not found. Check the name again (e.g., SUZLON, MTNL).');
                }
            } catch (err) {
                setError('Error: Stock not found. Check the name again (e.g., SUZLON, MTNL).');
            } finally {
                setLoading(false);
            }
        };
        fetchStockData();
    }, [stockSymbol, timePeriod]);

    if (loading) {
        return <div className="spinner"></div>;
    }

    if (error) {
        return (
            <div>
                <Navbar />
                <div className="error-message-container">
                    <p className="error-message">{error}</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (!stockData) {
        return <div className="spinner"></div>;
    }

    const { stock_info, stock_history } = stockData;

    if (!stock_info || !stock_history || stock_history.length === 0) {
        return <div>No historical data available for {stockSymbol}</div>;
    }

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    };

    const chartData = {
        labels: stock_history.map(entry => formatDate(entry.Date)),
        datasets: [
            {
                label: 'Highest Price',
                data: stock_history.map(entry => entry.High),
                borderColor: 'rgba(138, 43, 226, 1)', // Purple border color
                backgroundColor: 'rgba(138, 43, 226, 0.2)', // Light purple background color
                fill: true,
            },
            {
                label: 'Closing Price',
                data: stock_history.map(entry => entry.Close),
                borderColor: 'rgba(0, 128, 0, 1)', // Green border color for closing price
                backgroundColor: 'rgba(0, 128, 0, 0.2)', // Light green background color for closing price
                fill: true,
            },
        ],
    };

    return (
        <div>
            <Navbar />
            <div className="container-wrapper">
                <div className="stock-company-name-container">
                    <h1>{stock_info.longName}</h1>
                </div>
                <div className="time-period-container">
                    {periods.map((period) => (
                        <button
                            key={period}
                            onClick={() => setTimePeriod(period)}
                            className={`time-period-button ${timePeriod === period ? 'active' : ''}`}
                        >
                            {period.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div className="chart-container">
                    <h2>Price History ({timePeriod.toUpperCase()})</h2>
                    <Line data={chartData} />
                </div>

                <div className="predict-button-container">
                    <button
                        onClick={() => navigate(`/predict?stockSymbol=${stockSymbol}`)}
                        className="predict-button">
                        Predict price for tomorrow
                    </button>
                </div>
                <div className="stock-company-info-container">
                    <p><strong>Sector:</strong> {stock_info.sector || 'N/A'}</p>
                    <p><strong>Industry:</strong> {stock_info.industry || 'N/A'}</p>
                    <p><strong>Website:</strong> <a href={stock_info.website} target="_blank" rel="noopener noreferrer">{stock_info.website}</a></p>
                    <p><strong>Description:</strong> {stock_info.longBusinessSummary || 'No description available.'}</p>
                </div>

                <div className="financial-status-container">
                    <h2>Financial Status</h2>
                    <p><strong>Current Price:</strong> ₹{stock_info.currentPrice || 'N/A'}</p>
                    <p><strong>Market Cap:</strong> ₹{stock_info.marketCap || 'N/A'}</p>
                    <p><strong>52-Week High:</strong> ₹{stock_info.fiftyTwoWeekHigh || 'N/A'}</p>
                    <p><strong>52-Week Low:</strong> ₹{stock_info.fiftyTwoWeekLow || 'N/A'}</p>
                    <p><strong>Dividend Yield:</strong> {stock_info.fiveYearAvgDividendYield || 'N/A'}%</p>
                    <p><strong>Average Volume:</strong> {stock_info.averageVolume || 'N/A'}</p>
                    <p><strong>Previous Close:</strong> ₹{stock_info.previousClose || 'N/A'}</p>
                    <p><strong>Closing Price:</strong> ₹{stock_history[stock_history.length - 1].Close || 'N/A'}</p> {/* Display last closing price */}
                </div>

                {/* Time Period Buttons */}
                
            </div>
            <Footer />
        </div>
    );
};

export default StockInfoPage;

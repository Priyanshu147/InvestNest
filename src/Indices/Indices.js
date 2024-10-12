import React, { useEffect, useState } from 'react';
import './Indices.css';
import Navbar from '../Navbar/navbar';
import Footer from '../Footer/footer';

const PredictStocksPage = () => {
    const [indicesData, setIndicesData] = useState([]); // State for stock indices data
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchIndicesData = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch('http://localhost:5000/stock_indices');
                if (!response.ok) {
                    const errorMessage = await response.text();
                    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorMessage}`);
                }
                const data = await response.json();
                // Adjusting the mapping to match the new structure
                setIndicesData(Object.entries(data).map(([key, value]) => ({
                    symbol: key,
                    current_price: value.current_price,
                    change_percent: value.change_percent
                })));
            } catch (error) {
                console.error('Indices Fetch error:', error);
                setError('Error fetching stock indices data. Please try again.');
            } finally {
                setLoading(false);
            }
        };
    
        fetchIndicesData();
    }, []);
    
    return (
        <div className="predict-stocks-page">
            <Navbar />
            <section className="predict-stocks-hero">
                <div className="predict-stocks-hero-content">
                    <h2>Stock Indices Information</h2>
                    <p id='predictpageArticle'>Get the latest information on key stock indices.</p>
                    {loading && (<h3 className="predict-loading">Fetching the latest indices data...</h3>)}
                    {error && <div className="predict-stocks-error">{error}</div>}
                    {!loading && !error && (
                        <table className="indices-table">
                            <thead>
                                <tr>
                                    <th>Symbol</th>
                                    <th>Current Price</th>
                                    <th>Change (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {indicesData.map((index, idx) => (
                                    <tr key={idx}>
                                        <td>{index.symbol}</td>
                                        <td>₹{index.current_price.toFixed(2)}</td>
                                        <td>{index.change_percent !== undefined ? index.change_percent.toFixed(2) : 'N/A'}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default PredictStocksPage;

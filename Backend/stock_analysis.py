import yfinance as yf
import pandas as pd
from sklearn.linear_model import LinearRegression
import ta
from statsmodels.tsa.arima.model import ARIMA
from datetime import datetime

def short_term_analysis(data, stock_symbol):
    data['SMA_30'] = ta.trend.sma_indicator(data['Close'], window=30)
    data['SMA_100'] = ta.trend.sma_indicator(data['Close'], window=100)
    data['RSI'] = ta.momentum.RSIIndicator(data['Close']).rsi()
    
    latest_data = data.dropna().iloc[-1]
    
    data = data.dropna(subset=['SMA_30', 'SMA_100', 'RSI'])
    X = data[['SMA_30', 'SMA_100', 'RSI']]
    y = data['Close']
    
    model = LinearRegression()
    model.fit(X, y)
    
    next_day_features = [[latest_data['SMA_30'], latest_data['SMA_100'], latest_data['RSI']]]
    predicted_price = model.predict(next_day_features)[0]
    
    return predicted_price

def long_term_analysis(ticker):
    data = yf.download(ticker, period='5y')
    data['Price'] = data['Close']
    data.index = pd.to_datetime(data.index)
    data['Price_diff'] = data['Price'].diff().dropna()
    model = ARIMA(data['Price_diff'].dropna(), order=(5, 1, 0))
    model_fit = model.fit()
    forecast = model_fit.forecast(steps=30)
    last_price = data['Price'].iloc[-1]
    predicted_prices = last_price + forecast.cumsum()
    return predicted_prices.iloc[-1]

def predict_stock(stock_symbol, term):
    stock_symbol = stock_symbol + '.NS'
    try:
        start_date = '2020-01-01'
        end_date = datetime.today().strftime('%Y-%m-%d')
        data = yf.download(stock_symbol, start=start_date, end=end_date)
        
        if len(data) < 2:
            return "Insufficient data"
        
        if term == 'short_term':
            prediction = short_term_analysis(data, stock_symbol)
        elif term == 'long_term':
            prediction = long_term_analysis(stock_symbol)
        else:
            return "Invalid term specified"
        
        return prediction
    except Exception as e:
        return str(e)

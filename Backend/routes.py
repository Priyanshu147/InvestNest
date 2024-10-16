from flask import request, jsonify
from stock_analysis import predict_stock
from db_operations import collection
from utils import load_mappings
import yfinance as yf
from flask_cors import CORS

def register_routes(app):
    @app.route('/stock_indices', methods=['GET'])
    def stock_indices():
        tickers = ['^NSEI', '^NSEBANK', '^CNX100','^NSEMDCP50', ]
        indices_data = {}

        for ticker in tickers:
            stock = yf.Ticker(ticker)
            data = stock.history(period="2d")  # Fetch the last 2 days of data
            if not data.empty and len(data) > 1:  # Check if there are at least 2 rows
                indices_data[ticker] = {
                    'current_price': data['Close'].iloc[-1],
                    'change_percent': ((data['Close'].iloc[-1] - data['Close'].iloc[-2]) / data['Close'].iloc[-2]) * 100
                }
            else:
                indices_data[ticker] = {
                    'current_price': None,
                    'change_percent': None
                }

        return jsonify(indices_data)

    @app.route('/predict', methods=['POST'])
    def predict():
        data = request.json
        stock_symbol = data.get('stock_symbol')
        term = data.get('term')
        prediction = predict_stock(stock_symbol, term)
        return jsonify({'prediction': prediction})

    
    

    @app.route('/submit-form', methods=['POST'])
    def submit_form():
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        email = data.get('email')
        existing_user = collection.find_one({'email': email})
        if existing_user:
            return jsonify({
                'error': 'User already registered\nPlease Login',
                'redirect_url': '/login'
            }), 200
        data['stocks'] = []
        result = collection.insert_one(data)
        if result.acknowledged:
            return jsonify({'message': 'Data stored successfully'}), 200
        else:
            return jsonify({'error': 'Failed to store data'}), 500

    @app.route('/api/login', methods=['POST'])
    def login():
            data = request.json
            email = data.get('email')
            password = data.get('password')
            user = collection.find_one({'email': email})
            if user:
                hashed_password = user['password']
                if password == hashed_password:
                    return jsonify({
                        'message': 'Login successful',
                        'name': user['firstName'],
                        'email': user['email'],
                        'profilePicture': user.get('profilePicture', '')
                    }), 200
                else:
                    return jsonify({'message': 'Invalid password'}), 401
            else:
                return jsonify({'message': 'User not found'}), 404

        
    @app.route('/api/stock/<string:symbol>', methods=['GET'])
    def get_stock_data(symbol):
        try:
            period = request.args.get('period', '1y')  # Default to 1 year
            stock = yf.Ticker(symbol + '.NS')
            stock_info = stock.info
            if not stock_info:
                return jsonify({'error': 'No stock information available'}), 404
            stock_history = stock.history(period=period)
            if stock_history.empty:
                return jsonify({'error': 'No historical data available'}), 404
            stock_history = stock_history.reset_index().to_dict(orient='records')
            return jsonify({
                'stock_info': stock_info,
                'stock_history': stock_history
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500


    @app.route('/user-portfolio', methods=['GET'])
    def get_user_portfolio():
        email = request.args.get('email')
        if not email:
            return jsonify({'error': 'Email not provided'}), 400
        user = collection.find_one({'email': email})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        stocks = user.get('stocks', [])
        portfolio = []
        
        for symbol in stocks:
            try:
                stock_data = yf.Ticker(symbol + '.NS')
                current_price = stock_data.history(period='1d')['Close'].iloc[-1]
                short_term_pred = predict_stock(symbol, 'short_term')
                long_term_pred = predict_stock(symbol, 'long_term')
                portfolio.append({
                    'name': symbol,
                    'currentPrice': current_price,
                    'predictedShortTermPrice': short_term_pred,
                    'predictedLongTermPrice': long_term_pred
                })
            except Exception as e:
                print(f"Error fetching data for {symbol}: {e}")
                continue

        # Calculate top gainers and losers
        gainers = sorted(portfolio, key=lambda x: x['currentPrice'] - x['predictedShortTermPrice'], reverse=True)[:5]
        losers = sorted(portfolio, key=lambda x: x['currentPrice'] - x['predictedShortTermPrice'])[:5]

        return jsonify({
            'portfolio': portfolio,
            'topGainers': gainers,
            'topLosers': losers
        })


    @app.route('/add-stock', methods=['POST'])
    def add_stock():
        data = request.json
        email = data.get('email')
        stock_symbol = data.get('stock_symbol')
        if not email or not stock_symbol:
            return jsonify({'error': 'Email or stock symbol not provided'}), 400
        user = collection.find_one({'email': email})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        if stock_symbol not in user.get('stocks', []):
            collection.update_one(
                {'email': email},
                {'$push': {'stocks': stock_symbol}}
            )
            return jsonify({'message': 'Stock added to portfolio'}), 200
        else:
            return jsonify({'message': 'Stock already in portfolio'}), 200

    @app.route('/delete-stock', methods=['DELETE'])
    def delete_stock():
        data = request.json
        email = data.get('email')
        stock_symbol = data.get('stock_symbol')
        if not email or not stock_symbol:
            return jsonify({'error': 'Email or stock symbol not provided'}), 400
        user = collection.find_one({'email': email})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        if stock_symbol in user.get('stocks', []):
            result = collection.update_one(
                {'email': email},
                {'$pull': {'stocks': stock_symbol}}
            )
            if result.acknowledged and result.modified_count > 0:
                return jsonify({'message': 'Stock removed from portfolio'}), 200
            else:
                return jsonify({'error': 'Failed to remove stock'}), 500
        else:
            return jsonify({'error': 'Stock not found in portfolio'}), 404

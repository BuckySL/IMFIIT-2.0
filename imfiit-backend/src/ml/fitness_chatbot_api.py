from flask import Flask, request, jsonify
from fitness_chatbot import FitnessChatbotAPI

app = Flask(__name__)
chatbot_api = FitnessChatbotAPI()

@app.route('/chatbot/profile', methods=['POST'])
def create_profile():
    data = request.json
    result = chatbot_api.handle_request({
        'action': 'create_profile',
        'user_data': data
    })
    return jsonify(result)

@app.route('/chatbot/message', methods=['POST'])
def process_message():
    data = request.json
    result = chatbot_api.handle_request({
        'action': 'process_message',
        'user_id': data['userId'],
        'message': data['message']
    })
    return jsonify(result)

if __name__ == '__main__':
    app.run(port=5001)
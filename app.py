from flask import Flask, render_template
from flask_socketio import SocketIO
import logging
#from tools import get_region_resources

app = Flask(__name__)
socketio = SocketIO(app, ping_interval=10, ping_timeout=20, cors_allowed_origins = "http://localhost:5000")


app.logger.setLevel(logging.INFO)

@app.route('/')
def index():
    app.logger.info("An user joined the server")
    return render_template('index.html')

@socketio.on('region_clicked')
def handle_region_click(message):
    #resources = get_region_resources(data['region'])
    app.logger.info(message)

if __name__ == "__main__":
    socketio.run(app, debug=True)

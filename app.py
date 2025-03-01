from flask import Flask, render_template
from flask_socketio import SocketIO
#from tools import get_region_resources

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('region_clicked')
def handle_region_click(data):
    #resources = get_region_resources(data['region'])
    app.logger.message(f"User clicked on {data['region']}")
    socketio.emit('log_message', f"User clicked on {data['region']}")

if __name__ == "__main__":
    socketio.run(app, debug=True)

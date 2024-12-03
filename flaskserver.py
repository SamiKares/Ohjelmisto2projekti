from flask import Flask, Response
from database import Database
import json
from flask_cors import CORS

db = Database()
app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
current_ap = 'EGGW'
game_id = ''
total_travel_dist = 0
total_co2_spent = 0
money = 1000
tired = 0
time_spent = 0
current_ap = 'EGGW'
first_target = 0

@app.route('/easterner')
def flask_easterner():
    value = Database.get_easterner_ap(db, current_ap)
    return value

@app.route('/create_game')
def flask_creategame():
    global game_id
    game_id = Database.create_game(db, money, current_ap, tired)
    return "done"

@app.route('/checkgameid')
def flask_chekid():
    value = game_id
    return json.dumps(value)

@app.route('/weatherat')
def flask_weatherat():
    value = Database.getweatherat(db, current_ap)
    return json.dumps(value)

@app.errorhandler(404)
def page_not_found(virhekoodi):
    vastaus = {
        "status" : "404",
        "teksti" : "Virheellinen päätepiste"
    }
    jsonvast = json.dumps(vastaus)
    return Response(response=jsonvast, status=404, mimetype="application/json")

if __name__ == '__main__':
    app.run(use_reloader=True, host='127.0.0.1', port=3000)


from flask import Flask, Response, jsonify, request
from database import Database
import json
from flask_cors import CORS

db = Database()
app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
game_id = ''
total_travel_dist = 0
total_co2_spent = 0
money = 1000
tired = 0
time_spent = 0
first_target = 0

@app.route('/easterner')
def flask_easterner():
    value = Database.get_easterner_ap(db, Database.pull_location(db).get('location'))
    return jsonify(value)


@app.route('/currentloca')
def flask_current_loca():
    icao = request.args.get('icao')
    location = Database.get_airport_info(db, icao)
    return jsonify(location)
@app.route('/create_game')
def flask_creategame():
    global game_id
    game_id = Database.create_game(db)
    return str(game_id)

@app.route('/checkgameid')
def flask_chekid():
    value = game_id
    return json.dumps(value)

@app.route('/weatherat')
def flask_weatherat():
    airport = request.args.get('airport')
    value = Database.getweatherat(db, airport)
    return json.dumps(value)

@app.route('/fly')
def flask_update_location():
    Database.save_visited_ports(db, Database.pull_location(db).get('location'))
    targetap = request.args.get('to')
    Database.update_location(db, targetap, Database.pull_location(db).get('tired'), Database.pull_location(db).get('money'), Database.pull_location(db).get('id'))
    value = Database.get_airport_info(db, targetap)
    return value

@app.route('/pull_loca')
def flask_end_game():
    data = Database.pull_location(db)
    return data

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


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
destinations = ["HECA", "VECC", "VHHH", "RJTT", "KSFO"
,"KJFK", "EGGW"]
visited = {"HECA":0, "VECC":0, "VHHH":0, "RJTT":0, "KSFO":0
,"KJFK":0, "EGGW":0}

@app.route('/easterner')
def flask_easterner():
    global visited
    currloc = Database.pull_location(db).get('location')
    for i in destinations:
        if currloc == i:
            visited[i] = 1
    value = Database.get_easterner_ap(db, currloc)
    checkgoal = Database.checkforgoal(db, currloc)
    for i in range(len(checkgoal)):
        for a in destinations:
            if checkgoal[i]['ident'] == a:
                targetname = Database.get_airport_info(db, a).get('name')
                targetlat = Database.get_airport_info(db, a).get('latitude_deg')
                targetlon = Database.get_airport_info(db, a).get('longitude_deg')
                targetcountry = Database.get_airport_info(db, a).get('iso_country')
                endvalue = {"1":[Database.calculate_distance(db, Database.pull_location(db).get('location'), a), targetname, a, targetcountry, targetlat, targetlon]}
                return endvalue
    for i in range(len(value)):
        for a in destinations:
            if value[i+1][2]==a:
                return {"1":value[i+1]}
    if currloc == "RJTT":
        targetname = Database.get_airport_info(db, destinations[4]).get('name')
        targetlat = Database.get_airport_info(db, destinations[4]).get('latitude_deg')
        targetlon = Database.get_airport_info(db, destinations[4]).get('longitude_deg')
        targetcountry = Database.get_airport_info(db, a).get('iso_country')
        return {"1":[Database.calculate_distance(db, currloc, destinations[4]), targetname, destinations[4], targetcountry, targetlat, targetlon]}
    if currloc == "KSFO":
        targetname = Database.get_airport_info(db, destinations[6]).get('name')
        targetlat = Database.get_airport_info(db, destinations[6]).get('latitude_deg')
        targetlon = Database.get_airport_info(db, destinations[6]).get('longitude_deg')
        targetcountry = Database.get_airport_info(db, a).get('iso_country')
        return {"1":[Database.calculate_distance(db, currloc, destinations[6]), targetname, destinations[6], targetcountry, targetlat, targetlon]}
    return jsonify(value)


@app.route('/currentloca')
def flask_current_loca():
    icao = request.args.get('icao')
    location = Database.get_airport_info(db, icao)
    return jsonify(location)
@app.route('/create_game')
def flask_creategame():
    global visited
    for i in visited:
        visited[i] = 0
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

@app.route('/checkgoal')
def flask_check_goal():
    value = Database.checkforgoal(db, Database.pull_location(db).get('location'))
    for i in range(len(value)):
        for a in destinations:
            if value[i]['ident'] == a:
                return a
    return "no balls"

@app.route('/visitedgoals')
def flask_visited():
    data = visited
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


import mysql.connector
from geopy import distance

class Database:
    def __init__(self):
        self.connection = mysql.connector.connect(
        host='localhost',
        port=3306,
        database='aroundtheworld',
        user='ympari',
        password='1234',
        collation = 'utf8mb4_general_ci',
        autocommit=True
        )
    def get_connection(self):
        return self.connection
    def get_current_longitude(self, current_ap):
        sql = f"SELECT longitude_deg FROM airport WHERE ident = %s;"
        cursor = self.connection.cursor(dictionary=True)
        cursor.execute(sql, (current_ap,))
        result = cursor.fetchone()
        return result.get('longitude_deg') if result else None
    def get_airport_info(self, icao):
        sql = f'''SELECT iso_country, ident, name, latitude_deg, longitude_deg
                  FROM airport
                  WHERE ident = %s'''
        cursor = self.connection.cursor(dictionary=True)
        cursor.execute(sql, (icao,))
        result = cursor.fetchone()
        return result
    def get_country_for_iso(self, iso_country):
        list = []
        sql = f"select name from country where iso_country = '{iso_country}';"
        cursor = self.connection.cursor(dictionary=True)
        cursor.execute(sql)
        result = cursor.fetchone()
        list.append(result.get('name'))
        return list
    def fetch_highscores(self):
        list = []
        sql = f"SELECT DistanceTravelled, co2Consumed, DaysTravelled FROM highscores order by g_id DESC limit 10;"
        cursor = self.connection.cursor(dictionary=True)
        cursor.execute(sql)
        ran = len(cursor.fetchall())
        cursor.execute(sql)
        for i in range(ran):
            result = cursor.fetchone()
            list.append(result)
        return list
    def update_location(self, icao, p_tired, u_money, g_id):
        sql = f'''UPDATE game SET location = %s, tired = %s, money = %s WHERE id = %s'''
        cursor = self.connection.cursor(dictionary=True)
        cursor.execute(sql, (icao, p_tired, u_money, g_id))

    def record_highscore(self, distance, co2, timespent, game_id):
        sql = f'''INSERT INTO highscores (DistanceTravelled, co2Consumed , DaysTravelled, g_id) VALUES (%s, %s, %s, %s);'''
        cursor = self.connection.cursor(dictionary=True)
        cursor.execute(sql, (distance, co2, timespent, game_id))
    def get_easterner_ap(self, c_ap):
        nineclosest = {}
        listnine = []

        sql = f"SELECT name, longitude_deg, latitude_deg, ident, iso_country FROM airport WHERE longitude_deg > '{self.get_current_longitude(c_ap)}' ORDER BY longitude_deg;"
        cursor = self.connection.cursor(dictionary=True, buffered=True)
        cursor.execute(sql)
        ran = len(cursor.fetchall())
        cursor.execute(sql)
        for i in range(ran):
            result = cursor.fetchone()
            if result and 500 < self.calculate_distance(c_ap, result.get('ident')) :
                tuple = self.calculate_distance(c_ap, result.get('ident')), result.get('name'), result.get('ident'), result.get('iso_country')
                listnine.append(tuple)
        sortedlist9 = sorted(listnine)
        a = 0
        for i in range(len(sortedlist9)-1):
            if a < 9:
                a+=1
                nineclosest.update({a:sortedlist9[a]})
        return nineclosest
    def calculate_distance(self, current, target):
        start = self.get_airport_info(current)
        end = self.get_airport_info(target)
        if start and end:
            return distance.distance((start.get('latitude_deg'), start.get('longitude_deg')),
                                    (end.get('latitude_deg'), end.get('longitude_deg'))).km
        return None




#class Geopy:
   # def __init__(self):
    ##    pass
   # def calculate_distance(current, target):
        start = Database.get_airport_info(current)
        end = Database.get_airport_info(target)
        if start and end:
            return distance.distance((start.get('latitude_deg'), start.get('longitude_deg')),
                                    (end.get('latitude_deg'), end.get('longitude_deg'))).km
        return None
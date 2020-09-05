import requests
import xlrd
import pymongo
from pymongo import MongoClient

client = pymongo.MongoClient('mongodb+srv://rootUser:HelloRabbits@cluster0.zq5ai.gcp.mongodb.net/CovidData?retryWrites=true&w=majority')
db = client.get_database('CovidData')
covid_tests = db["countymodels"]

url = 'https://www.doh.wa.gov/Portals/1/Documents/1600/coronavirus/data-tables/PUBLIC_CDC_Event_Date_SARS.xlsx'
r = requests.get(url, allow_redirects=True)
workbook = xlrd.open_workbook(file_contents=r.content)

sheet = workbook.sheet_by_index(0)
counter = 1
info = str(sheet.cell(counter, 0).value.encode('ascii','ignore')).split()[0]
data = { 'name': info, 'weeks': [], 'cases': []}
while info != 'Unassigned':
    week = sheet.cell(counter, 1).value
    cases = sheet.cell(counter, 2).value
    data["weeks"].append(str(week))
    data["cases"].append(str(cases))
    counter += 1
    info = str(sheet.cell(counter, 0).value.encode('ascii','ignore')).split()[0]
    if info != str(sheet.cell(counter - 1, 0).value.encode('ascii','ignore')).split()[0]:
        covid_tests.replace_one({"name": data['name']}, data, True)
        data['name'] = info
        data['weeks'] = []
        data['cases'] = []


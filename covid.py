import requests
import xlrd
import json

url = 'https://www.doh.wa.gov/Portals/1/Documents/1600/coronavirus/data-tables/PUBLIC_CDC_Event_Date_SARS.xlsx'
r = requests.get(url, allow_redirects=True)
open('covid-data.xls', 'wb').write(r.content)
workbook = xlrd.open_workbook('covid-data.xls')
sheet = workbook.sheet_by_index(0)
counter = 1;
info = str(sheet.cell(counter, 0).value.encode('ascii','ignore')).split()[0]
f = open('CovidData/covid-data.json', 'w')
data = {}
while info != 'Unassigned':
    if info != str(sheet.cell(counter - 1, 0).value.encode('ascii','ignore')).split()[0]:
        data[info] = {
            "week": [],
            "cases": []
        }
    week = sheet.cell(counter, 1).value
    cases = sheet.cell(counter, 2).value
    data[info]["week"].append(str(week))
    data[info]["cases"].append(str(cases))
    counter += 1
    info = str(sheet.cell(counter, 0).value.encode('ascii','ignore')).split()[0]
json.dump(data, f)
f.close()

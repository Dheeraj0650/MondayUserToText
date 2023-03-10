import json
import requests
import re

def makePostRequest(query):
    apiKey = "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjE1Nzg4NTk2MiwidWlkIjoyMDEyODc5MSwiaWFkIjoiMjAyMi0wNC0yN1QyMToyMTowOC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6ODE2NTcyMSwicmduIjoidXNlMSJ9.QpO7qnSi_gZ0M76JQca1UmL0KWKw-m04A2dTVF-PPgo"
    apiUrl = "https://api.monday.com/v2"
    headers = {"Authorization" : apiKey}

    data = {'query' : query}

    r = requests.post(url=apiUrl, json=data, headers=headers)
    return r.json()

def lambda_handler(event, context):
    # TODO implement
    bodyJSON = json.loads(event['body'])
    if(bodyJSON != None and 'event' in bodyJSON):
        return getMethodHandler(bodyJSON)
    elif(bodyJSON != None and 'challenge' in bodyJSON):
        return postMethodHandler(event)
  
    return {
        'statusCode': 200,
        'body': json.dumps("hello")
    }

def postMethodHandler(event):
    return {
        'statusCode': 200,
        'body': event['body']
    }

def getMethodHandler(data):
    boardID = "no board"
    columnTitle = ""
    columnID = ""
    if (data['event']):
        boardID = data['event']['boardId']
        columnTitle = data['event']['columnTitle']
        columnID = data['event']['columnId']
        
    print("Request from board " + str(boardID)  + "\n");

    #after getting which board and column the request came from replace those names with text
    replaceNamesOfBoard(boardID, columnID)


def replaceNamesOfBoard(boardID, columnID):
    print("getting people from board " + str(boardID))
    # get each of the people and their item as an array of objects (updatedItems)
    updatedItems = getBoardItemPeople(boardID, columnID)
    print(updatedItems)
    # File Preparation Board
    if (boardID == 1216072299):
        # Editor (FP) User
        if (columnID == "people") :
            print("Making change to Editor (FP)...")
            # Change each item with updated names (from updatedItems) for Editor (FP) {text3}
            for updatedItem in updatedItems:
                if (updatedItem['personName']):
                    mutate(boardID, int(updatedItem['itemID']), "text3", updatedItem['personName']);

        # Reviewer (FP) User
        if (columnID == "people2"): 
            print("Making change to Reviewer (FP)...")
            # Change each item with updated names (from updatedItems) for Reviwer (FP) {text9}
            for updatedItem in updatedItems:
                if (updatedItem['personName']):
                    mutate(boardID, int(updatedItem['itemID']), "text9", updatedItem['personName'])
                    
    # File Preparation Board
    if (boardID == 1216072299):
        # Editor (FP) User
        if (columnID == "people"):
            print("Making change to Editor (FP)...")
            # Change each item with updated names (from updatedItems) for Editor (FP) {text3}
            for updatedItem in updatedItems:
                if (updatedItem['personName']):
                    mutate(boardID, int(updatedItem['itemID']), "text3", updatedItem['personName'])
   
        # Reviewer (FP) User
        if (columnID == "people2"):
            print("Making change to Reviewer (FP)...")
            # Change each item with updated names (from updatedItems) for Reviwer (FP) {text9}
            for updatedItem in updatedItems:
                if (updatedItem['personName']):
                    mutate(boardID, int(updatedItem['itemID']), "text9", updatedItem['personName'])

    # File Conversion Board
    if (boardID == 1216070690):
        # Editor (User)
        if (columnID == "people4"):
            print("Making change to Editor (FC)...")
            # Change each item with updated names (from updatedItems) for Editor {text48}
            for updatedItem in updatedItems:
                if (updatedItem['personName']):
                    mutate(boardID, int(updatedItem['itemID']), "text48", updatedItem['personName']);
                    
        # Initial Reviewer (User)
        if (columnID == "people3"):
            print("Making change to Initial Reviewer (FC)")
            # Change each item with updated names (from updatedItems) for Initial Reviewer {text0}
            for updatedItem in updatedItems:
                if (updatedItem['personName']):
                    mutate(boardID, int(updatedItem['itemID']), "text0", updatedItem['personName']);


        # Final Reviewer (User)
        if (columnID == "people20"):
            print("Making change to Final Reviewer (FC)...")
            # Change each item with updated names (from updatedItems) for Final Reviewer {text457}
            for updatedItem in updatedItems:
                if (updatedItem['personName']):
                    mutate(boardID, int(updatedItem['itemID']), "text457", updatedItem['personName'])
                    
                
    # File Publishing Board
    if (boardID == 1219099844):
        # Publisher (User) 
        if (columnID == "people"):
            print("Making change to Publisher...")
            # Change each item with updated names (from updatedItems) for Publisher {text2}
            for updatedItem in updatedItems:
                if (updatedItem['personName']):
                    mutate(boardID, int(updatedItem['itemID']), "text2", updatedItem['personName'])
                    
                    
def getBoardItemPeople(boardID, columnID):
    query = """query { boards (ids:%s) { items { id column_values (ids: %s) { id value } } } }""" % (boardID, columnID)
    board_json = makePostRequest(query)

    updated_item_array = []
    items = board_json["data"]["boards"][0]["items"] if board_json.get("data") else None
    if items:
        for item in items:
            item_id = item["id"]
            item_value = item["column_values"][0]["value"] if item["column_values"] else None
            person_id = None
            person_name = None

            if item_value:
                id_match = re.search(r"\d{7,}", item_value)
                if id_match:
                    person_id = id_match.group(0)
                    person_query = """query { users (ids:%s) { name } }""" % person_id
                    person_json = makePostRequest(person_query)
                    person_name = person_json["data"]["users"][0]["name"] if person_json['data'] else None

            updated_item = {
                "itemID": item_id,
                "personID": person_id,
                "personName": person_name
            }
            
            updated_item_array.append(updated_item)

    return updated_item_array
    

def mutate(boardID, itemID, column, text):
    column_values = {
        column: text
    }
    mutation = f'mutation {{change_multiple_column_values (board_id: {boardID}, item_id: {itemID}, column_values: {json.dumps(json.dumps(column_values))} ) {{ id }} }}'
    print(mutation)
    response_data = makePostRequest(mutation)
    print(response_data)

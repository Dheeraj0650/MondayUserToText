// 'use strict';
// import {
//     updateBoardNames
// } from './mutate';

import 'dotenv/config'
import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

const PORT = process.env.PORT || 8080;
const app = express().use(bodyParser.json());



app.listen(PORT, () => {
    console.log(`listening on port: ${PORT}`);
})

app.get('/', (req, res) => {
    return res.end('hello');
});

// monday webhook will make a post request (requires the exact request body to be the response)
app.post("/", (req, res) => {
    let boardID = "no board";
    let columnTitle;
    let columnID;
    // console.log(req.body.event);
    if (req.body.event) {
        boardID = req.body.event.boardId;
        columnTitle = req.body.event.columnTitle;
        columnID = req.body.event.columnId;
    }
    console.log(`Request from board ${boardID}...\n`);
    // console.log(JSON.stringify(req.body, 0, 2));

    // after getting which board and column the request came from replace those names with text
    replaceNamesOfBoard(boardID, columnID);

    res.status(200).send(req.body);
})


// used for accessing monday.com (autorization will change here per user)
let options = {
    method: 'post',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.MONDAY_KEY
    },
    body: JSON.stringify({
        query: undefined
    })
};





async function replaceNamesOfBoard(boardID, columnID) {
    console.log(`getting people from board ${boardID}: `);
    // get each of the people and their item as an array of objects (updatedItems)
    const updatedItems = await getBoardItemPeople(boardID, columnID);

    // File Preparation Board
    if (boardID == 1216072299) {
        // Editor (FP) User
        if (columnID == "people") {
            console.log("Making change to Editor (FP)...");
            // Change each item with updated names (from updatedItems) for Editor (FP) {text3}
            for (let updatedItem of updatedItems) {
                if (updatedItem.personName) {
                    mutate(boardID, parseInt(updatedItem.itemID), "text3", updatedItem.personName);
                }
            }
        }
        // Reviewer (FP) User
        if (columnID == "people2") {
            console.log("Making change to Reviewer (FP)...");
            // Change each item with updated names (from updatedItems) for Reviwer (FP) {text9}
            for (let updatedItem of updatedItems) {
                if (updatedItem.personName) {
                    mutate(boardID, parseInt(updatedItem.itemID), "text9", updatedItem.personName);
                }
            }
        }
    }

    // File Conversion Board
    if (boardID == 1216070690) {
        // Editor (User)
        if (columnID == "people4") {
            console.log("Making change to Editor (FC)...");
            // Change each item with updated names (from updatedItems) for Editor {text48}
            for (let updatedItem of updatedItems) {
                if (updatedItem.personName) {
                    mutate(boardID, parseInt(updatedItem.itemID), "text48", updatedItem.personName);
                }
            }
        }

        // Initial Reviewer (User)
        if (columnID == "people3") {
            console.log("Making change to Initial Reviewer (FC)");
            // Change each item with updated names (from updatedItems) for Initial Reviewer {text0}
            for (let updatedItem of updatedItems) {
                if (updatedItem.personName) {
                    mutate(boardID, parseInt(updatedItem.itemID), "text0", updatedItem.personName);
                }
            }
        }

        // Final Reviewer (User)
        if (columnID == "people20") {
            console.log("Making change to Final Reviewer (FC)...");
            // Change each item with updated names (from updatedItems) for Final Reviewer {text457}
            for (let updatedItem of updatedItems) {
                if (updatedItem.personName) {
                    mutate(boardID, parseInt(updatedItem.itemID), "text457", updatedItem.personName);
                }
            }
        }

    }

    // File Publishing Board
    if (boardID == 1219099844) {
        // Publisher (User) 
        if (columnID == "people") {
            console.log("Making change to Publisher...");
            // Change each item with updated names (from updatedItems) for Publisher {text2}
            for (let updatedItem of updatedItems) {
                if (updatedItem.personName) {
                    mutate(boardID, parseInt(updatedItem.itemID), "text2", updatedItem.personName);
                }
            }
        }
    }




    console.log("completed array of updated items: ", updatedItems);
}




/**
 * gets all of the people in a given board and column from a monday board
 * @param {the board to get the items for} boardID 
 * @param {the column the request came from} columnID 
 * @returns an array of objects with the people and their item ids 
 */
async function getBoardItemPeople(boardID, columnID) {
    // Will fill this away with new objects 
    let updatedItemArray = [];
    // Set query for board to get
    const boardquery = `query { boards (ids:${boardID}) { items 
        { id column_values (ids: ${columnID}) { id value } }
        } }`;
    // Update options of request to fetch
    options.body = JSON.stringify({
        query: boardquery
    })

    const boardResponse = await fetch("https://api.monday.com/v2", options);
    const boardJSON = await boardResponse.json();
    // console.log(JSON.stringify(boardJSON, null, 2))

    // console.log(boardJSON);
    let items;
    if (boardJSON.data) {
        items = boardJSON.data.boards[0].items
    }

    if (items) {
        // console.log(items);
        for (let item of items) {
            // console.log(item);
            const idRE = /[0-9]{7,}/;
            const itemID = item.id;
            // console.log(itemID);
            const itemValue = item.column_values[0].value;
            let personID = undefined;
            let personName = undefined;
            // console.log(itemValue);

            if (itemValue) {
                const idmatch = itemValue.match(idRE);
                // console.log(`Item value: ${itemValue}`);
                // console.log(`Item match: ${idmatch}`);
                
                // Only query for person if an ID was found in item
                if (idmatch) {
                    personID = idmatch[0];
                    // console.log(personID);
    
                    // Fetch for the name of people given personid
                    const personquery = `query { users (ids:${personID}) { name } }`;
                    // Update options of request to fetch
                    options.body = JSON.stringify({
                        query: personquery
                    })
                    const personResponse = await fetch("https://api.monday.com/v2", options);
                    const personJSON = await personResponse.json();
                    personName = personJSON.data.users[0].name;
                    // console.log(personName);
                }
            }



            let updatedItem = {
                itemID,
                personID,
                personName
            };
            updatedItemArray.push(updatedItem);
            // console.log(updatedItem);
        }
    }
    // console.log(updatedItemArray);
    return updatedItemArray;
}

/**
 * makes the change to the board
 * @param {which board to mutute} boardID 
 * @param {which item to mutate} itemID 
 * @param {which column to add too} column 
 * @param {what to mutate the column to} text 
 */
async function mutate(boardID, itemID, column, text) {
    const variables = JSON.stringify({
        myBoardId: boardID,
        myItemId: itemID,
        myColumnValues: `{\"${column}\" : \"${text}\"}`
    });
    const query = "mutation ($myBoardId:Int!, $myItemId:Int!, $myColumnValues:JSON!) { change_multiple_column_values(item_id:$myItemId, board_id:$myBoardId, column_values: $myColumnValues) { id } }";

    options.body = JSON.stringify({
        query: query,
        variables: variables
    })
    // console.log(options);

    const response = await fetch("https://api.monday.com/v2", options);
    const json = await response.json();
    // console.log(json);
}
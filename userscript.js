// ==UserScript==
// @name         GeoFS FMC Route and display generator
// @namespace    http://tampermonkey.net/
// @version      v0.2
// @description  Adds a simple FMC pop-up UI and draws your flight plan on the Nav panel.
// @author       GGamerGGuy
// @match        https://www.geo-fs.com/geofs.php?v=*
// @match        https://*.geo-fs.com/geofs.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geo-fs.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    window.databaseInited = false;
    var bottomDiv = document.getElementsByClassName('geofs-ui-bottom')[0];
        window.fltPlnBtn = document.createElement('div');
        window.fltPlnBtn.id = 'fltPlnBtn';
        window.fltPlnBtn.classList = 'mdl-button';
        bottomDiv.appendChild(window.fltPlnBtn);
    window.fltPlnBtn.innerHTML = `<button class="mdl-button" onclick="window.openFMCPopup()">FLIGHT PLAN</button>`
        let url = "https://tylerbmusic.github.io/GPWS-files_geofs/navaids.gpx"; //first DB
        fetch(url).then(response => response.text()).then(gpxData => {
            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(gpxData, "text/xml");
            window.waypoints = xmlDoc.getElementsByTagName("wpt");
            console.log("Waypoint Database successfully loaded.");
            getData2();
        }).catch(error => console.error('Error:', error));
    async function getData2() {
        const resp = await fetch("https://raw.githubusercontent.com/Qantas94Heavy/autopilot-pp/v0.12.0/data/earth_fix.dat"); //Second DB
        window.data2 = await resp.text();
        window.databaseInited = true;
        var doneDing = new Audio("https://tylerbmusic.github.io/GPWS-files_geofs/ding.wav");
        doneDing.play();
    }
    window.navaids3 = [];
    async function getData3() {
        for (let i = 1; i <= 4; i++) {
            const url = 'https://api.core.openaip.net/api/navaids?page=' + i; //Third DB
            const headers = {
                'x-openaip-client-id': '18139458ef193543c0d08849b8eb1daf'
            };

            try {
                const response = await fetch(url, { headers });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                window.navaids3.push(await response.json());
                console.log("Got Data 3." + i);
                //console.log("[insert attribution here]");
            } catch (error) {
                console.log('There has been a problem with your fetch operation: ', error.message);
            }
        }
    }
    window.navaids4 = [];
    async function getData4() {
        for (var i = 1; i <= 6; i++) {
            const url = 'https://api.core.openaip.net/api/reporting-points';
            const headers = {
                'x-openaip-client-id': '18139458ef193543c0d08849b8eb1daf'
            };
            try {
                const response = await fetch(url, { headers });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                window.navaids4.push(await response.json());
                console.log("Got Data 4.");
                //console.log("[insert attribution here]");
            } catch (error) {
                console.log('There has been a problem with your fetch operation: ', error.message);
            }
        }
    }
    getData3();
    getData4();
    console.log("Nav databases 3 and 4 are provided by https://openaip.net");

    window.cpa002FlightPlan = async function() { //I see CPA002 create more of these than anyone else, and idk what else to call the function. The function itself adds points on the map when given a string containing the FMC JSON format.
        let cpaText = document.getElementById("cpa").value;
        let flp = JSON.parse(cpaText);
        let ret = [];
        for (let i = 0; i < flp[3].length; i++) {
            ret.push([flp[3][i][1], flp[3][i][2]]); //flp[3][i][1] is the latitude coordinate for each waypoint and flp[3][i][2] is the longitude coordinate for each waypoint
        }
        if (!geofs.api.map.flightPathOn) {
            geofs.api.map.createPath();
        }
        geofs.api.map.setPathPoints(ret);
        geofs.api.map.stopCreatePath();
    }

    window.simbriefFlightPlan = async function(flp) {
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(flp, "text/xml");
        window.thingsStuff = xmlDoc.getElementsByTagName("ATCWaypoint");
        window.sbFlightNo = prompt("Enter the flight number: ");
        window.sbDep = window.thingsStuff[0].id;
        window.sbArr = window.thingsStuff[window.thingsStuff.length - 1].id;
        window.sbNames = [];
        window.sbCoords = [];
        window.gFSmapCoords = [];
        for (let i = 1; i < window.thingsStuff.length - 1; i++) {
            window.sbNames.push(window.thingsStuff[i].id);
            window.sbCoords.push(window.dmsA_to_decimal(window.thingsStuff[i].children[1].innerHTML));
        }
        window.extraStr = prompt("Add waypoints to the end of the SimBrief flight plan or type N/A: ");
        if (window.extraStr !== "N/A") {
            var route = window.extraStr.split(" ");
            for (var i = 0; i < route.length; i++) { //Route encodement
                window.altitude = "null";
                //Fix name and altitudes
                    if (route[i].indexOf("@") > 0) { //There should be something before the altitude restriction
                    window.altitude = route[i].substr(route[i].indexOf("@")+1);
                    window.fixName = route[i].substr(0, route[i].indexOf("@"));
                    } else {
                        window.altitude = "null";
                        window.fixName = route[i];
                    }
                //Fix position
                    window.coords = "null,null";
                    if (window.fixName.indexOf(",") >= 0) {
                        window.coords = window.fixName;
                        window.sbNames.push(window.fixName);
                        window.sbCoords.push([Number(window.coords.substring(0, window.coords.indexOf(","))), Number(window.coords.substring(window.coords.indexOf(",")+1)), (window.altitude == "null") ? -1 : Number(window.altitude)]);
                    } else {
                        console.log("searching for coordinate...");
                        window.coords = await window.getFixCoords(window.fixName);
                        if (window.coords !== "null,null") { //Only add in waypoints that the databases found.
                            window.sbNames.push(window.fixName);
                            window.sbCoords.push([Number(window.coords.substring(0, window.coords.indexOf(","))), Number(window.coords.substring(window.coords.indexOf(",")+1)), (window.altitude == "null") ? -1 : Number(window.altitude)]);
                        } else {
                            alert("The fix " + window.fixName + " was not in any of the 4 databases searched.");
                        }
                    }
            }
        }
        window.encodedRoute = '["' + window.sbDep + '","' + window.sbArr + '","' + window.sbFlightNo + '",[';
        for (let i = 0; i < window.sbNames.length; i++) {
            if (!geofs.api.map.flightPathOn) {
                    geofs.api.map.createPath();
                }
            if (window.sbCoords[i][2] == -1) {
                window.encodedRoute += `["${window.sbNames[i]}",${window.sbCoords[i][0]},${window.sbCoords[i][1]},null,false,null],`;
            } else {
                window.encodedRoute += `["${window.sbNames[i]}",${window.sbCoords[i][0]},${window.sbCoords[i][1]},${window.sbCoords[i][2]},false,null],`;
                window.gFSmapCoords.push([window.sbCoords[i][0], window.sbCoords[i][1]]);
                console.log("Added point " + window.sbNames[i] + "at" + window.sbCoords[i]);
            }
        }
        geofs.api.map.setPathPoints(window.gFSmapCoords);
        geofs.api.map.stopCreatePath();
        window.encodedRoute = window.encodedRoute.substring(0,window.encodedRoute.length-1) + "]]";
        document.getElementById("fltPln").value = window.encodedRoute;
    }

    window.dmsA_to_decimal = function(dmsA) { //Returns an array with [the latitude as a decimal, the longitude as a decimal, the altitude as a decimal].
        var degLat = Number(dmsA.substring(1,dmsA.indexOf("°")));
        var minLat = Number(dmsA.substring(dmsA.indexOf("°")+2, dmsA.indexOf("'")));
        var secLat = Number(dmsA.substring(dmsA.indexOf("'")+2, dmsA.indexOf('"')));

        var dmsB = dmsA.includes("E") ? dmsA.substring(dmsA.indexOf("E")): dmsA.substring(dmsA.indexOf("W"));
        var degLon = Number(dmsB.substring(1,dmsB.indexOf("°")));
        var minLon = Number(dmsB.substring(dmsB.indexOf("°")+2, dmsB.indexOf("'")));
        var secLon = Number(dmsB.substring(dmsB.indexOf("'")+2, dmsB.indexOf('"')));

        var altitude = Number(dmsA.substring(dmsA.lastIndexOf(",")+1));
        var decimalLat = dmsA.includes("N") ? (degLat + (minLat/60) + (secLat/3600)) : 0 - (degLat + (minLat/60) + (secLat/3600)); //If it doesn't include N, it includes S, so negate the value.
        var decimalLon = dmsA.includes("E") ? (degLon + (minLon/60) + (secLon/3600)) : 0 - (degLon + (minLon/60) + (secLon/3600)); //If it doesn't include E, it includes W, so negate the value.
        return [decimalLat, decimalLon, altitude];
    }

    window.openFMCPopup = function() {
        if (!window.fltPlnDiv) {
            window.fltPlnDiv = document.createElement("div");
            window.fltPlnDiv.style.background = "white";
            window.fltPlnDiv.style.left = "30%";
            window.fltPlnDiv.style.right = "30%";
            window.fltPlnDiv.style.overflow = "scroll";
            window.fltPlnDiv.style.paddingBottom = "2%";
            window.fltPlnDiv.classList = "geofs-stopKeyboardPropagation";
            document.body.appendChild(window.fltPlnDiv);
        }
        window.fltPlnDiv.innerHTML = window.databaseInited ? //The difference is the submit button color, in case you were wondering.
            `<fieldset>
    <button style="right: 0px; position: absolute; background: none; border: none; cursor: pointer;" onclick="window.closeFMCPopup()">X</button>
    <div>
    <span>Route (No SIDs, STARs, or airways): </span><input class="geofs-preferences-key-detect mdl-textfield__input is-focused" id="rte" data-bind=", mdlTextfield:true" style="width: fit-content">
    </div>
    <br>
    <div>
    <span>Departure airport ICAO: </span><input class="geofs-preferences-key-detect mdl-textfield__input" data-bind=", mdlTextfield:true" id="dep" style="width: fit-content">
    </div>
    <br>
    <div>
    <span>Arrival airport ICAO: </span><input class="geofs-preferences-key-detect mdl-textfield__input" data-bind=", mdlTextfield:true" id="arr" style="width: fit-content">
    </div>
    <br>
    <div>
    <span>Flight Number: </span><input class="geofs-preferences-key-detect mdl-textfield__input" data-bind=", mdlTextfield:true" id="fltNo" style="width: fit-content">
    </div>
    <br>
    <button id="submit" onclick="window.submitPlan()" style="color: black">Submit</button>
    <br>
    <p>Result:</p>
    <input class="geofs-preferences-key-detect mdl-textfield__input" id="fltPln" contenteditable="false" style="width: fit-content; height: fit-content;">
    <br>
    <br>
    <p style="width: 250px">Or, upload a SimBrief file (scroll down to Flight Plan Downloads and click "Download" next to the FS2020 format) for automatic flight plan entry.</p>
    <input type="file" id="sbFileUpload"><br>
    <button id="sbSubmit" onclick="window.submitSBPlan()">Submit SimBrief flight plan</button>
    <br>
    <br>
    <p style="width: 250px">Or, paste in a route in the format with all of the brackets to show the route on the map.</p>
    <input class="geofs-preferences-key-detect mdl-textfield__input is-focused" data-bind=", mdlTextfield:true" style="width: fit content;" id="cpa"><br>
    <button id="cpaSubmit" onclick="window.cpa002FlightPlan()">Submit Route</button>
    </fieldset>` :
   `<fieldset>
    <button style="right: 0px; position: absolute; background: none; border: none; cursor: pointer;" onclick="window.closeFMCPopup()">X</button>
    <div>
    <span>Route (No SIDs, STARs, or airways): </span><input class="geofs-preferences-key-detect mdl-textfield__input is-focused" id="rte" data-bind=", mdlTextfield:true" style="width: fit-content">
    </div>
    <br>
    <div>
    <span>Departure airport ICAO: </span><input class="geofs-preferences-key-detect mdl-textfield__input" data-bind=", mdlTextfield:true" id="dep" style="width: fit-content">
    </div>
    <br>
    <div>
    <span>Arrival airport ICAO: </span><input class="geofs-preferences-key-detect mdl-textfield__input" data-bind=", mdlTextfield:true" id="arr" style="width: fit-content">
    </div>
    <br>
    <div>
    <span>Flight Number: </span><input class="geofs-preferences-key-detect mdl-textfield__input" data-bind=", mdlTextfield:true" id="fltNo" style="width: fit-content">
    </div>
    <br>
    <button id="submit" onclick="window.submitPlan()" style="color: gray">Submit</button>
    <br>
    <p>Result:</p>
    <input class="geofs-preferences-key-detect mdl-textfield__input" id="fltPln" contenteditable="false" style="width: fit-content; height: fit-content;">
    <br>
    <br>
    <p style="width: 250px">Or, upload a SimBrief file (scroll down to Flight Plan Downloads and click "Download" next to the FS2020 format) for automatic flight plan entry.</p>
    <input type="file" id="sbFileUpload"><br>
    <button id="sbSubmit" onclick="window.submitSBPlan()" style="color: gray">Submit SimBrief flight plan</button>
    <br>
    <br>
    <p style="width: 250px">Or, paste in a route in the format with all of the brackets to show the route on the map.</p>
    <input class="geofs-preferences-key-detect mdl-textfield__input is-focused" data-bind=", mdlTextfield:true" style="width: fit content;" id="cpa"><br>
    <button id="cpaSubmit" onclick="window.cpa002FlightPlan()" style="color: gray">Submit Route</button>
    </fieldset>
    `;
    }

    window.submitSBPlan = async function() {
        let sbFile = document.getElementById("sbFileUpload");
        let sbText = await sbFile.files[0].text().then( (value) => {window.sbXML = value;}, (error) => {console.error("error")});
        window.simbriefFlightPlan(window.sbXML);
    }

//Get ready for a function where every line has a comment!
window.getFixCoords = async function(theName) { //Function to get the coordinates of a GPS fix/VOR/airport ICAO. Returns a string in the format lat,lon
    window.result = "null,null"; //This will stay that way if no fixes are found.
    let namesArray = []; //The array with each full name
    let coordsArray = []; //The array with each set of coordinates (as strings)

    //First database (X-plane via Qantas94Heavy)
    let lines = window.data2.split('\n'); //Split each line into an item in the lines array
    for (let line of lines) { //For each line in the lines array,
        let parts = line.split(/\s+/); //Split it based on this voodoo expression (I think it splits it based on spaces, but it doesn't care about how many consecutive spaces there are),
        if (parts[3] === theName) { //If the fourth element (the fix identifier) is the target identifier,
            namesArray.push('(DB1) ' + line); //Add the name
            coordsArray.push(parts[1] + ',' + parts[2]); //Add the coordinates
        }
    }

    //Second database (Navaids GPX)
    for(let i = 0; i < window.waypoints.length; i++) { //Loop through each waypoint
        let waypoint = window.waypoints[i]; //Current waypoint variable
        let name = waypoint.getElementsByTagName("name")[0].textContent; //Waypoint name
        if(name === theName) { //If the waypoint identifier matches the target identifier,
            namesArray.push('(DB2) ' + waypoint.getElementsByTagName("navaid:name")[0].textContent + " country: " + waypoint.getElementsByTagName("navaid:country")[0].textContent); //Add the name
            coordsArray.push(waypoint.getAttribute("lat") + ',' + waypoint.getAttribute("lon")); //Add the coordinates
        }
    }
    //Third database (OpenAIP Navaids)
    if (theName.length == 3) { //VORs, DMEs, etc.
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < window.navaids3[i].items.length; j++) {
                if (window.navaids3[i].items[j].identifier == theName) {
                    namesArray.push('(DB3) ' + window.navaids3[i].items[j].name + "in country " + window.navaids3[i].items[j].country);
                    coordsArray.push(window.navads3[i].items[j].geometry.coordinates[0] + ',' + window.navaids3[i].items[j].geometry.coordinates[1]);
                }
            }
        }
    }
    //Fourth database (OpenAIP Reporting points)
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < window.navaids4[i].items.length; j++) {
            if (window.navaids4[i].items[j].name == theName) {
                if (window.navaids4[i].items[j].compulsory) {
                    namesArray.push('(DB4) ' + window.navaids4[i].items[j].name + " in country " + window.navaids4[i].items[j].country);
                } else {
                    namesArray.push('(DB4) ' + window.navaids4[i].items[j].name + " in country " + window.navaids4[i].items[j].country + " with remarks " + window.navaids4[i].items[j].remarks); //Remarks are only in non-compulsory reporting points
                }
                coordsArray.push(window.navaids4[i].items[j].geometry.coordinates[0] + ',' + window.navaids4[i].items[j].geometry.coordinates[1]);
            }
        }
    }
    if (namesArray.length == 0) { //If the names array is empty (no variables found),
        console.warn(`Our databases could not find the waypoint ${theName}.`); //blog it
    } else if (namesArray.length == 1) { //If the names array only has one thing,
        console.log(`${theName} has the coordinates ${coordsArray[0]} and a name of ${namesArray[0]}`); //That one thing must be it
        window.result = coordsArray[0]
    } else { //If the length isn't 0 or 1,
        let tMsg = "There are multiple waypoints in the databases for " + theName + ". Type the number of the correct database or -1 if the waypoint isn't on the list:\n"; //Set a message variable to the start of the prompt
        for (var i = 0; i < namesArray.length; i++) { //loop through each waypoint
            tMsg += i + ": Name: " + namesArray[i] + ", Coordinates: " + coordsArray[i] + "\n"; //Add the waypoint info to the message
        }
        let fixIndex = prompt(tMsg); //Prompt the user and store the input to fixIndex
        let fI = Number(fixIndex); //fI stands for fixIndex; the difference is now it's a number and can be used as one.
        if (fI !== -1) { //If fI is -1, the user decided the waypoints listed weren't what they were looking for, so don't change the result variable
            window.result = coordsArray[fI]; //Store the coordinates to the return value (result)
        }
    }
    return window.result; //return the result
} //End getFixCoords function

    window.submitPlan = async function() {
        if (!window.databaseInited) {
            alert("Wait for the waypoint database to initialize.");
            return;
        }
            window.altitude = "";
            window.fixName = "";
            window.coords = "";
            var depICAO = document.getElementById("dep").value;
            var arrICAO = document.getElementById("arr").value;
            var flightNo = document.getElementById("fltNo").value;
            var route = document.getElementById("rte").value.split(" ");
            var encodedRte = '["' + depICAO + '","' + arrICAO + '","' + flightNo + '",[';
            console.log("Departure: " + depICAO + ", Arrival: " + arrICAO);

            for (var i = 0; i < route.length; i++) { //Route encodement
                //Fix name and altitudes
                    if (route[i].indexOf("@") > 0) { //There should be something before the altitude restriction
                    window.altitude = route[i].substr(route[i].indexOf("@")+1);
                    window.fixName = route[i].substr(0, route[i].indexOf("@"));
                    } else {
                        window.altitude = "null";
                        window.fixName = route[i];
                    }
                //Fix position
                    window.coords = "undefined";
                    window.isReal = "false"; //If the fix isn't in the database, pretend it's a real fix.
                    if (window.fixName.indexOf(",") >= 0) {
                        window.coords = window.fixName;
                    } else {
                        console.log("searching for coordinate...");
                        window.coords = await window.getFixCoords(window.fixName);
                        if (window.coords === "null,null") { //Pretend it's a real fix if it's not in the database and hope for the best.
                            window.isReal = "true";
                        }
                    }
                //Add flight path
                if (!geofs.api.map.flightPathOn) {
                    geofs.api.map.createPath();
                }
                if (window.coords !== 'null,null') {
                    geofs.api.map.flightPath.addLatLng({ lat: Number(window.coords.substring(0,window.coords.indexOf(","))), lng: Number(window.coords.substring(window.coords.indexOf(",")+1))});
                    console.log("Added point " + window.fixName + "at" + window.coords);
                }
                //Route insertion
                    encodedRte += `["${window.fixName}",${window.coords},${window.altitude},${window.isReal},null],`;
            }
            geofs.api.map.stopCreatePath();
            encodedRte = encodedRte.substring(0,encodedRte.length-1) + "]]";
            console.log("The flight plan was generated:");
            document.getElementById("fltPln").value = encodedRte;
            console.log(encodedRte);
        }
    window.closeFMCPopup = function() {
        window.fltPlnDiv.innerHTML = ``;
    }
})();

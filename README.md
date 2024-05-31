Installation process:  
Step 1: Copy the contents of 'userscript.js' into your clipboard  
Step 2: If you haven't already, download tapermonkey (https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo//Open)  
Step 3: Press the Extensions icon on the toolbar at the top of your browser and click on the icon that looks like a rounded square with two eyes at the bottom, and press "Dashboard"  
Step 4: Press the little "+" tab, and paste your clipboard contents into the big text box, and click "install".  
Step 5: Open GeoFS, and it should work!  
  
If you _want_ to make your life _harder_, instead of following the installation process, bookmark the userscript.js file and each time you refresh or visit GeoFS, open the bookmark, copy the code, go to the GeoFS tab, press f12, Ctrl+Shift+I, or Cmd+Shift+I, and paste the code into the console.  
  
  
To create a flight plan, either:  
A: Go to GeoFS, click on the ``FLIGHT PLAN`` button at the bottom AFTER THE CABIN DING SOUND, enter your route in the format of either ICAO@Altitude, ICAO, LAT,LON@Altitude, or LAT,LON, with each waypoint separated by spaces. Then enter your departure and arrival airport ICAOs, and the flight number in their text boxes, and click ``Submit``. Then, if message boxes pop up asking you to select a waypoint, type in the number that corresponds to the correct waypoint or -1 if none of the waypoints match the correct one. After the process completes, open the nav panel and see your route on the map, and/or copy the text from the Result text box and paste it into the FMC Load tab, and fly the route! Or,  
B: Import a flight plan from Simbrief by finding the Flight Plan Downloads section, and clicking Download next to FS2020. Then, go to GeoFS and click on the ``FLIGHT PLAN`` button at the bototm AFTER THE CABIN DING SOUND, and click ``Choose File`` then ``Submit``. You will be prompted to provide the flight number and any additional waypoints in the format of either ICAO@Altitude, ICAO, LAT,LON@Altitude, or LAT,LON, with each waypoint separated by spaces. If there are duplicate waypoints, when prompted, type in the number that corresponds to the correct waypoint or -1 if none of the waypoints match the correct one. Open the nav panel and see your route on the map, and/or copy the text from the Result text box and paste it into the FMC Load tab, and fly the route!  
  
A technical note in a technical font: ``The generator uses 4 waypoint databases: Opennav's navaids.gpx file, X-Plane's earth_fix.dat file provided by Qantas94Heavy, and 2 databases from OpenAIP.net``

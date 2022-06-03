var express = require('express');
var router = express.Router();

const axios = require('axios').default;

/**
 * Komplette GET Abfrage bezüglich einer VBB Verbindung von Punkt A nach Punkt B.
 */

router.post('/', function(req, res, next) {

    var from = req.body['from'];
    var to = req.body['to'];

    var from_street = from.address;
    var from_city = from.city;
    var from_postalcode = from.postalcode

    var to_street = to.address;
    var to_city = to.city;
    var to_postalcode = to.postalcode;

    if (from == null) {
        res.status(400);
        res.render('noparameter', { errorstatus: 'Parameter from wurde nicht gefunden!'});
    } else if (to == null) {
        res.status(400);
        res.render('noparameter', { errorstatus: 'Parameter to wurde nicht gefunden!'})
    } else {
        
        const requestFrom = axios.get(`https://nominatim.openstreetmap.org/search?street=${from_street}&city=${from_city}&postalcode=${from_postalcode}&format=jsonv2`, {
            headers: {
                'Content-Type': 'Saaltofreak.de'
            }
        });

        const requestTo = axios.get(`https://nominatim.openstreetmap.org/search?street=${to_street}&city=${to_city}&postalcode=${to_postalcode}&format=jsonv2`, {
            headers: {
                'Content-Type': 'Saaltofreak.de'
            }
        });

        axios.all([requestFrom, requestTo]).then(axios.spread((...responses) => {
            const responseFrom = responses[0].data;
            const responseTo = responses[1].data;

            const fromJSON = {
                "lat": responseFrom[0].lat,
                "long": responseFrom[0].lon,
                "address": from_street
            };

            const toJSON = {
                "lat": responseTo[0].lat,
                "long": responseTo[0].lon,
                "address": to_street
            };
    
            getBVGData(fromJSON, toJSON)
                .then(response => {
                    var tripTimeInSeconds = 0;
                    // Stackoverflow Help: https://stackoverflow.com/questions/2024198/how-do-i-calculate-how-many-seconds-between-two-dates
                    var tripStops = response['journeys'][0]['legs']
                    tripStops.forEach(element => {
                        var departureTime = new Date(element.departure)
                        var arrivalTime = new Date(element.arrival)
                        var diffTime = arrivalTime.getTime() - departureTime.getTime()

                        var Seconds_from_dep_to_arr = diffTime / 1000;
                        var Seconds_Between_Times = (Math.abs(Seconds_from_dep_to_arr) + element.departureDelay + element.arrivalDelay);
                        tripTimeInSeconds += Seconds_Between_Times

                    });

                    //found: https://www.codegrepper.com/code-examples/javascript/convert+seconds+to+hours+minutes+seconds+javascript
                    var hours = Math.floor(tripTimeInSeconds / 3600);
                    var minutes = Math.floor((tripTimeInSeconds - (hours * 3600)) / 60);
                    var seconds = tripTimeInSeconds - (hours * 3600) - (minutes * 60);

                    if (hours   < 10) {hours   = "0"+hours;}
                    if (minutes < 10) {minutes = "0"+minutes;}
                    if (seconds < 10) {seconds = "0"+seconds;}

                    const endTime = {
                        "hours": hours.toString(),
                        "minutes": minutes.toString(),
                        "seconds": seconds.toString()
                    }
                    console.log(endTime);
                    res.json(endTime)
                });
        }))
    } 
});

function getBVGData(from, to) {

    try {
        return axios.get(`https://v5.bvg.transport.rest/journeys?from.latitude=${from.lat}&from.longitude=${from.long}&from.address=${from.address}&to.latitude=${to.lat}&to.longitude=${to.long}&to.address=${to.address}&results=0&startWithWalking=false`, {
        }).then(response => response.data)
    } catch (error) {return error};
    
}

module.exports = router;
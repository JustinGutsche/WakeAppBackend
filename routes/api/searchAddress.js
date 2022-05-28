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
                    res.json(response)
                });
        }))
    } 
});

function getBVGData(from, to) {

    try {
        return axios.get(`https://v5.bvg.transport.rest/journeys?from.latitude=${from.lat}&from.longitude=${from.long}&from.address=${from.address}&to.latitude=${to.lat}&to.longitude=${to.long}&to.address=${to.address}`, {
        }).then(response => response.data)
    } catch (error) {return error};
    
}

module.exports = router;
const REDIRECT_SERVICE = 'https://traffic-cop.herokuapp.com/https-redirect';
const XMLFEED = 'http://webservices.nextbus.com/service/publicXMLFeed';
const SOURCE_NAME = 'nextbus';
const LAYER_NAME = 'bus-locations';
const INTERVAL_SECONDS = 10;
const INTERVAL_MILLISECONDS = INTERVAL_SECONDS * 1000;

mapboxgl.accessToken = 'pk.eyJ1IjoibW1pc2VuZXIiLCJhIjoiY2tpbnNodXAyMTYzaDJ5cnh2MzhhZTdrOSJ9.2kqiWW_ezo14wsaONE-MjQ';

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [-122.4390, 37.7666],
  zoom: 11
});

map.on('load', () => {
  // add empty source
  map.addSource(SOURCE_NAME, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: []
    }
  });
  map.addLayer({
    id: LAYER_NAME,
    source: SOURCE_NAME,
    type: 'circle',
    paint: {
      'circle-radius': 6,
      'circle-color': '#B42222'
    }
  });

  map.on('mouseenter', LAYER_NAME, function() {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', LAYER_NAME, function() {
    map.getCanvas().style.cursor = '';
  });

  map.on('click', LAYER_NAME, function(e) {
    if (Object.keys(e.features[0].properties).length > 0) {
      var htmlStr = '<div><ul>';
      Object.entries(e.features[0].properties).forEach(entry => {
        htmlStr = htmlStr.concat(`<li>${entry[0]}: ${entry[1]}</li>`)
      });
      htmlStr.concat('</ul></div>')

      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(htmlStr)
        .addTo(map);
    }
  });

  // update now
  updateSource();

  //   // update every intervalSeconds
  //   setInterval(function() {
  //     updateSource();
  //   }, INTERVAL_MILLISECONDS);
});

function updateSource() {
  let agency = document.querySelector('#agency').value;
  let url = `${REDIRECT_SERVICE}?url=${XMLFEED}?command=vehicleLocations&a=${agency}&t=0`
  console.log(url);
  fetch(url, {
      mode: "no-cors"
    })
    .then(response => response.text())
    .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
    .then(xmlDoc => xmlDoc.getElementsByTagName("vehicle"))
    .then(xmlFeatures => {
      let features = [];
      for (i = 0; i < xmlFeatures.length; i++) {
        let feature = xmlFeatures[i];
        let parsedFeature = {
          "type": "Feature",
          "properties": {
            "id": feature.getAttribute("id"),
            "routeTag": feature.getAttribute("routeTag"),
            "secsSinceReport": feature.getAttribute("secsSinceReport"),
            "heading": feature.getAttribute("heading"),
            "speedKmHr": feature.getAttribute("speedKmHr")
          },
          "geometry": {
            "type": "Point",
            "coordinates": [
              parseFloat(feature.getAttribute("lon")),
              parseFloat(feature.getAttribute("lat"))
            ]
          }
        };
        features.push(parsedFeature);
      };
      return features
    })
    .then(features => {
      if (features.length > 0) {
        let featureCollection = {
          type: 'FeatureCollection',
          features: features
        }
        map.getSource(SOURCE_NAME).setData(featureCollection);
        let bounds = turf.bbox(featureCollection);
        map.fitBounds(bounds, {
          padding: 20
        });
      } else {
        alert(`No active vehicles found for ${agency}.`)
      }
    });
}

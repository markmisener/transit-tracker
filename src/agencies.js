const REDIRECT_SERVICE = 'https://traffic-cop.herokuapp.com/http-redirect';
const XMLFEED = 'http://webservices.nextbus.com/service/publicXMLFeed?command=agencyList'
const URL = `${REDIRECT_SERVICE}?url=${XMLFEED}`

fetch(URL)
  .then(response => response.text())
  .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
  .then(xmlDoc => xmlDoc.getElementsByTagName("agency"))
  .then(xmlFeatures => {
    let features = [];
    for (i = 0; i < xmlFeatures.length; i++) {
      let feature = xmlFeatures[i];
      if (feature.getAttribute("regionTitle") === "California-Northern") {
        let parsedFeature = {
          "tag": feature.getAttribute("tag"),
          "title": feature.getAttribute("title")
        }
        features.push(parsedFeature)
      }
    }
    return features
  })
  .then(parsedFeatures => {
    let agencySelect = document.getElementById('agency');

    let existingOptions = [];
    for (i = 0; i < agencySelect.options.length; i++){
      existingOptions.push(agencySelect.options[i].value);
    }

    for (i = 0; i < parsedFeatures.length; i++) {
      let feature = parsedFeatures[i];
      if (!existingOptions.includes(feature.tag)) {
        agencySelect.options.add(new Option(feature.title, feature.tag));
      }
    }
  })

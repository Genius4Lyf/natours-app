export const displayMap = (locations) => {
  // Initialize the map with options to make it non-interactive.
  // We set a default view, which will be used if there are no locations,
  // or overridden by fitBounds if locations exist.
  var map = L.map('map', {
    dragging: false, // Enable map dragging
    touchZoom: false, // Disable pinch zoom on touch devices
    scrollWheelZoom: false, // Disable zoom with mouse scroll wheel
    doubleClickZoom: false, // Disable zoom on double click
    boxZoom: false, // Disable box zoom (shift-drag)
    keyboard: false, // Disable keyboard navigation (arrow keys, +/-)
    zoomControl: false, // Disable the default +/- zoom control buttons
  }).setView([34.111745, -118.113491], 10); // Default view, zoom level might be less critical if fitBounds is used

  // Create the tile layer
  const tileLayer = L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  ).addTo(map);

  // Apply a greyscale CSS filter to the tile layer to make it black and white
  tileLayer.getContainer().style.filter = 'grayscale(100%)';

  // This replaces the Mapbox-specific code for markers and bounds.

  // 1. Create an array to store the latitude and longitude of each marker.
  // This will be used later to calculate the collective bounds of all markers.
  const markerCoordinates = [];

  // 2. Iterate over each location object in the 'locations' array.
  // 'locations' was parsed from the 'data-locations' attribute of your map HTML element.
  locations.forEach((loc) => {
    // const el = document.createElement('div'); // This line is not needed
    // el.className = 'marker';                  // This line is not needed
    // Define your custom icon
    const customIcon = L.divIcon({
      className: 'marker', // Your CSS class for the marker
      html: '',
      iconSize: [30, 40],
      iconAnchor: [15, 40],
    });

    // Create ONE marker using the custom icon
    const marker = L.marker([loc.coordinates[1], loc.coordinates[0]], {
      icon: customIcon, // Apply the custom icon here
    }).addTo(map);

    // Change from popup to tooltip for always-visible description above the marker
    if (loc.description) {
      marker.bindTooltip(
        // Content for the tooltip
        `<p>${loc.description}</p><p>${loc.address || ''}</p>`,
        {
          permanent: true, // Makes the tooltip always visible
          direction: 'top', // Positions the tooltip above the marker's anchor
          offset: [0, -45], // Adjusts position: [horizontal, vertical]. Negative vertical moves it up.
          // Given icon height 40px, -45px places it 5px above the icon.
        },
      );
    }

    markerCoordinates.push([loc.coordinates[1], loc.coordinates[0]]);
  });

  // 7. After all markers have been created and their coordinates collected:
  //    Check if there are any marker coordinates to process.
  if (markerCoordinates.length > 0) {
    // 8. Create a 'LatLngBounds' object using the collected marker coordinates.
    //    This object represents the smallest rectangle that contains all the markers.
    const bounds = L.latLngBounds(markerCoordinates);

    // 9. Adjust the map's view to fit these bounds.
    //    - map.fitBounds() automatically calculates the appropriate zoom level.
    //    - The optional 'padding' option adds some space around the bounds,
    //      so markers aren't right at the edge of the map. E.g., [50, 50] for 50px padding.
    //    - 'maxZoom' option in fitBounds can prevent zooming in too far if there's only one marker.
    //    - 'animate: true' will make the transition smooth.
    map.fitBounds(bounds, {
      padding: [200, 100], // Add padding around the markers
      animate: true, // Enable animation for fitBounds
      duration: 1, // Optional: duration of the animation in seconds (e.g., 1 second)
    });
  }
};

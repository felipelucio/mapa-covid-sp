import leaflet from 'leaflet';
import sp_shp from './data/shape_sp.json';

// color of the selected feature
const SELECT_COLOR = 'rgb(255,255,0)';

// scale colors
const SCALE_COLORS = [
    {'range': [0,0], 'color':'rgb(255,255,255)'}, 
    {'range': [1,5], 'color': 'rgb(253,252,221)'},
    {'range': [6,10], 'color': 'rgb(252,237,204)'}, 
    {'range': [11,15], 'color': 'rgb(254,220,193)'},
    {'range': [16,20], 'color': 'rgb(254,203,180)'}, 
    {'range': [21,25], 'color': 'rgb(250,185,176)'}, 
    {'range': [26,30], 'color': 'rgb(246,169,174)'},
    {'range': [31,35], 'color': 'rgb(232,159,184)'},
    {'range': [36,40], 'color': 'rgb(218,154,188)'},
    {'range': [41,45], 'color': 'rgb(204,148,191)'},
    {'range': [46,50], 'color': 'rgb(193,142,188)'},
    {'range': [51,100], 'color': 'rgb(171,140,186)'}
];

// default zoom level
const DEFAULT_ZOOM = 10.2;

// minimal zoom level
const MIN_ZOOM = 9;

// maximum zoom level
const MAX_ZOOM = 13;

export default class MapViewer {
    constructor(options) {
        if (options) {
            this._options = {
                select_color: options['select_color'] || SELECT_COLOR,
                scale_colors: options['scale_colors'] || SCALE_COLORS,
                default_zoom: options['default_zoom'] || DEFAULT_ZOOM,
                min_zoom: options['min_zoom'] || MIN_ZOOM,
                max_zoom: options['max_zoom'] || MAX_ZOOM,
            };
        }

        // the leaflet map object
        this._map = null;


        this._onEachFeature = this._onEachFeature.bind(this);
    }

    // sets the style of geojson/leaflet features 
    _style(feature) {
        return {
            fillColor: '#F00',
            weight: 1,
            opacity: 1,
            color: 'white',
            fillOpacity: 0.8
        }
    }

    _featureMouseOver(e) {
        console.log('highlight ', e.target);
    }

    _featureMouseOut(e) {
        console.log('reset highlight ', e.target);
    }

    _featureClick(e) {
        console.log('feature clicked', e.target);
    }

    _onEachFeature(feature, layer) {
        layer.on({
            mouseover: this._featureMouseOver,
            mouseout: this._featureMouseOut,
            click: this._featureClick
        });
    }

    load(root_el) {
        this._map = leaflet.map(root_el)
            .setView([-21, -51], 8);

        this.cities_layer = leaflet.geoJSON(sp_shp.features, {
            style: this._style,
            onEachFeature: this._onEachFeature
        }).addTo(this._map);
    }

    get option() {
        return this._options;
    }

    setOptions(options) {
        Object.keys(options).forEach((key, val) => {
            if (this._options[key] !== undefined)
                this._options[key] = val;
        });
    }
}

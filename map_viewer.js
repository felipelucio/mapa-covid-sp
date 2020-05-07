var MapViewer = {
    _dataset: null,
    _available_dates: [],
    _selected_date: null,
    _selected_feature: null,

    _map: null,
    _choropleth_layer: null,
    _choropleth_features: null,
    _selection_layer: null,
    _selection_features: null,

    //======================
    // HTML elements
    //======================
    _root_el: null,
    // + date selector 
    _date_slider_el: null,
    _date_slider_label_el: null,
    _datelist_el: null,
    // + info box
    _info_box: null,
    _info_box_title: null,
    _info_box_total: null,


    init: function(root_el) {
        this._root_el = document.getElementById(root_el);
        this._date_slider_el = document.getElementById('date-selector-input');
        this._date_slider_label_el = document.getElementById('date-selector-label');
        this._datelist_el = document.getElementById('available-dates');

        this._info_box = document.getElementById('info-box');
        this._info_box_title = this._info_box.getElementsByClassName('title-text')[0];
        this._info_box_total = this._info_box.getElementsByClassName('total-text')[0];

        this._load();
    },

    _load: function() {
        var that = this;
        // load the map
        this._map = geo.map({
            node: this._root_el,
            center: { x: -46.63644541794065, y: -23.669851138320273 },
            clampBoundsX: true,
            clampBoundsY: true,
            zoom: 10.2,
            max: 12,
            min: 9
        });

        // create the layers
        this._choropleth_layer = this._map.createLayer('feature');
        this._selection_layer = this._map.createLayer('feature');

        // add the event listener on the date slider
        this._date_slider_el.addEventListener('change', function (ev) {
            var id = ev.srcElement.value;
            that.setSelectedDate(id);
            that._update();
            that.updateInfoBox(that._selected_feature);
        });

        this._fetch('data/DEINFO_DISTRITO.json', function (map_data) {
            // create the choropleth layer
            that._choropleth_features = that._choropleth_layer
                .createFeature('choropleth')
                .data(map_data.features)
                .choropleth({
                    colorRange: ['rgb(255,255,255)', 'rgb(255,204,204)',
                        'rgb(255,153,153)', 'rgb(255,102,102)', 'rgb(255,50,50)', 'rgb(255,0,0)']
                })
                .choropleth('geoId', function (district) { return district.properties.NOME_DIST });

            // adds the mouseclick event on the selection_layer, unselecting all
            that._selection_layer
                .geoOn(geo.event.mouseclick, function (ev) {
                    that._selected_feature = false;
                    that._selection_features.modified();
                    that._selection_features.draw();
                });

            // adds the selection features
            that._selection_features = that._selection_layer
                .createFeature('polygon', { selectionAPI: true })
                .data(map_data.features)
                .style({
                    fillColor: 'rgb(255,255,0)',
                    fillOpacity: function (el, iel, data, idata) {
                        if (data.properties.NOME_DIST == that._selected_feature) return 1;
                        return 0;
                    },
                    stroke: true,
                    strokeOpacity: 1,
                    strokeWidth: 1,
                    strokeColor: 'rgb(0,0,0)'
                })
                .geoOff(geo.event.feature.mouseclick)
                .geoOff(geo.event.feature.mouseover)
                .geoOff(geo.event.feature.mouseout)
                .geoOn(geo.event.feature.mouseclick, function (ev) {
                    that._selected_feature = ev.data.properties.NOME_DIST;
                    that.updateInfoBox(that._selected_feature);
                    this.modified();
                    this.draw();
                })
                .polygon(function (d) {
                    return {
                        outer: d.geometry.coordinates[0]
                    }
                })
                .position(function (d) {
                    return { x: d[0], y: d[1] }
                });

            console.log('loading data')
            that._fetch('data/dataset.json', function (data) {
                that._dataset = data;
                
                // loads all availables dates and select the most recent
                var keys = Object.keys(that._dataset.dataset);
                that._available_dates = keys.map(function (e) { return parseInt(e) });
                var last_date_idx = that._available_dates.length - 1;
                that.setSelectedDate(last_date_idx);

                //set available dates control
                that._date_slider_el.setAttribute('value', last_date_idx);
                that._date_slider_el.setAttribute('max', last_date_idx);
                that._available_dates.forEach(function (date, i) {
                    var el = document.createElement('option');
                    el.setAttribute('value', i);
                    el.setAttribute('label', date);
                    that._datelist_el.appendChild(el);
                });

                that._update();
            });
        });
    },

    _fetch: function(path, cb) {
        let xhr = new XMLHttpRequest()
        xhr.open("GET", path, true);
        xhr.onload = function() {
            let json = JSON.parse(xhr.response);
            cb(json);
        }
        xhr.send()
    },

    _update: function() {
        this._choropleth_features
            .scalar(this.getSelectedDataset().map(function (district) {
                return {
                    value: district.total,
                    id: district.id
                }
            }));
        this._choropleth_features.modified();
        this._choropleth_features.draw();
        this._selection_features.draw();


        this.updateInfoBox(0);
    },

    
    updateInfoBox: function(feature_id) {
        var dataset = this.getSelectedDataset();
        var district = dataset.filter(function (el) {
            return el.id == feature_id;
        });
        
        if(district[0]) {
            this._info_box_title.textContent = this.getDistrictName(feature_id);
            this._info_box_total.textContent = district[0].total;
        }
    },
    
    setSelectedDate: function(id) {
        this._selected_date = this._available_dates[id];
    },

    getSelectedDataset: function() {
        return this._dataset.dataset[this._selected_date];
    },

    getDistrictName: function(NOME_DIST) {
        return this._dataset.names[NOME_DIST];
    }
}

MapViewer.init('map');

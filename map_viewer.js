var MapViewer = {
    SELECT_COLOR: 'rgb(255,255,0)',
    SCALE_COLORS: [
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
    ],
    FONT_SIZE: 4,
    DEFAULT_ZOOM: 10.2,
    MIN_ZOOM: 9,
    MAX_ZOOM: 13,

    _dataset: null,
    _available_dates: [],
    _selected_date: null,
    _selected_feature: null,
    _dataset_range: { min: 0, max:0 },

    _map: null,
    _selection_layer: null,
    _selection_features: null,
    _text_layer: null,
    _text_features: null,

    //======================
    // HTML elements
    //======================
    _root_el: null,
    
    // + date selector 
    _date_selector: null,
    _date_slider_el: null,
    _date_slider_label_el: null,
    _datelist_el: null,
    
    // + info box
    _info_box: null,
    _info_box_title: null,
    _info_box_total: null,

    // + menu
    _menu_toggle_title: null,
    _menu_toggle_infobox: null,
    _menu_toggle_dateselector: null,

    toggleBox: function(state, el) {
        if(state) {
            el.classList.remove('hide')
        } else {
            el.classList.add('hide')
        }
    },

    init: function(root_el) {
        var that = this;

        this._root_el = document.getElementById(root_el);
        this._date_selector = document.getElementById('date-selector');
        this._date_slider_el = document.getElementById('date-selector-input');
        this._date_slider_label_el = document.getElementById('date-selector-label');
        this._datelist_el = document.getElementById('available-dates');

        this._info_box = document.getElementById('info-box');
        this._info_box_none = this._info_box.getElementsByClassName('none')[0];
        this._info_box_info = this._info_box.getElementsByClassName('info')[0];
        this._info_box_title = this._info_box.getElementsByClassName('title-text')[0];
        this._info_box_total = this._info_box.getElementsByClassName('total-text')[0];

        this._menu_toggle_title = document.getElementById('toggle-title');
        this._menu_toggle_title.addEventListener('change', function(ev) {
            that.toggleBox(ev.srcElement.checked, that._title_box)
        })
        this._menu_toggle_infobox = document.getElementById('toggle-info-box');
        this._menu_toggle_infobox.addEventListener('change', function(ev) {
            that.toggleBox(ev.srcElement.checked, that._info_box)
        });
        this._menu_toggle_dateselector = document.getElementById('toggle-date-selector');
        this._menu_toggle_dateselector.addEventListener('change', function(ev) {
            that.toggleBox(ev.srcElement.checked, that._date_selector)
        })

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
            zoom: this.DEFAULT_ZOOM,
            min: this.MIN_ZOOM,
            max: this.MAX_ZOOM
        });
                  

        // create the polygons layer
        this._selection_layer = this._map.createLayer('feature');
        this._selection_layer.geoOn(geo.event.mouseclick, function(ev) {
            that._selected_feature = null;
            that._selection_features.modified();
            that._selection_features.draw();
            that.updateInfoBox(that._selected_feature);
        });

        this._selection_features = this._selection_layer
            .createFeature('polygon', { selectionAPI: true })
            .style({
                fillColor: function (el, iel, data, idata) {
                    if (data.properties.NOME_DIST == that._selected_feature) return that.SELECT_COLOR;

                    var value = that.getValueById(data.properties.NOME_DIST);
                    if (value) return that._getValueColor(value);
                    return 'rgb(255,255,255)';
                },
                fillOpacity: 1,
                stroke: true,
                strokeOpacity: 1,
                strokeWidth: 0.5,
                strokeColor: 'rgb(80,80,80)'
            })
            .geoOff(geo.event.feature.mouseclick)
            .geoOff(geo.event.feature.mouseover)
            .geoOff(geo.event.feature.mouseout)
            .geoOn(geo.event.feature.mouseclick, function (ev) {
                that._selected_feature = ev.data.properties.NOME_DIST;
                that.updateInfoBox(that._selected_feature);
                //this.modified();
                //this.draw();
            })
            .polygon(function (d) {
                return {
                    outer: d.geometry.coordinates[0]
                }
            })
            .position(function (d) {
                return { x: d[0], y: d[1] }
            });
        
        // create the text layer
        this._text_layer = this._map.createLayer('feature', {features:['text']});
        this._text_features = that._text_layer.createFeature('text')
            .style({
                textScaled: 13
            })
            .position(function(d) {
                var coordinates = d.geometry.coordinates[0].map(function(coord) {
                    return {
                        x: coord[0],
                        y: coord[1],
                        z: 0
                    };
                })
                var center = geo.util.centerFromPerimeter(coordinates);
                return {
                    x: center.x,
                    y: center.y
                }
            })
            .text(function(district) {
                return that.getDistrictName(district.properties.NOME_DIST);
            });

        // add the event listener on the date slider
        this._date_slider_el.addEventListener('input', function (ev) {
            var id = ev.srcElement.value;
            that.setSelectedDate(id);
            that._update();
            that.updateInfoBox(that._selected_feature);
            var date = that.getSelectedDate().date;
            var week = that.getSelectedDate().week;
            that._date_slider_label_el.innerText = date.substr(8, 2) + "/" + date.substr(5, 2) + " (Semana " + week + ")";
        });

        this._fetch('data/DEINFO_DISTRITO.json', function (map_data) {
            // adds the selection features
            that._selection_features.data(map_data.features);
            // add the text features
            that._text_features.data(map_data.features);

            console.log('loading data')
            that._fetch('data/dataset.json', function (data) {
                that._dataset = data;
                
                // order the dates
                data.dataset.sort(function(a, b) {
                    if (a.week < b.week) return -1;
                    if (a.week > b.week) return 1;
                    return 0;
                })

                // loads all availables dates and select the most recent
                that._available_dates = data.dataset.map(function (e, i) { return i; });
                var last_date_idx = that._available_dates.length - 1;
                that.setSelectedDate(last_date_idx);

                //set available dates control
                that._date_slider_el.setAttribute('value', last_date_idx);
                that._date_slider_el.setAttribute('max', last_date_idx);
                var date = that.getSelectedDate().date;
                var week = that.getSelectedDate().week;
                that._date_slider_label_el.innerText = date.substr(8, 2) + "/" + date.substr(5, 2) + " (Semana " + week + ")";
                
                that._calcDataRange('total');

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
        this._selection_features.modified();
        this._text_features.modified();
        this._selection_features.draw();
        this._text_features.draw();

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
            this._info_box_none.classList.remove('on');
            this._info_box_none.classList.add('off');
            this._info_box_info.classList.remove('off');
            this._info_box_info.classList.add('on');
        } else {
            this._info_box_title.textContent = "";
            this._info_box_total.textContent = "";
            this._info_box_none.classList.remove('off');
            this._info_box_none.classList.add('on');
            this._info_box_info.classList.remove('on');
            this._info_box_info.classList.add('off');
        }
    },
    
    setSelectedDate: function(id) {
        this._selected_date = this._available_dates[id];
    },

    getSelectedDate: function() {
        return this._dataset.dataset[this._selected_date];
    },

    getSelectedDataset: function() {
        return this.getSelectedDate().data;
    },

    getDistrictName: function(NOME_DIST) {
        return this._dataset.names[NOME_DIST];
    },

    getValueById: function(NOME_DIST, value='total') {
        var return_value = false;
        if(this.getSelectedDataset())
            this.getSelectedDataset().forEach(function(district) {
                if(district.id == NOME_DIST)
                    return_value = district[value];
            });
        
        return return_value;
    },

    _calcDataRange: function(field) {
        var that = this;
        var max = 0;
        var min = 0;
        Object.keys(this._dataset.dataset).forEach(function(date) {
            that._dataset.dataset[date].data.forEach(function(feature) {
                if (feature[field] < min) min = feature[field];
                if (feature[field] > max) max = feature[field];
            });
        })

        this._dataset_range.min = min;
        this._dataset_range.max = max;
    },

    _getValueColor: function(value) {
        // if it is zero, return as the first color
        for(i in this.SCALE_COLORS) {
            if(value >= this.SCALE_COLORS[i].range[0] && value <= this.SCALE_COLORS[i].range[1])
                return this.SCALE_COLORS[i].color;
        }

        return 'rgb(0,0,0)';
    }
}

MapViewer.init('map');

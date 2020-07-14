import MapViewer from './map_viewer';

window.addEventListener('load', () => {
    const menu = document.getElementsByClassName('menu')[0];
    const menu_link = document.getElementsByClassName('menu-link')[0];
    const bottom_menu = document.getElementsByClassName('bottom-menu')[0];
    const bottom_menu_link = document.getElementsByClassName('bottom-menu-link')[0];
    
    // add the menu show/hide on click
    menu_link.addEventListener('click', function(ev) {
        ev.stopPropagation();
        menu.classList.toggle('active');

        return false;
    });

    // add the bottom menu show/hide on click
    bottom_menu_link.addEventListener('click', function(ev) {
        ev.stopPropagation();
        bottom_menu.classList.toggle('active');

        return false;
    });

    let map = new MapViewer();
    map.load('map');
})



// ==UserScript==
// @name         Remix Lister for Discogs
// @namespace    http://tampermonkey.net/
// @version      2026-09-16
// @description  Lists distinct mixes/remixes of a Discogs master release.
// @author       splatert
// @match        https://www.discogs.com/master/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=discogs.com
// @grant        none
// ==/UserScript==




function createTable() {

    var header = document.createElement('div');
    header.style.marginBottom = "10px";
    header.style.borderBottom = '1px solid #e5e5e5';
    header.innerHTML = '<span style="font-size: 16px; font-weight: bold;">Mixes/Remixes</span><br><span>Only distinct track titles will be shown.</span>';

    var table = document.createElement('table');
    table.id = 'remix-list';

    var tr = document.createElement('tr');
    tr.innerHTML = '<th style="width: 0;">Cover</th><th>Release</th><th>Track</th><th>Duration</th><th>Year</th>';
    
    table.style.display = 'none';
    table.append(tr);

    var tlist = document.getElementById('release-tracklist');
    
    tlist.parentElement.append(header);
    tlist.parentElement.append(table);

    return table;
}


function drawEntry(u, i, r, t, d, y) {
    var table = document.getElementById('remix-list');
    if (table) {

        table.style.tableLayout = 'auto';
        table.style.borderCollapse = 'collapse';


        var url = '';
        var img = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQAgMAAADzfxo+AAAADFBMVEXd3d3FxcWtra2ampo+KaCKAAABH0lEQVR42u2SMU7DQBBFv81KRlBgpDSpwg1yhaFL6Sb3oKTD4jTIVQoKuiziAtyBggIkTIWlbPzRCmSvvSMUlDZPcuGn/3dW2sGBvXnQ5FZxSYueFH+Q7pw8op6caLKK6hllrSUlksbbOKlOv8Q/6lMMuJ/xlvZGwmS66Mq9TBJ4RBCQtfOPJz7ThsljALn/Qpkn+Qo4R3A/4AICM04KBD6Zh0kpy2Lh//pkWskKMC4BTqqye5/tjGdvm69NM6ftzmQNwBmaIhjUOLiJP6DsV2ZZZO0pX/jJdino+JE1XVCHI0DUtgkl4VADeB/I32Q9kHfw2Kvxhj3STqOHI/AaScAiktZGktDX22r1NcYkFKPVnZJUBulQk+3O9Wsc2J9v1IpiyJuEExsAAAAASUVORK5CYII=';
        var rel = 'Untitled'
        var title = 'Untitled Track';
        var dur = '--:--';
        var year = 'NA';


        if (u) {
            url = u;
        }
        if (i) {
            img = i;
        }
        if (r) {
            rel = r;
        }
        if (t) {
            title = t;
        }
        if (d) {
            dur = d;
        }
        if (y) {
            year = y;
        }


        var tr = document.createElement('tr');
        tr.style.textAlign = 'center';

        tr.innerHTML = '<td><img style="height:24px;" src="'+img+'"></td><td><a style="color: #2653d9 !important" href="'+url+'">'+rel+'</a></td><td>'+title+'</td><td>'+dur+'</td><td>'+year+'</td>';


        table.append(tr);

    }
}



function getMasterID(){
    var masterID = document.querySelector('[class^="id_"]');
    if (masterID) {
        masterID = masterID.innerText;
        masterID = masterID.replace(/\D/g, "");
        
        return masterID;
    }
}


function getTracks(rels) {

    rels.forEach(rel => {

        console.log('connect: ' + rel);

        try {
            fetch(rel)
            .then(response => {
                if (!response.ok) {
                    console.log('err');
                }
                return response.json();
            })
            .then(release => {
                console.log(release);
            })
        }
        catch (err) {
            console.log(err);
        }
        
    });

}


function getReleases() {
    var masterID = getMasterID();
    if (masterID) {

        var releases = [];
        var tracks = [];
        
        fetch('https://api.discogs.com/masters/'+masterID+'/versions')
            .then(response => {
                if (!response.ok) {
                    console.log('Error connecting to Discogs API.');
                }
                return response.json();
            })
            .then(master => {
                var vers = master['versions'];
                vers.forEach(ver => {
                    

                    fetch(ver['resource_url'])
                    .then(response => {
                        if (!response.ok) {
                            console.log('err');
                        }
                        return response.json();
                    })
                    .then(release => {

                        for (let i = 0; i < release['tracklist'].length; i++) {

                            var data = {
                                'u': '',
                                'i': '',
                                'r': '',
                                't': '',
                                'd': '',
                                'y': ''
                            };

                            if (release['uri']) {
                                data['u'] = release['uri'];
                            }
                            if (release['year']) {
                                data['y'] = release['year'];
                            }


                            for (let l = 0; l < release['labels'].length; l++) {
                                if (l < 2) {
                                    data['r'] += release['labels'][l]['name'];
                                    if (release['labels'][l+1]) {
                                        data['r'] += ', ';
                                    }
                                }
                                else {
                                    continue;
                                }
                            }
                            if (release['labels'].length > 2) {
                                data['r'] += '...';
                            }


                            if (release['thumb']) {
                                data['i'] = release['thumb'];
                            }


                            if (release['tracklist'][i]['type_'] == 'track') {
                                var t = release['tracklist'][i]['title'];

                                var alreadyExists = false;
                                tracks.forEach(track => {
                                    if (track['t'] == t) {
                                        alreadyExists = true;
                                    }
                                });

                                if (alreadyExists) {
                                    continue;
                                }
                                else {
                                    data['t'] = t;

                                    if (release['tracklist'][i]['duration']) {
                                        data['d'] = release['tracklist'][i]['duration'];
                                    }

                                }

                            }
                            else {
                                continue;
                            }

                            tracks.push(data);
                            drawEntry(data['u'], data['i'], data['r'], data['t'], data['d'], data['y']);
                        }


                        console.log(tracks);

                    })

                });
            })
        
        
    }
}



function createMainButton() {
    var btn = document.createElement('button');
    btn.style.padding = '4px';
    btn.style.color = 'white';
    btn.style.background = '#0f0f0f';
    btn.style.border = 'unset';
    btn.style.borderRadius = '2px';
    btn.style.fontWeight = 'bold';
    btn.innerText = "Show";

    var tlist = document.getElementById('release-tracklist');
    tlist.parentElement.append(btn);

    return btn;

}


(function() {
    'use strict';
    setTimeout(() => {
        
        var table = createTable();
        var btn = createMainButton();

        btn.addEventListener('click', function(){
            table.style.display = 'table';
            btn.remove();
            getReleases();
        })


    }, 2000);
})();
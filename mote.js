var data;
var graph,graph2;

function loadData(d,attr){

	// Remove extra newlines at the end
	d = d.replace(/[\n\r]$/,"");

	data = CSV2JSON(d,[{'name':'unixdate','format':'number'},
								{'name':'date','format':'date'},
								{'name':'T','format':'number'},
								{'name':'L','format':'number'}
	]);

	processLoad();

	return this;
}

function processLoad(){

	if(data && data.length > 0){

		var temp = [];
		var light = [];
		var s1 = new Array();
		var s2 = new Array();

		// Assume all the gas and electric points have the same dates for the same rows (may not be true though
		for(var i = 0; i < data.length ; i++){
			if(data[i].date){
				s1.push({x:data[i].date,y:data[i].T,err:0.5,date:(data[i].date).toISOString()});
				s2.push({x:data[i].date,y:data[i].L,date:(data[i].date).toISOString()});
			}
		}
		temp.push({
			// Data in the form [{x:x1,y:y1,err:err1},...{x:xn,y:yn,err:errn}]
			data: s1,
			color: '#D60303',
			points: { show: true, radius: 3 },
			lines: { show: false ,width: 1 },
			title: 'LoRaWAN mote',
			clickable: false,
			hoverable: true,
			// Modify the default hover text with replacements
			hover: {
				text: 'Temperature: <strong>{{y}}'+parseHTML('&deg;')+'C</strong><br />{{date}}',
				before: '{{title}}<br />'
			},
			css: {
			  'font-size': '0.8em',
			  'background-color': 'white',
			  'color': 'black',
			  'padding': '1em',
			  'border-radius': '0px'
			}
		});

		if(graph){
			graph.updateData(temp);
		}else{
			S('#temperature').css({"width":"100%","height":"350px","margin-bottom":"16px"});
			graph = $.graph('temperature', temp, {
				xaxis: { 'label': 'Date/time', 'mode': 'time' },
				yaxis: { 'label': 'Temperature / '+parseHTML('&deg;')+'C' },
				zoommode: "x",
				hoverable: true,
				grid: { hoverable: true, clickable: true, show: false, background: 'transparent', color: 'rgba(0,0,0,1)', colorZoom: 'rgba(214,3,3,0.2)' }
			});
		}

		light.push({
			data: s2,
			color: '#F9BC26',
			points: { show: true, radius: 3 },
			lines: { show: false ,width: 1 },
			title: 'LoRaWAN mote',
			clickable: false,
			hoverable: true,
			// Modify the default hover text with replacements
			hover: {
				text: 'Light: <strong>{{y}}</strong><br />{{date}}',
				before: '{{title}}<br />'
			},
			css: {
			  'font-size': '0.8em',
			  'background-color': 'white',
			  'color': 'black',
			  'padding': '1em',
			  'border-radius': '0px'
			}
		})
		if(graph2){
			graph2.updateData(light);
		}else{
			S('#light').css({"width":"100%","height":"350px","margin-bottom":"16px"});
			graph2 = $.graph('light', light, {
				xaxis: { 'label': 'Date/time', 'mode': 'time' },
				yaxis: { 'label': 'Ambient light' },
				zoommode: "x",
				hoverable: true,
				grid: { hoverable: true, clickable: true, show: false, background: 'transparent', colorZoom: 'rgba(249,188,38,0.2)' }
			});
		}
	}
}


// Return array of string values, or NULL if CSV string not well formed.
function CSVtoArray(text) {
	var re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
	var re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
	// Return NULL if input string is not well formed CSV string.
	if (!re_valid.test(text)) return null;
	var a = [];                     // Initialize array to receive values.
	text.replace(re_value, // "Walk" the string using replace with callback.
		function(m0, m1, m2, m3) {
			// Remove backslash from \' in single quoted values.
			if      (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
			// Remove backslash from \" in double quoted values.
			else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
			else if (m3 !== undefined) a.push(m3);
			return ''; // Return empty string.
		});
	// Handle special case of empty last value.
	if (/,\s*$/.test(text)) a.push('');
	return a;
};

function CSV2JSON(data,format,start,end){

	if(typeof start!=="number") start = 1;
	var delim = ",";

	if(typeof data==="string"){
		data = data.replace(/\r/,'');
		data = data.split(/[\n]/);
	}
	if(typeof end!=="number") end = data.length;

	if(data[0].indexOf("\t") > 0) delim = /\t/;

	var line,datum;
	var newdata = new Array();
	for(var i = start; i < end; i++){
		line = CSVtoArray(data[i]);
		datum = {};
		if(line){
			for(var j=0; j < line.length; j++){
				if(format[j]){
					if(format[j].format=="number"){
						if(line[j]!=""){
							if(line[j]=="infinity" || line[j]=="Inf") datum[format[j].name] = Number.POSITIVE_INFINITY;
							else datum[format[j].name] = parseFloat(line[j]);
						}
					}else if(format[j].format=="eval"){
						if(line[j]!="") datum[format[j].name] = eval(line[j]);
					}else if(format[j].format=="date"){
						if(line[j]) datum[format[j].name] = new Date(line[j].replace(/^"/,"").replace(/"$/,""));
						else datum[format[j].name] = null;
					}else if(format[j].format=="boolean"){
						if(line[j]=="1" || line[j]=="true" || line[j]=="Y") datum[format[j].name] = true;
						else if(line[j]=="0" || line[j]=="false" || line[j]=="N") datum[format[j].name] = false;
						else datum[format[j].name] = null;
					}else{
						datum[format[j].name] = (line[j][0]=='"' && line[j][line[j].length-1]=='"') ? line[j].substring(1,line[j].length-1) : line[j];
					}
				}else{
					datum[j] = (line[j][0]=='"' && line[j][line[j].length-1]=='"') ? line[j].substring(1,line[j].length-1) : line[j];
				}
			}
			newdata.push(datum);
		}
	}
	return newdata;
}

function parseHTML(txt){
	var div = document.createElement("div");
	div.innerHTML = txt;
	return div.innerHTML;
}


S(document).ready(function(){

	function getData(){
		S().ajax('data.csv',{'complete':loadData,'this':this,'cache':false,'error':function(e){ console.log('error',e) }});
	}

	// Update every 10 minutes
	var intervalID = window.setInterval(getData, 3000);
	getData();

});




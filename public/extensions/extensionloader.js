/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

$(document).ready(function() {

loadJSON(init);

function init(config){    
    var Extensions = config.Extensions;
    var loaderconfig = {"initialload":false}
    Extensions.forEach(element => {
        let path = "extensions/"+element.name+"/contents/";
        element.filestoload.cssfiles.forEach(ele => {loadjscssfile((path+ele), 'css')});
        element.filestoload.jsfiles.forEach(ele => {loadjscssfile((path+ele), 'js')});
    });
    document.addEventListener('loadextension',function(e){
        loaderconfig.Viewer = e.detail.viewer;
        e.detail.viewer.loadExtension(e.detail.extension);
    })
    document.addEventListener('unloadextension',function(e){
        e.detail.viewer.unloadExtension(e.detail.extension);
    })
    document.addEventListener('viewerinstance',function(e){
        loaderconfig.Viewer = e.detail.viewer;
        if (!loaderconfig.initialload) {
            loadStartupExtensions();
            loaderconfig.initialload = true;
        }
        document.getElementById(config.ListConfig.ListId).style.display = 'block';
        if(config.InbuiltExtensionsConfig && config.InbuiltExtensionsConfig.CreateList === "true") ListInbuiltExtensions();
        if(config.ListConfig && config.ListConfig.CreateList === "true") CreateList();
    });

    function loadStartupExtensions(){
        Extensions.forEach(element => {
            if (element.loadonstartup === "true") {
                loaderconfig.Viewer.loadExtension(element.name);
            }
        });
    }    

    function CreateList() {        
        var list = document.getElementById(config.ListConfig.ListId);
        var ExtensionList = '';
        let index = 0;
        Extensions.forEach(element => {
            if (element.includeinlist === "true") {                
                let name = element.name;
                let checked, moredetails = '';
                
                if(element.bloglink) moredetails = '<br>Details:  <a target="_blank" href="'+element.bloglink+'">Blog link</a> ';
                if(element.loadonstartup === 'true') checked = ' checked ';
                ExtensionList += '<label><input class="checkextension" type="checkbox"'+checked+' name="'+name+'" value="'+name+'" data-index="'+index+'"> '+element.displayname+'</label>&nbsp;<i class="fas fa-info-circle exl_wrapper"><span class="exl_tooltip">'+element.description+moredetails+' </span></i><br>';
            }
            index++;
        });
        list.innerHTML = ExtensionList;
        var checkbox = document.getElementsByClassName('checkextension');
        var descs = document.querySelectorAll('[data-toggle="popover"]');
        for (var i=0; i < checkbox.length; i++) {
            checkbox.item(i).onclick = togglecustomextension;
        }
        $('[data-toggle="popover"]').popover();
        function togglecustomextension(e) {
            console.log(e.target.value)
            if (e.target.checked) {
                loaderconfig.Viewer.loadExtension(e.target.value,Extensions[parseInt(this.dataset.index)].options)
            } else {
                loaderconfig.Viewer.unloadExtension(e.target.value)
            }
        }     
    }

    function ListInbuiltExtensions() {
        let Extensions = config.InbuiltExtensions;
        let list = document.getElementById(config.InbuiltExtensionsConfig.ListId);
        let ExtensionList = '';
        for (let index = 0; index < Extensions.length; index++) {
            let element = Extensions[index];
            if (element.includeinlist !== "false") {                
                let checked = '';
                if(element.default === 'true') checked = ' checked ';
                ExtensionList += '<label><input class="checkextensionbuiltin" type="checkbox"'+checked+' name="'+element.name+'" value="'+element.name+'"> '+element.name.slice(9,element.name.length)+'</label><br>';
            }
            
        };
        list.innerHTML = ExtensionList;
        let checkbox = document.getElementsByClassName('checkextensionbuiltin');
        for (var i=0; i < checkbox.length; i++) {
            checkbox.item(i).onclick = togglebuiltinextension;
        }
        function togglebuiltinextension(e) {
            console.log(e.target.value)
            if (e.target.checked) {
                loaderconfig.Viewer.loadExtension(e.target.value)
            } else {
                loaderconfig.Viewer.unloadExtension(e.target.value)
            }
        }
    }

    function loadjscssfile(filename, filetype){
        if (filetype=="js"){ 
            var fileref=document.createElement('script')
            fileref.setAttribute("type","text/javascript")
            fileref.setAttribute("src", filename)
        }
        else if (filetype=="css"){ 
            var fileref=document.createElement("link")
            fileref.setAttribute("rel", "stylesheet")
            fileref.setAttribute("type", "text/css")
            fileref.setAttribute("href", filename)
        }
        if (typeof fileref!="undefined");
        document.getElementsByTagName("head")[0].appendChild(fileref);
    }
}   

function loadJSON(callback) {   
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', 'extensions/config.json', true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(JSON.parse(xobj.responseText));
        }
    };
    xobj.send(null);  
}

});
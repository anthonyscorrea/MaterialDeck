import * as MODULE from "../MaterialDeck.js";

export class StreamDeck{
    constructor() {
        this.pluginId;
        this.tokenHealthContext;
        this.tokenNameContext;
        this.tokenACContext;
        this.buttonContext = [];
        for (let i=0; i<23; i++){
            this.buttonContext[i] = undefined;
        }
        this.playlistTrackBuffer = [];
        this.playlistSelector = 0;
        this.trackSelector = 0;
        for (let i=0; i<23; i++)
            this.playlistTrackBuffer[i] = {state: 3, name: ""};
        this.playlistBuffer = [];
        for (let i=0; i<3; i++)
            this.playlistBuffer[i] = {state: 3, name: ""};
        this.counter = 0;

        let canvasBox = document.createElement('div');
        canvasBox.id = 'sdCanvasBox';
        document.body.appendChild(canvasBox); // adds the canvas to the body element

        this.syllableRegex = /[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi;
    }

    setScreen(action){
       
    }

    setContext(action,context,coordinates = {column:0,row:0},settings){
        const data = {
            context: context,
            action: action,
            settings: settings
        }
        let num = coordinates.column + coordinates.row*8;
        this.buttonContext[num] = data;
    }

    clearContext(action,coordinates = {column:0,row:0}){
        let num = coordinates.column + coordinates.row*8;
        this.buttonContext[num] = undefined;
        if (this.getActive(action) == false){
            if (action == 'token') MODULE.tokenControl.active = false; 
            else if (action == 'macro') MODULE.macroControl.active = false; 
            else if (action == 'combattracker') MODULE.combatTracker.active = false; 
            else if (action == 'playlist') MODULE.playlistControl.active = false;
            else if (action == 'soundboard') MODULE.soundboard.active = false;
            else if (action == 'other') MODULE.otherControls.active = false;
        }
    }

    getActive(action){
        for (let i=0; i<this.buttonContext.length; i++){
            if (this.buttonContext[i] != undefined && this.buttonContext[i].action == action)
                return true;
        }
        return false;
    }

    
    /*
    *  Get syllables of a word. Taken from: https://stackoverflow.com/a/49407494
    */
    syllabify(words) {
        return words.match(this.syllableRegex);
    }

    formatTitle(txt){
        let txtArrayOriginal = txt.split("\n");
        let txtArray = [];
        let counter = 0;
        for (let i=0; i<txtArrayOriginal.length; i++){
            
            let txtArrayTemp = txtArrayOriginal[i].split(" ");
            for (let j=0; j<txtArrayTemp.length; j++){
                txtArray[counter] = txtArrayTemp[j];
                counter++;
            }
        }
        let txtNew = "";
        let newTxtArray = ['','','','','','','','','','','','','','','','','','','',''];
        counter = 0;
        for (let i=0; i<txtArray.length; i++){
            
            let txtNewPart = txtArray[i];
            
            if (txtNewPart != undefined && txtNewPart.length > 10){
                let syllables = this.syllabify(txtNewPart);

                for (let j=0; j<syllables.length; j++){
                    if (syllables.length == 0){
                        newTxtArray[counter] = txtNewPart;
                        counter++;
                    }
                    else if (syllables[j+1] == undefined){
                        newTxtArray[counter] = syllables[j];
                        counter++;
                    }
                    else if ((syllables[j].length+syllables[j+1].length) < 10){
                        newTxtArray[counter] = syllables[j]+syllables[j+1]; 
                        if (syllables.length-2 > j) newTxtArray[counter] += '-';
                        counter++;
                        j++;
                    }
                    else {
                        newTxtArray[counter] = syllables[j];
                        if (syllables.length > j) newTxtArray[counter] += '-';
                        counter++;
                    }
                }
            }
            else{
                newTxtArray[counter] = txtNewPart;
                counter++;
            }
        }
        for (let i=0; i<counter; i++){
            if (txtNew.length > 0)
                txtNew += "\n";
            if (i<counter-1 && newTxtArray[i].length + newTxtArray[i+1].length < 10) {
                txtNew += newTxtArray[i] + " " + newTxtArray[i+1];
                i++;
            }
            else
                txtNew += newTxtArray[i];
        }
        return txtNew;
    }

    setTitle(txt,context){
        txt = this.formatTitle(txt);
        for (let i=0; i<32; i++){
            if (this.buttonContext[i] == undefined) continue;
            if (this.buttonContext[i].context == context) {
                if (this.buttonContext[i].txt != undefined)
                    if (this.buttonContext[i].txt == txt) 
                        return;
                this.buttonContext[i].txt = txt;
            }
        }
        let msg = {
            event: 'setTitle',
            context: context,
            payload: {
                title: txt,
                target: 0
            }
        };
        MODULE.sendWS(JSON.stringify(msg));
    }
    
    setColor(context,color = '#000000'){
        let msg = {
            event: 'setIcon',
            context: context,
            url: '',
            format: 'color',
            background: color
        };
        MODULE.sendWS(JSON.stringify(msg));
    }

    setImage(image,context){
        //var image = "data:image/svg+xml;charset=utf8,<?xml version=\"1.0\" encoding=\"iso-8859-1\"?><!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  --><svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"	 viewBox=\"0 0 288 288\" style=\"enable-background:new 0 0 288 288;\" xml:space=\"preserve\">	 <style>	 	.text {			 font-family: sans-serif;			 fill: red;			 font-size: 10em;		 }	</style><g>  <text x=\"0px\" y=\"100px\"  class=\"text\">GPUUTILIZATION</text></g></svg>";

        var json = {
            event: "setImage",
            context: context,
            payload: {
            image: "" + image,
            target: 0
            }
        };
        MODULE.sendWS(JSON.stringify(json));
    }

    setIcon(iconLocation, context,src,background = '#000000',ring=0,ringColor = "#000000",overlay=false){
        for (let i=0; i<32; i++){
            if (this.buttonContext[i] == undefined) continue;
            if (this.buttonContext[i].context == context) {
                if (this.buttonContext[i].icon == src && this.buttonContext[i].ring == ring && this.buttonContext[i].ringColor == ringColor && this.buttonContext[i].background == background && this.buttonContext[i].iconLocation == iconLocation) 
                    return;
                this.buttonContext[i].icon = src;
                this.buttonContext[i].ring = ring;
                this.buttonContext[i].ringColor = ringColor;
                this.buttonContext[i].background = background;
                this.buttonContext[i].iconLocation = iconLocation;
            }
        }
        
        let split = src.split('.');
        //filter out stuff from Tokenizer
        let format = split[split.length-1].split('?')[0];
        split = split[0].split(' ');
        if (split[0] == 'fas' || split[0] == 'far' || split[0] == 'fal' || split[0] == 'fad') format = 'icon';
        let msg = {
            event: 'setIcon',
            context: context,
            url: src,
            format: format,
            background: background,
            ring: ring,
            ringColor: ringColor,
            overlay: overlay
        };
        if (iconLocation == 0){
            MODULE.sendWS(JSON.stringify(msg));
        }
        else 
            this.getImage(msg);
    }

    setState(state,context,action){
        let msg = {
            event: 'setStateCustom',
            context: context,
            action: action,
            state: state
        };
        MODULE.sendWS(JSON.stringify(msg));
    }

    setProfile(action,device){
        let profile;
        if (action == 'playlistcontrol')
            profile = 'MaterialDeck-Playlist'
        var json = {
            "source": 1,
            "event": "switchToProfile",
            "context": this.pluginId,
            "device": device,
            "payload": {
                "profile": profile
            }
        };
        MODULE.sendWS(JSON.stringify(json));
    }

    setPluginId(id){
        this.pluginId = id;
    }

    getFAChar = function (name) {
        var elm = document.createElement('i');
        elm.className = name;
        elm.style.display = 'none';
        document.body.appendChild(elm);
        var content = window.getComputedStyle(
            elm, ':before'
        ).getPropertyValue('content')
        document.body.removeChild(elm);
        return content;
    };

    getImage(data){
        if (data == undefined) 
            return;
        //console.log('image',data)
        const context = data.context;
        var url = data.url;
        const format = data.format;
        var background = data.background;
    
        let BGvalid = true;
        if (background.length != 7) BGvalid = false;
        if (background[0] != '#') BGvalid = false;
        for (let i=1; i<background.length; i++)
            if(isNaN(parseInt(background[i],16)))
                BGvalid = false;
        if (BGvalid == false) background = '#000000';

        let canvas;
        let canvasId = 'sdCanvas' + this.counter;
        canvas = document.getElementById(canvasId);
        if (canvas == null){
            canvas = document.createElement('canvas');
            canvas.id = canvasId;
            canvas.width="144";
            canvas.height="144";
            canvas.style="background-color:transparent";
            document.getElementById('sdCanvasBox').appendChild(canvas); // adds the canvas to #someBox
        }
        this.counter++;
        if (this.counter > 31) this.counter = 0;
    
        let ctx = canvas.getContext("2d");
        ctx.filter = "none";
    
        let margin = 0;
        
        if (data.ring != undefined && data.ring > 0){
            ctx.fillStyle = background;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            margin = 10;
            if (data.ring == 2) {
                ctx.fillStyle = data.ringColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = background;
                ctx.fillRect(margin, margin, canvas.width-2*margin, canvas.height-2*margin);
            }
        }
        else {
            ctx.fillStyle = background;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        if (format == 'icon' && url != ""){
            ctx.font = '600 90px "Font Awesome 5 Free"';
            ctx.fillStyle = "gray";
            var elm = document.createElement('i');
            elm.className = url;
            elm.style.display = 'none';
            canvas.appendChild(elm);
            var content = window.getComputedStyle(
            elm, ':before'
            ).getPropertyValue('content')
            canvas.removeChild(elm);
            const iconMeasurement = ctx.measureText(content[1]);
            const horOffset = (144-iconMeasurement.width)/2;
            const vertOffset = 144-(iconMeasurement.actualBoundingBoxAscent-iconMeasurement.actualBoundingBoxDescent)/2;
            ctx.fillText(content[1], horOffset, vertOffset);
        }

        if (format != 'jpg' && format != 'jpeg' && format != 'png' && format != 'webm' && format != 'webp' && format != 'gif' && format != 'svg') url = "modules/MaterialDeck/img/transparant.png";
        if (url == "") url = "modules/MaterialDeck/img/transparant.png"
        let resImageURL = url;
        
        let img = new Image();
        img.setAttribute('crossorigin', 'anonymous');
        img.onload = () => {
            if (format == 'color') ctx.filter = "opacity(0)";
            if (data.overlay) ctx.filter = "brightness(60%)";
            //ctx.filter = "brightness(0) saturate(100%) invert(38%) sepia(62%) saturate(2063%) hue-rotate(209deg) brightness(90%) contrast(95%)";
            var imageAspectRatio = img.width / img.height;
            var canvasAspectRatio = canvas.width / canvas.height;
            var renderableHeight, renderableWidth, xStart, yStart;
    
            // If image's aspect ratio is less than canvas's we fit on height
            // and place the image centrally along width
            if(imageAspectRatio < canvasAspectRatio) {
                renderableHeight = canvas.height;
                renderableWidth = img.width * (renderableHeight / img.height);
                xStart = (canvas.width - renderableWidth) / 2;
                yStart = 0;
            }
    
            // If image's aspect ratio is greater than canvas's we fit on width
            // and place the image centrally along height
            else if(imageAspectRatio > canvasAspectRatio) {
                renderableWidth = canvas.width
                renderableHeight = img.height * (renderableWidth / img.width);
                xStart = 0;
                yStart = (canvas.height - renderableHeight) / 2;
            }
    
            // Happy path - keep aspect ratio
            else {
                renderableHeight = canvas.height;
                renderableWidth = canvas.width;
                xStart = 0;
                yStart = 0;
            }
            ctx.drawImage(img, xStart+margin, yStart+margin, renderableWidth - 2*margin, renderableHeight - 2*margin);
            var dataURL = canvas.toDataURL();
            this.setImage(dataURL,data.context);
        };
        img.src = resImageURL;
    }
}
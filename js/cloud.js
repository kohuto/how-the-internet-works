/* A local teaching model of cloud storage. Account sessions are prepared, not real logins. */
(() => {
  'use strict';
  const CLOUD_USERS={cabin:{id:'ty',name:'Ty'},laptop:{id:'ty',name:'Ty'},friend:{id:'matej',name:'Matěj'}};
  const bytes=text=>new TextEncoder().encode(text).length;
  class CloudStorage {
    constructor() {
      this.serial=1;this.localSerial=0;this.requestSerial=0;this.completed=new Map();
      this.files=new Map([['cloud-1',{id:'cloud-1',name:'Plán na víkend.txt',content:'Ahoj! V sobotu bychom mohli vyrazit na výlet.\nSraz v deset u parku. Vezmi si svačinu a dobrou náladu. 🙂',owner:'matej',version:1,aclVersion:1,permissions:{ty:'read'}}]]);
      this.revision=1;this.replica={revision:1,files:structuredClone(this.files),state:'ready',message:'Výchozí kopie souborů je připravená.'};
      this.local={laptop:[],friend:[],cabin:[]};this.clients={};
      for(const device of Object.keys(CLOUD_USERS))this.clients[device]={state:'idle',message:'',catalog:[],listed:false,sentBytes:0,receivedBytes:0,totalBytes:0,server:'cloud',downloadSerial:0,lastDownload:null,resultSerial:0};
      this.saveLocal('laptop',{name:'Poznámky k projektu.txt',content:'Jak funguje internet\n\nData putují přes domácí síť, routery poskytovatele a datové centrum. Cloudový soubor je uložený na vzdáleném serveru.\nSdílení určuje, kdo si jej smí stáhnout nebo změnit.'});
      this.saveLocal('cabin',{name:'Deník z chaty.txt',content:'Dnes posílám soubor přes satelit. Data pokračují přes pozemní stanici do cloudového centra.'});
      this.saveLocal('friend',{name:'Nápady na výlet.txt',content:'Můžeme vyrazit k rybníku nebo na rozhlednu.\nDomluvíme se podle počasí.'});
    }
    user(device) {return CLOUD_USERS[device];}
    other(device) {return device!=='friend'?CLOUD_USERS.friend:CLOUD_USERS.laptop;}
    access(file,device) {const user=this.user(device);return user&&(file.owner===user.id?'owner':file.permissions[user.id]||'none');}
    metadata(file,device) {
      const access=this.access(file,device);
      return {id:file.id,name:file.name,owner:file.owner,version:file.version,aclVersion:file.aclVersion,size:bytes(file.content),access,
        ...(access==='owner'?{sharing:file.permissions[this.other(device).id]||'none'}:{})};
    }
    snapshot() {return {revision:this.revision,files:structuredClone([...this.files.values()])};}
    replicaCurrent() {return this.replica.revision===this.revision;}
    applyReplica(snapshot) {
      this.replica.files=new Map(snapshot.files.map(f=>[f.id,structuredClone(f)]));
      Object.assign(this.replica,{revision:snapshot.revision,state:'ready',message:'Celá kopie včetně přístupových práv dorazila do centra B.'});
    }
    catalog(device,files=this.files) {return [...files.values()].filter(f=>this.access(f,device)!=='none').map(f=>this.metadata(f,device));}
    saveLocal(device,{id,name,content,cloudId=null,cloudVersion=null}) {
      if(!this.local[device]||typeof name!=='string'||!name.trim()||name.trim().length>70||typeof content!=='string'||content.length>1200)return null;
      let file=this.local[device].find(f=>f.id===id);
      if(file)Object.assign(file,{name:name.trim(),content});
      else {file={id:`local-${++this.localSerial}`,name:name.trim(),content,cloudId,cloudVersion};this.local[device].push(file);}
      return file;
    }
    handle(device,request,server='cloud') {
      if(!this.user(device))return {status:403,message:'Tento účet nemá přístup do cloudu.'};
      if(server==='cloud-backup') {
        if(!['list','download'].includes(request.op))return {status:405,message:'Centrum B poskytuje kopii ke čtení. Změny ulož v centru A.'};
        if(!this.replicaCurrent())return {status:503,message:'Kopie v centru B není aktuální. Nejprve synchronizuj centra, aby platil obsah i přístupová práva.'};
      }
      const files=server==='cloud-backup'?this.replica.files:this.files;
      const mutating=['upload','permissions'].includes(request.op),key=`${this.user(device).id}:${request.requestId}`;
      if(mutating&&request.requestId&&this.completed.has(key))return structuredClone(this.completed.get(key));
      const file=files.get(request.fileId),access=file?this.access(file,device):'none';
      let result;
      if(request.op==='list')result={status:200,message:'Seznam souborů byl načten ze serveru.'};
      else if(request.op==='download') {
        result=!file?{status:404,message:'Soubor na cloudu neexistuje.'}:access==='none'?{status:403,message:'Přístup zamítnut. Vlastník ti nepovolil čtení souboru.'}:
          {status:200,message:'Soubor byl stažen do tohoto notebooku.',file:{...this.metadata(file,device),content:file.content}};
      } else if(request.op==='permissions') {
        if(!file)result={status:404,message:'Soubor na cloudu neexistuje.'};
        else if(access!=='owner')result={status:403,message:'Přístupová práva smí měnit pouze vlastník souboru.'};
        else if(!['none','read','write'].includes(request.permission))result={status:400,message:'Neplatné přístupové právo.'};
        else if(request.aclVersion!==file.aclVersion)result={status:409,message:'Nastavení přístupu se změnilo. Obnov seznam a zkus to znovu.'};
        else {
          file.permissions[this.other(device).id]=request.permission;file.aclVersion++;
          result={status:200,message:'Přístupová práva jsou uložená na serveru.'};
        }
      } else if(request.op==='upload') {
        if(typeof request.name!=='string'||!request.name.trim()||request.name.trim().length>70||typeof request.content!=='string'||request.content.length>1200)result={status:400,message:'Vyplň název do 70 znaků a text do 1200 znaků.'};
        else if(request.fileId&&!file)result={status:404,message:'Původní cloudový soubor neexistuje.'};
        else if(file&&!['owner','write'].includes(access))result={status:403,message:'Přístup zamítnut. K uložení nové verze potřebuješ právo upravovat.'};
        else if(file&&request.version!==file.version)result={status:409,message:'Na cloudu je novější verze. Nejprve ji stáhni; tvoje místní kopie zůstává zachovaná.'};
        else {
          let saved=file;
          if(saved){saved.name=request.name.trim();saved.content=request.content;saved.version++;}
          else {saved={id:`cloud-${++this.serial}`,name:request.name.trim(),content:request.content,owner:this.user(device).id,version:1,aclVersion:1,permissions:{}};this.files.set(saved.id,saved);}
          result={status:file?200:201,message:file?'Nová verze byla uložená na cloudu.':'Soubor byl uložen na cloud. Zatím je soukromý.',saved:this.metadata(saved,device)};
        }
      } else result={status:400,message:'Neznámý požadavek.'};
      result.catalog=this.catalog(device,files);
      if(mutating&&result.status<300)this.revision++;
      if(mutating&&request.requestId&&result.status<300)this.completed.set(key,structuredClone(result));
      return result;
    }
    receive(device,response,localId) {
      const client=this.clients[device];
      client.resultSerial++;
      client.state=response.status<300?'ready':'error';client.message=`${response.status} · ${response.message}`;
      if(response.catalog){client.catalog=response.catalog;client.listed=true;}
      if(response.status>=300)return;
      if(response.file) {
        const f=response.file;
        const local=this.saveLocal(device,{name:f.name,content:f.content,cloudId:f.id,cloudVersion:f.version});
        client.lastDownload=local.id;client.downloadSerial++;
      }
      if(response.saved) {
        const local=this.local[device].find(f=>f.id===localId);
        if(local){local.cloudId=response.saved.id;local.cloudVersion=response.saved.version;}
      }
    }
  }
  Object.assign(globalThis.InternetLab,{CloudStorage,CLOUD_USERS});
})();

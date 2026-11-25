(() => {
  'use strict';
  const {LabSettings,LAB_FEATURES,LAB_DETAILS,esc}=globalThis.InternetLab;
  class SettingsPanel {
    constructor({getSettings,onOpen,onApply,onClose}) {
      this.dialog=document.querySelector('#settings-dialog');
      this.form=this.dialog.querySelector('form');
      this.getSettings=getSettings;this.onOpen=onOpen;this.onApply=onApply;this.onClose=onClose;
      document.querySelector('#open-settings').addEventListener('click',()=>this.open());
      this.dialog.addEventListener('close',()=>{if(this.dialog.open)return;this.onClose();document.querySelector('#open-settings').focus({preventScroll:true});});
      this.dialog.addEventListener('click',e=>{
        const action=e.target.closest('[data-settings-action]')?.dataset.settingsAction;
        if(action==='close'){this.dialog.close();return;}
        if(action==='base'||action==='all'){this.draft=action==='base'?new LabSettings():LabSettings.full();this.render();this.dialog.querySelector(`[data-settings-action="${action}"]`).focus();}
      });
      this.form.addEventListener('change',e=>{
        const {feature,detail}=e.target.dataset;
        if(feature)this.draft=this.draft.toggle(feature,e.target.checked);
        else if(detail)this.draft.details[detail]=e.target.checked;
        else return;
        this.render();this.dialog.querySelector(`[data-${feature?'feature':'detail'}="${feature||detail}"]`).focus({preventScroll:true});
      });
      this.form.addEventListener('submit',e=>{e.preventDefault();this.onApply(new LabSettings(this.draft.toJSON()));this.dialog.close();});
    }
    open() {
      if(this.dialog.open)return;
      this.draft=new LabSettings(this.getSettings().toJSON());this.render();this.dialog.showModal();this.onOpen();
    }
    render() {
      const scroll=this.dialog.querySelector('.settings-scroll'),top=scroll.scrollTop;
      const row=f=>{
        const required=this.draft.requiredBy(f.id),dependency=this.draft.dependencies(f.id).map(id=>LAB_FEATURES.find(f=>f.id===id).label).join(', ');
        return `<label class="settings-option ${required.length?'required':''}"><input type="checkbox" data-feature="${f.id}" ${this.draft.has(f.id)?'checked':''} ${required.length?'disabled':''}><span><strong>${esc(f.label)}</strong><small>${esc(f.description)}</small>${required.length?`<em>Zapnuto pro: ${esc(required.map(f=>f.label).join(', '))}</em>`:dependency?`<em>Zapne také: ${esc(dependency)}</em>`:''}</span></label>`;
      };
      const options=new Map([
        ...LAB_FEATURES.map(f=>[f.id,row(f)]),
        ...LAB_DETAILS.map(d=>[d.id,`<label class="settings-option"><input type="checkbox" data-detail="${d.id}" ${this.draft.details[d.id]?'checked':''}><span><strong>${d.label}</strong><small>${d.description}</small></span></label>`])
      ]);
      const categories=[
        ['Základní',['friend','satellite','mobile','wifi','phone','instagram','chatbot']],
        ['Rozšiřující',['hacker','mitm','printer','vpn','dns','cookies','connection-timing','mail','cloud','devices','nat','ads']]
      ];
      const placed=new Set(categories.flatMap(([,ids])=>ids));
      categories.push(['Pokročilé',[...options.keys()].filter(id=>!placed.has(id))]);
      this.dialog.querySelector('#settings-options').innerHTML=categories.map(([label,ids])=>`<fieldset><legend>${label}</legend><div class="settings-grid">${ids.map(id=>options.get(id)).join('')}</div></fieldset>`).join('');
      const current=this.getSettings(),changed=JSON.stringify(current.toJSON())!==JSON.stringify(this.draft.toJSON());
      this.dialog.querySelector('[type="submit"]').disabled=!changed;
      this.dialog.querySelector('#settings-count').textContent=`Zapnutá rozšíření: ${this.draft.enabled.size} z ${LAB_FEATURES.length}`;
      scroll.scrollTop=top;
    }
  }
  Object.assign(globalThis.InternetLab,{SettingsPanel});
})();

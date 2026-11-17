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
      this.draft=new LabSettings(this.getSettings().toJSON());this.onOpen();this.render();this.dialog.showModal();
    }
    render() {
      const scroll=this.dialog.querySelector('.settings-scroll'),top=scroll.scrollTop;
      const row=f=>{
        const required=this.draft.requiredBy(f.id),dependency=this.draft.dependencies(f.id).map(id=>LAB_FEATURES.find(f=>f.id===id).label).join(', ');
        return `<label class="settings-option ${required.length?'required':''}"><input type="checkbox" data-feature="${f.id}" ${this.draft.has(f.id)?'checked':''} ${required.length?'disabled':''}><span><strong>${esc(f.label)}</strong><small>${esc(f.description)}</small>${required.length?`<em>Zapnuto pro: ${esc(required.map(f=>f.label).join(', '))}</em>`:dependency?`<em>Zapne také: ${esc(dependency)}</em>`:''}</span></label>`;
      };
      this.dialog.querySelector('#settings-options').innerHTML=`<section class="settings-base"><strong>Základ je vždy zapnutý</strong><p>Notebook, domácí switch a router v bytě na Lipové, město Lipov a hosting s webem knihovny.</p></section>${[['areas','Části sítě'],['services','Zařízení a služby']].map(([group,label])=>`<fieldset><legend>${label}</legend><div class="settings-grid">${LAB_FEATURES.filter(f=>f.group===group).map(row).join('')}</div></fieldset>`).join('')}<fieldset><legend>Zobrazované podrobnosti</legend><p class="settings-note">Tyto volby mění zobrazení podrobností. Obsah přenosu je v náhledu paketu viditelný vždy.</p><div class="settings-grid">${LAB_DETAILS.map(d=>`<label class="settings-option"><input type="checkbox" data-detail="${d.id}" ${this.draft.details[d.id]?'checked':''}><span><strong>${d.label}</strong><small>${d.description}</small></span></label>`).join('')}</div></fieldset>`;
      const current=this.getSettings(),changed=JSON.stringify(current.toJSON())!==JSON.stringify(this.draft.toJSON()),networkChanged=!current.sameNetwork(this.draft);
      this.dialog.querySelector('[type="submit"]').disabled=!changed;
      this.dialog.querySelector('#settings-change-note').textContent=!changed?'Vyber části, které chceš přidat.':networkChanged?'Použitím nové sestavy se ukončí současný pokus a připraví nový.':'Změní se jen zobrazení podrobností. Současný pokus zůstane zachovaný.';
      this.dialog.querySelector('#settings-count').textContent=`Zapnutá rozšíření: ${this.draft.enabled.size} z ${LAB_FEATURES.length}`;
      scroll.scrollTop=top;
    }
  }
  Object.assign(globalThis.InternetLab,{SettingsPanel});
})();
